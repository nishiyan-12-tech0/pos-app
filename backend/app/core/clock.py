"""
日付・時刻の共通処理
Azureのサーバーは世界標準時(UTC)で動くため、業務上の「今日」は必ずここで日本時間として求める。
"""
from datetime import date, datetime
from zoneinfo import ZoneInfo

JST = ZoneInfo("Asia/Tokyo")


def now_jst() -> datetime:
    return datetime.now(JST)


def today_jst() -> date:
    return now_jst().date()
