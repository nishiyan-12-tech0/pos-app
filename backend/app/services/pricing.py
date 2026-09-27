"""
金額計算（値引き・消費税）
画面表示用のカート計算と、購入確定時の保存の両方でこの関数を使い、計算ロジックを1か所にまとめる。

計算ルール（2026-09-27 決定）
  ① 割合値引き : 1個あたりで計算し1円未満切り捨て → × 数量
     金額値引き : 1個あたりの値引き額 × 数量
  ② 1個あたりの値引きは単価を上限とする（0円未満にしない）
  ③ 同じ商品に有効な値引きが複数あれば、値引き額が最大の1つだけ適用
  ④ 消費税   : 単価は税抜。税率ごとに対象額を合計し、1回だけ税額を計算して1円未満切り捨て
  ⑤ 期間判定 : 日本時間の「今日」で判定（呼び出し側が on_date を渡す）
  会員値引きは会員IDが指定された場合のみ適用
"""
from dataclasses import dataclass
from datetime import date
from decimal import ROUND_FLOOR, Decimal

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import DiscountCampaign, Member, Product, TaxRate
from app.schemas.cart import CartCalculateResponse, CartItemRequest, CartLine, TaxSummary
from app.schemas.member import MemberResponse


class PricingError(Exception):
    """計算できない入力（未登録の商品・会員など）。APIでは400エラーとして返す"""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


@dataclass
class _Discount:
    campaign: DiscountCampaign
    unit_discount: int


def _floor_yen(value: Decimal) -> int:
    """1円未満切り捨て"""
    return int(value.to_integral_value(rounding=ROUND_FLOOR))


def _unit_discount(campaign: DiscountCampaign, unit_price: int) -> int:
    if campaign.discount_type == "percentage":
        amount = _floor_yen(Decimal(unit_price) * campaign.discount_value / Decimal(100))
    else:  # fixed_amount
        amount = _floor_yen(campaign.discount_value)
    return max(0, min(amount, unit_price))


def _discount_note(campaign: DiscountCampaign, unit_discount: int, quantity: int) -> str:
    return f"{campaign.campaign_name}（-{unit_discount:,}円×{quantity}）"


def _load_tax_rates(db: Session, category_ids: set[str], on_date: date) -> dict[str, Decimal]:
    rows = db.scalars(
        select(TaxRate).where(
            TaxRate.tax_category_id.in_(category_ids),
            TaxRate.valid_from <= on_date,
            or_(TaxRate.valid_to.is_(None), TaxRate.valid_to >= on_date),
        )
    ).all()
    # 期間が重なる登録ミスがあっても、開始日が新しい方を採用する
    latest: dict[str, TaxRate] = {}
    for r in rows:
        if r.tax_category_id not in latest or r.valid_from > latest[r.tax_category_id].valid_from:
            latest[r.tax_category_id] = r
    missing = category_ids - latest.keys()
    if missing:
        raise PricingError(f"税率マスタに {on_date} 時点の税率が登録されていません: {', '.join(sorted(missing))}")
    return {k: r.rate_percent for k, r in latest.items()}


def _load_best_discounts(
    db: Session, products: dict[str, Product], on_date: date
) -> dict[str, _Discount]:
    campaigns = db.scalars(
        select(DiscountCampaign).where(
            DiscountCampaign.product_code.in_(products.keys()),
            DiscountCampaign.valid_from <= on_date,
            DiscountCampaign.valid_to >= on_date,
        )
    ).all()
    best: dict[str, _Discount] = {}
    for c in campaigns:
        amount = _unit_discount(c, products[c.product_code].unit_price)
        current = best.get(c.product_code)
        if amount > 0 and (current is None or amount > current.unit_discount):
            best[c.product_code] = _Discount(campaign=c, unit_discount=amount)
    return best


def calculate_cart(
    db: Session,
    items: list[CartItemRequest],
    member_id: str | None,
    on_date: date,
) -> CartCalculateResponse:
    # --- 会員 ---
    member = None
    if member_id:
        member = db.get(Member, member_id)
        if member is None:
            raise PricingError("会員が見つかりません")

    # --- 商品 ---
    codes = [i.product_code.strip() for i in items]
    products = {
        p.product_code: p
        for p in db.scalars(
            select(Product).where(Product.product_code.in_(codes), Product.is_active.is_(True))
        ).all()
    }
    unknown = [c for c in codes if c not in products]
    if unknown:
        raise PricingError(f"商品がマスタ未登録です: {', '.join(unknown)}")

    # --- 税率・値引き ---
    tax_rates = _load_tax_rates(db, {p.tax_category_id for p in products.values()}, on_date)
    discounts = _load_best_discounts(db, products, on_date) if member else {}

    # --- 行ごとの計算 ---
    lines: list[CartLine] = []
    for line_no, item in enumerate(items, start=1):
        product = products[item.product_code.strip()]
        d = discounts.get(product.product_code)
        unit_discount = d.unit_discount if d else 0
        discount_amount = unit_discount * item.quantity
        lines.append(
            CartLine(
                line_no=line_no,
                product_code=product.product_code,
                product_name=product.product_name,
                unit_price=product.unit_price,
                quantity=item.quantity,
                tax_rate_percent=tax_rates[product.tax_category_id],
                discount_id=d.campaign.discount_id if d else None,
                discount_note=_discount_note(d.campaign, unit_discount, item.quantity) if d else None,
                unit_discount=unit_discount,
                discount_amount=discount_amount,
                line_amount_excl_tax=product.unit_price * item.quantity - discount_amount,
            )
        )

    # --- 税率ごとの集計（税額は税率ごとに1回だけ計算して切り捨て） ---
    taxable_by_rate: dict[Decimal, int] = {}
    for line in lines:
        taxable_by_rate[line.tax_rate_percent] = (
            taxable_by_rate.get(line.tax_rate_percent, 0) + line.line_amount_excl_tax
        )
    tax_summaries = [
        TaxSummary(
            tax_rate_percent=rate,
            taxable_amount_excl_tax=taxable,
            tax_amount=_floor_yen(Decimal(taxable) * rate / Decimal(100)),
        )
        for rate, taxable in sorted(taxable_by_rate.items(), key=lambda kv: kv[0], reverse=True)
    ]

    total_excl_tax = sum(line.line_amount_excl_tax for line in lines)
    tax_amount = sum(s.tax_amount for s in tax_summaries)
    return CartCalculateResponse(
        member=MemberResponse(member_id=member.member_id, member_name=member.member_name) if member else None,
        items=lines,
        tax_summaries=tax_summaries,
        subtotal_before_discount=sum(line.unit_price * line.quantity for line in lines),
        total_discount_amount=sum(line.discount_amount for line in lines),
        total_excl_tax=total_excl_tax,
        tax_amount=tax_amount,
        total_incl_tax=total_excl_tax + tax_amount,
    )
