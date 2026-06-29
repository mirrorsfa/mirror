import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import models  # noqa: F401
from backend.app.db.database import Base, get_db
from backend.app.main import create_app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session = sessionmaker(
        bind=engine, autoflush=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        with testing_session() as session:
            yield session

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        response = test_client.post(
            "/api/v1/auth/register",
            json={
                "email": "tester@example.com",
                "password": "test-password-123",
                "display_name": "测试用户",
            },
        )
        assert response.status_code == 201
        test_client.headers.update(
            {"Authorization": f"Bearer {response.json()['access_token']}"}
        )
        yield test_client

    Base.metadata.drop_all(bind=engine)
    engine.dispose()
