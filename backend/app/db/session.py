import certifi
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

url = URL.create(
    drivername="mysql+pymysql",
    username=settings.db_user,
    password=settings.db_password,
    host=settings.db_host,
    port=settings.db_port,
    database=settings.db_name,
    query={"charset": "utf8mb4"},
)

engine = create_engine(
    url,
    pool_size=5,          # 常に保持しておく接続数
    max_overflow=10,      # 混雑時に一時的に増やせる数
    pool_pre_ping=True,   # 使う前に接続が生きているか確認
    pool_recycle=1800,    # 30分で接続を作り直す（切断対策）
    connect_args={"ssl": {"ca": certifi.where()}},
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()