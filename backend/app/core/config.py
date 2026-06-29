from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "今日记账 API"
    api_prefix: str = "/api/v1"
    database_url: str = "sqlite:///backend/data/ledger.db"
    cors_origins: str = "http://localhost:8080,http://127.0.0.1:8080"
    debug: bool = False
    jwt_secret_key: str = "development-only-change-me-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="LEDGER_",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
