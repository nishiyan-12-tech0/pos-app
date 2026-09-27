"""
購入確定（取引の保存）
金額は画面から受け取らず、必ずサーバー側で calculate_cart により再計算してから保存する。
（画面の値をそのまま信じると、改ざんや、表示後のマスタ変更による不一致が起こりうるため）
"""
import uuid

from sqlalchemy.orm import Session

from app.core.clock import now_jst
from app.models import Register, Staff, Transaction, TransactionDetail, TransactionTaxSummary
from app.schemas.purchase import PurchaseRequest, PurchaseResponse
from app.services.pricing import PricingError, calculate_cart


class TotalMismatchError(Exception):
    """画面に表示していた合計と、確定時の再計算結果が違う"""

    def __init__(self, expected: int, actual: int):
        super().__init__(f"expected={expected}, actual={actual}")
        self.expected = expected
        self.actual = actual


def create_purchase(db: Session, body: PurchaseRequest, staff: Staff) -> PurchaseResponse:
    register = db.get(Register, body.register_id.strip())
    if register is None or not register.is_active:
        raise PricingError("レジ端末が登録されていないか、利用停止中です")

    # DBのDATETIME列はタイムゾーンを持たないので、日本時間の日時をそのまま保存する
    now = now_jst()
    result = calculate_cart(db, body.items, body.member_id, now.date())

    if result.total_incl_tax != body.expected_total_incl_tax:
        raise TotalMismatchError(body.expected_total_incl_tax, result.total_incl_tax)

    transaction_id = str(uuid.uuid4())
    transaction_datetime = now.replace(tzinfo=None, microsecond=0)

    db.add(
        Transaction(
            transaction_id=transaction_id,
            transaction_datetime=transaction_datetime,
            staff_id=staff.staff_id,
            register_id=register.register_id,
            member_id=result.member.member_id if result.member else None,
            total_discount_amount=result.total_discount_amount,
            total_excl_tax=result.total_excl_tax,
            tax_amount=result.tax_amount,
            total_incl_tax=result.total_incl_tax,
        )
    )
    # 明細：購入時点の商品名・単価・税率・値引きを「スナップショット」として固定保存
    for line in result.items:
        db.add(
            TransactionDetail(
                transaction_id=transaction_id,
                line_no=line.line_no,
                product_code=line.product_code,
                product_name_snapshot=line.product_name,
                unit_price_snapshot=line.unit_price,
                tax_rate_snapshot=line.tax_rate_percent,
                quantity=line.quantity,
                discount_id=line.discount_id,
                discount_amount=line.discount_amount,
                line_amount_excl_tax=line.line_amount_excl_tax,
            )
        )
    for s in result.tax_summaries:
        db.add(
            TransactionTaxSummary(
                transaction_id=transaction_id,
                tax_rate_snapshot=s.tax_rate_percent,
                taxable_amount_excl_tax=s.taxable_amount_excl_tax,
                tax_amount=s.tax_amount,
            )
        )

    # ヘッダー・明細・税率別集計を1つのトランザクションでまとめて保存
    # （途中で失敗したら全部取り消され、中途半端な取引が残らない）
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return PurchaseResponse(
        transaction_id=transaction_id,
        transaction_datetime=transaction_datetime,
        total_discount_amount=result.total_discount_amount,
        total_excl_tax=result.total_excl_tax,
        tax_amount=result.tax_amount,
        total_incl_tax=result.total_incl_tax,
        tax_summaries=result.tax_summaries,
    )
