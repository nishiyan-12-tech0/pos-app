"""
パスワード照合とトークン（JWT）の発行・検証
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"
COOKIE_NAME = "access_token"

# 存在しない担当者IDでも照合処理を行い、応答時間から「IDの有無」を推測されないようにするためのダミー
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(12))


def verify_password(plain_password: str, password_hash: str | None) -> bool:
    """入力されたパスワードとDBのハッシュを照合する"""
    hashed = password_hash.encode() if password_hash else _DUMMY_HASH
    ok = bcrypt.checkpw(plain_password.encode(), hashed)
    return ok and password_hash is not None


def hash_password(plain_password: str) -> str:
    """パスワードをハッシュ化する（担当者登録時に使用）"""
    return bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt(12)).decode()


def create_access_token(staff_id: str) -> str:
    """ログイン成功時に渡すトークンを作る（中身は担当者IDと有効期限）"""
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": staff_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """トークンを検証して担当者IDを取り出す。改ざん・期限切れなら None"""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
