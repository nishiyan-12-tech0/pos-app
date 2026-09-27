from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.member import MemberResponse

MAX_QUANTITY = 99
MAX_LINES = 100


# ---------- リクエスト（画面 → API） ----------

class CartItemRequest(BaseModel):
    product_code: str = Field(min_length=1, max_length=13, examples=["4900000000028"])
    quantity: int = Field(ge=1, le=MAX_QUANTITY, examples=[2])


class CartCalculateRequest(BaseModel):
    member_id: str | None = Field(default=None, examples=["M0000001"])
    items: list[CartItemRequest] = Field(min_length=1, max_length=MAX_LINES)

    @field_validator("member_id")
    @classmethod
    def blank_to_none(cls, v: str | None) -> str | None:
        """空文字は「会員なし」として扱う"""
        if v is None:
            return None
        return v.strip() or None

    @field_validator("items")
    @classmethod
    def no_duplicate_products(cls, items: list[CartItemRequest]) -> list[CartItemRequest]:
        """同じ商品は1行にまとめて数量で持つ（要求2.1）。重複行は画面側の不具合なので拒否する"""
        codes = [i.product_code.strip() for i in items]
        if len(codes) != len(set(codes)):
            raise ValueError("同じ商品コードの行が重複しています（数量でまとめてください）")
        return items


# ---------- レスポンス（API → 画面） ----------

class CartLine(BaseModel):
    line_no: int                    # 購入リストの行番号（1から）
    product_code: str
    product_name: str
    unit_price: int                 # 税抜単価(円)
    quantity: int
    tax_rate_percent: Decimal       # 適用税率(%)
    discount_id: int | None         # 適用した値引き企画ID（なければ None）
    discount_note: str | None       # 画面表示用の値引き説明
    unit_discount: int              # 1個あたりの値引き額(円)
    discount_amount: int            # 行全体の値引き額(円) = unit_discount × quantity
    line_amount_excl_tax: int       # 値引き後の行小計(税抜・円)


class TaxSummary(BaseModel):
    tax_rate_percent: Decimal
    taxable_amount_excl_tax: int    # この税率の対象額(税抜・円)
    tax_amount: int                 # この税率の消費税額(円・切り捨て)


class CartCalculateResponse(BaseModel):
    member: MemberResponse | None
    items: list[CartLine]
    tax_summaries: list[TaxSummary]
    subtotal_before_discount: int   # 値引き前の税抜合計
    total_discount_amount: int      # 値引き総額
    total_excl_tax: int             # 値引き後の税抜合計
    tax_amount: int                 # 消費税合計
    total_incl_tax: int             # 税込合計
