from pydantic import BaseModel


class ProductResponse(BaseModel):
    """商品検索APIの返却データ（画面に必要な項目だけ返す）"""
    product_code: str
    product_name: str
    unit_price: int  # 税抜単価(円)
