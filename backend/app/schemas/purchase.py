from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.cart import CartCalculateRequest, TaxSummary


class PurchaseRequest(CartCalculateRequest):
    """購入確定のリクエスト（カート計算と同じ内容＋レジ端末＋画面に表示していた合計）"""
    register_id: str = Field(min_length=1, max_length=20, examples=["R01"])
    expected_total_incl_tax: int = Field(
        ge=0,
        description="画面に表示していた税込合計。確定時に再計算した金額と違えば確定しない",
        examples=[1359],
    )


class PurchaseResponse(BaseModel):
    """購入確定後にポップアップへ表示する内容"""
    transaction_id: str
    transaction_datetime: datetime
    total_discount_amount: int
    total_excl_tax: int          # 税抜合計
    tax_amount: int
    total_incl_tax: int          # 税込合計
    tax_summaries: list[TaxSummary]
