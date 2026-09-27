"""
マスタ系テーブル（担当者・レジ・会員・税・商品・値引き）
database/schema.sql と1対1で対応させている。
列を変えるときは schema.sql とこのファイルの両方を直すこと。
"""
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Staff(Base):
    """レジ担当者マスタ"""
    __tablename__ = "staff"

    staff_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    staff_name: Mapped[str] = mapped_column(String(50))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(10), default="general")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Register(Base):
    """レジ端末マスタ"""
    __tablename__ = "register"

    register_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    register_name: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Member(Base):
    """会員マスタ"""
    __tablename__ = "member"

    member_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    member_name: Mapped[str] = mapped_column(String(50))
    phone: Mapped[str | None] = mapped_column(String(11))
    address: Mapped[str | None] = mapped_column(String(200))
    gender: Mapped[str | None] = mapped_column(String(10))
    birth_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class TaxCategory(Base):
    """消費税区分マスタ"""
    __tablename__ = "tax_category"

    tax_category_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    tax_category_name: Mapped[str] = mapped_column(String(50))

    rates: Mapped[list["TaxRate"]] = relationship(back_populates="category")


class TaxRate(Base):
    """消費税率マスタ（valid_to が None = 現在も有効）"""
    __tablename__ = "tax_rate"

    tax_rate_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tax_category_id: Mapped[str] = mapped_column(ForeignKey("tax_category.tax_category_id"))
    rate_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    valid_from: Mapped[date] = mapped_column(Date)
    valid_to: Mapped[date | None] = mapped_column(Date)

    category: Mapped[TaxCategory] = relationship(back_populates="rates")


class Product(Base):
    """商品マスタ"""
    __tablename__ = "product"

    product_code: Mapped[str] = mapped_column(String(13), primary_key=True)
    product_name: Mapped[str] = mapped_column(String(100))
    unit_price: Mapped[int] = mapped_column(Integer)
    tax_category_id: Mapped[str] = mapped_column(ForeignKey("tax_category.tax_category_id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    tax_category: Mapped[TaxCategory] = relationship()


class DiscountCampaign(Base):
    """値引き販促マスタ（会員限定）
    percentage   : discount_value=20 → 20%引き
    fixed_amount : discount_value=20 → 1個あたり20円引き
    """
    __tablename__ = "discount_campaign"

    discount_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    campaign_name: Mapped[str] = mapped_column(String(100))
    product_code: Mapped[str] = mapped_column(ForeignKey("product.product_code"))
    discount_type: Mapped[str] = mapped_column(String(20))
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    valid_from: Mapped[date] = mapped_column(Date)
    valid_to: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
