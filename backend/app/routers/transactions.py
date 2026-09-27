from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_staff
from app.db.session import get_db
from app.models import Staff
from app.schemas.purchase import PurchaseRequest, PurchaseResponse
from app.services.pricing import PricingError
from app.services.purchase import TotalMismatchError, create_purchase

router = APIRouter(prefix="/api/transactions", tags=["購入"])


@router.post(
    "",
    response_model=PurchaseResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"description": "未登録の商品・会員・レジ端末が含まれている"},
        409: {"description": "画面の合計金額と確定時の再計算結果が一致しない"},
    },
)
def purchase(
    body: PurchaseRequest,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
):
    """購入を確定し、取引をDBに保存する（レジ処理した担当者はログイン情報から記録）"""
    try:
        return create_purchase(db, body, staff)
    except PricingError as e:
        raise HTTPException(status_code=400, detail=e.message) from e
    except TotalMismatchError as e:
        raise HTTPException(
            status_code=409,
            detail=f"合計金額が変わりました（表示 {e.expected:,}円 → 最新 {e.actual:,}円）。再計算してから確定してください",
        ) from e
