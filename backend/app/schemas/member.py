from pydantic import BaseModel


class MemberResponse(BaseModel):
    """会員確認APIの返却データ（画面に出すのは氏名まで。住所などの個人情報は返さない）"""
    member_id: str
    member_name: str
