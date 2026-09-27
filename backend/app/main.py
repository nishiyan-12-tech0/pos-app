from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    version = db.execute(text("SELECT VERSION()")).scalar()
    return {"status": "ok", "mysql_version": version}