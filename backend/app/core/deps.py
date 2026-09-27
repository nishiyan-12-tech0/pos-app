"""
API共通の依存関係
  get_current_staff を Depends に書いたAPIは「ログイン必須」になる。
"""
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import COOKIE_NAME, decode_access_token
from app.db.session import get_db
from app.models import Staff


def get_current_staff(
    access_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
) -> Staff:
    """Cookieのトークンからログイン中の担当者を特定する"""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ログインしていないか、ログインの有効期限が切れています",
    )
    if not access_token:
        raise unauthorized

    staff_id = decode_access_token(access_token)
    if staff_id is None:
        raise unauthorized

    staff = db.get(Staff, staff_id)
    if staff is None or not staff.is_active:
        raise unauthorized
    return staff
