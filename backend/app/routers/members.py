from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_staff
from app.db.session import get_db
from app.models import Member
from app.schemas.member import MemberResponse

# 会員情報は個人情報なので、ログインした担当者だけが使える
router = APIRouter(prefix="/api/members", tags=["会員"], dependencies=[Depends(get_current_staff)])


@router.get(
    "/{member_id}",
    response_model=MemberResponse,
    responses={404: {"description": "会員が存在しない"}},
)
def get_member(member_id: str, db: Session = Depends(get_db)):
    """会員IDで会員を確認する（画面の会員名表示用）"""
    member = db.get(Member, member_id.strip())
    if member is None:
        raise HTTPException(status_code=404, detail="会員が見つかりません")
    return MemberResponse(member_id=member.member_id, member_name=member.member_name)
