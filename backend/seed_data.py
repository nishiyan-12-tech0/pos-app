"""
DB初期化スクリプト
  database/schema.sql（テーブル作成）→ database/seed.sql（初期データ）の順に実行する。

使い方（backend フォルダで、仮想環境を有効化した状態で）:
  python seed_data.py

注意:
  schema.sql は DROP TABLE で始まるため、既存のテーブルとデータはすべて消えて作り直される。
"""
from pathlib import Path

import certifi
import pymysql

from app.core.config import settings

# backend/ から見た database/ フォルダ（pos-app/database）
DATABASE_DIR = Path(__file__).resolve().parent.parent / "database"
SQL_FILES = ["schema.sql", "seed.sql"]


def split_statements(sql: str) -> list[str]:
    """SQLファイルを1文ずつに分割する（-- で始まるコメント行は除外）"""
    lines = [line for line in sql.splitlines() if not line.strip().startswith("--")]
    chunks = [c.strip() for c in "\n".join(lines).split(";")]
    # 空の断片や、文末コメントだけの断片は除外する
    return [c for c in chunks if c and not all(l.strip().startswith("--") for l in c.splitlines() if l.strip())]


def main() -> None:
    print(f"接続先: {settings.db_host} / DB: {settings.db_name}")
    answer = input("既存のテーブルとデータを削除して作り直します。よろしいですか？ (y/N): ")
    if answer.strip().lower() != "y":
        print("中止しました。")
        return

    conn = pymysql.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        charset="utf8mb4",
        ssl={"ca": certifi.where()},
    )
    try:
        with conn.cursor() as cur:
            for file_name in SQL_FILES:
                statements = split_statements((DATABASE_DIR / file_name).read_text(encoding="utf-8"))
                for stmt in statements:
                    cur.execute(stmt)
                print(f"✅ {file_name}: {len(statements)} 文を実行")
        conn.commit()

        with conn.cursor() as cur:
            for table in ["staff", "member", "product", "discount_campaign", "tax_rate"]:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                print(f"   {table}: {cur.fetchone()[0]} 件")
        print("✅ DB初期化が完了しました")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
