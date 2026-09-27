from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_staff
from app.core.security import COOKIE_NAME, create_access_token, verify_password
from app.db.session import get_db
from app.models import Staff
from app.schemas.auth import LoginRequest, StaffResponse

router = APIRouter(prefix="/api/auth", tags=["認証"])


def _to_response(staff: Staff) -> StaffResponse:
    return StaffResponse(staff_id=staff.staff_id, staff_name=staff.staff_name, role=staff.role)


@router.post(
    "/login",
    response_model=StaffResponse,
    responses={401: {"description": "担当者IDまたはパスワードが違う"}},
)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """担当者ID・パスワードを照合し、成功したらトークンをCookieにセットする"""
    staff = db.get(Staff, body.staff_id.strip())

    # IDの誤り・パスワードの誤り・無効な担当者を区別せず同じメッセージにする
    # （どれが違うかを教えると、IDの存在を探られる手がかりになるため）
    password_ok = verify_password(body.password, staff.password_hash if staff else None)
    if staff is None or not staff.is_active or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="担当者IDまたはパスワードが正しくありません",
        )

    response.set_cookie(
        key=COOKIE_NAME,
        value=create_access_token(staff.staff_id),
        max_age=settings.jwt_expire_hours * 3600,
        httponly=True,              # JavaScriptから読めない（盗まれにくい）
        secure=settings.cookie_secure,
        samesite="strict",
        path="/",
    )
    return _to_response(staff)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    """Cookieを削除してログアウトする"""
    response.delete_cookie(
        key=COOKIE_NAME, path="/", httponly=True, secure=settings.cookie_secure, samesite="strict"
    )


@router.get("/me", response_model=StaffResponse)
def me(staff: Staff = Depends(get_current_staff)):
    """ログイン中の担当者情報を返す（POS画面の担当者名表示用）"""
    return _to_response(staff)
