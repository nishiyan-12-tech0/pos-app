from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- DB接続 ---
    db_host: str
    db_port: int = 3306
    db_user: str
    db_password: str
    db_name: str

    # --- 認証（ログイン） ---
    jwt_secret_key: str            # トークンの署名に使う秘密の文字列（.envに書く）
    jwt_expire_hours: int = 8      # ログインの有効時間（1シフト分）
    cookie_secure: bool = False    # ローカル(http)はFalse、Azure(https)ではTrue

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
