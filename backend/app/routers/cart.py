from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.clock import today_jst
from app.core.deps import get_current_staff
from app.db.session import get_db
from app.schemas.cart import CartCalculateRequest, CartCalculateResponse
from app.services.pricing import PricingError, calculate_cart

router = APIRouter(prefix="/api/cart", tags=["カート"], dependencies=[Depends(get_current_staff)])


@router.post(
    "/calculate",
    response_model=CartCalculateResponse,
    responses={400: {"description": "未登録の商品・会員が含まれている"}},
)
def calculate(body: CartCalculateRequest, db: Session = Depends(get_db)):
    """購入リストの値引き・小計・税額・合計を計算する（DBには保存しない）

    購入リストが変わるたび（スキャン・数量変更・削除・会員ID入力）に画面から呼び出す。
    """
    try:
        return calculate_cart(db, body.items, body.member_id, today_jst())
    except PricingError as e:
        raise HTTPException(status_code=400, detail=e.message) from e
