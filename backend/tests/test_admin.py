from backend.app.models.user import User


def make_admin(client):
    with client.app.state.testing_session() as session:
        user = session.query(User).filter_by(email="tester@example.com").one()
        user.is_admin = True
        session.commit()


def test_admin_endpoints_require_admin_role(client):
    assert client.get("/api/v1/admin/users").status_code == 403


def test_admin_can_manage_users_but_not_disable_self(client):
    make_admin(client)
    registered = client.post(
        "/api/v1/auth/register",
        json={
            "email": "managed@example.com",
            "password": "managed-password-123",
            "display_name": "待管理用户",
        },
    )
    managed_headers = {
        "Authorization": f"Bearer {registered.json()['access_token']}"
    }

    summary = client.get("/api/v1/admin/summary")
    assert summary.status_code == 200
    assert summary.json()["total_users"] == 2
    assert summary.json()["admin_users"] == 1

    users = client.get("/api/v1/admin/users").json()
    managed = next(user for user in users if user["email"] == "managed@example.com")
    current = next(user for user in users if user["email"] == "tester@example.com")

    disabled = client.patch(
        f"/api/v1/admin/users/{managed['id']}", json={"is_active": False}
    )
    assert disabled.status_code == 200
    assert disabled.json()["is_active"] is False

    existing_session = client.get("/api/v1/auth/me", headers=managed_headers)
    assert existing_session.status_code == 401

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "managed@example.com", "password": "managed-password-123"},
    )
    assert login.status_code == 403

    self_disable = client.patch(
        f"/api/v1/admin/users/{current['id']}", json={"is_active": False}
    )
    assert self_disable.status_code == 409
