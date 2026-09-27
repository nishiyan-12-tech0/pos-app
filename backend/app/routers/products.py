from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Product
from app.schemas.product import ProductResponse

router = APIRouter(prefix="/api/products", tags=["商品"])


@router.get(
    "/{product_code}",
    response_model=ProductResponse,
    responses={404: {"description": "商品がマスタ未登録"}},
)
def get_product(product_code: str, db: Session = Depends(get_db)):
    """商品コードで商品マスタを検索する（取扱中の商品のみ）"""
    product = db.scalar(
        select(Product).where(
            Product.product_code == product_code.strip(),
            Product.is_active.is_(True),
        )
    )
    if product is None:
        raise HTTPException(status_code=404, detail="商品がマスタ未登録です")
    return ProductResponse(
        product_code=product.product_code,
        product_name=product.product_name,
        unit_price=product.unit_price,
    )
