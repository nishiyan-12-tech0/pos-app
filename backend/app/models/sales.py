"""
取引系テーブル（取引ヘッダー・明細・税率別集計）
*_snapshot 列は購入時点の値を固定保存するためのもの（マスタ変更の影響を受けない）。
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Transaction(Base):
    """取引ヘッダー（member_id が None = 会員なしの取引）"""
    __tablename__ = "transaction"

    transaction_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    transaction_datetime: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    staff_id: Mapped[str] = mapped_column(ForeignKey("staff.staff_id"))
    register_id: Mapped[str] = mapped_column(ForeignKey("register.register_id"))
    member_id: Mapped[str | None] = mapped_column(ForeignKey("member.member_id"))
    total_discount_amount: Mapped[int] = mapped_column(Integer, default=0)
    total_excl_tax: Mapped[int] = mapped_column(Integer)
    tax_amount: Mapped[int] = mapped_column(Integer)
    total_incl_tax: Mapped[int] = mapped_column(Integer)

    details: Mapped[list["TransactionDetail"]] = relationship(
        back_populates="transaction", order_by="TransactionDetail.line_no"
    )
    tax_summaries: Mapped[list["TransactionTaxSummary"]] = relationship(back_populates="transaction")


class TransactionDetail(Base):
    """取引明細"""
    __tablename__ = "transaction_detail"

    detail_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(ForeignKey("transaction.transaction_id"))
    line_no: Mapped[int] = mapped_column(Integer)
    product_code: Mapped[str] = mapped_column(String(13))  # あえて外部キーにしない
    product_name_snapshot: Mapped[str] = mapped_column(String(100))
    unit_price_snapshot: Mapped[int] = mapped_column(Integer)
    tax_rate_snapshot: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    quantity: Mapped[int] = mapped_column(Integer)
    discount_id: Mapped[int | None] = mapped_column(ForeignKey("discount_campaign.discount_id"))
    discount_amount: Mapped[int] = mapped_column(Integer, default=0)
    line_amount_excl_tax: Mapped[int] = mapped_column(Integer)

    transaction: Mapped[Transaction] = relationship(back_populates="details")


class TransactionTaxSummary(Base):
    """取引税率別集計"""
    __tablename__ = "transaction_tax_summary"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(ForeignKey("transaction.transaction_id"))
    tax_rate_snapshot: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    taxable_amount_excl_tax: Mapped[int] = mapped_column(Integer)
    tax_amount: Mapped[int] = mapped_column(Integer)

    transaction: Mapped[Transaction] = relationship(back_populates="tax_summaries")
