from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """ログイン画面から送られるデータ"""
    staff_id: str = Field(min_length=1, max_length=20, examples=["S002"])
    password: str = Field(min_length=1, max_length=128, examples=["staff1234"])


class StaffResponse(BaseModel):
    """ログイン中の担当者情報（パスワードは絶対に返さない）"""
    staff_id: str
    staff_name: str
    role: str
