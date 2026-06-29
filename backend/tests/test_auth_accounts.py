def test_register_login_and_current_user(client):
    current = client.get("/api/v1/auth/me")
    assert current.status_code == 200
    assert current.json()["email"] == "tester@example.com"

    duplicate = client.post(
        "/api/v1/auth/register",
        json={
            "email": "tester@example.com",
            "password": "another-password",
            "display_name": "重复用户",
        },
    )
    assert duplicate.status_code == 409

    invalid = client.post(
        "/api/v1/auth/login",
        json={"email": "tester@example.com", "password": "wrong-password"},
    )
    assert invalid.status_code == 401

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "tester@example.com", "password": "test-password-123"},
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"


def test_account_crud_and_in_use_guard(client):
    defaults = client.get("/api/v1/accounts")
    assert defaults.status_code == 200
    assert len(defaults.json()) == 4

    created = client.post(
        "/api/v1/accounts",
        json={
            "name": "工资卡",
            "account_type": "bank",
            "opening_balance": "1000.00",
            "currency": "CNY",
            "color": "#345678",
        },
    )
    assert created.status_code == 201
    account_id = created.json()["id"]
    assert created.json()["current_balance"] == "1000.00"

    updated = client.patch(
        f"/api/v1/accounts/{account_id}", json={"name": "主工资卡"}
    )
    assert updated.status_code == 200

    transaction = client.post(
        "/api/v1/transactions",
        json={
            "name": "工资",
            "transaction_type": "income",
            "category": "工资",
            "account": "主工资卡",
            "account_id": account_id,
            "amount": "500.00",
            "occurred_at": "2026-06-10T09:00:00",
            "icon": "💼",
            "color": "#e1eee8",
        },
    )
    assert transaction.status_code == 201

    accounts = client.get("/api/v1/accounts").json()
    account = next(item for item in accounts if item["id"] == account_id)
    assert account["current_balance"] == "1500.00"
    assert client.delete(f"/api/v1/accounts/{account_id}").status_code == 409


def test_user_data_isolation(client):
    created = client.post(
        "/api/v1/transactions",
        json={
            "name": "用户一的账单",
            "transaction_type": "expense",
            "category": "餐饮",
            "account": "现金",
            "amount": "20.00",
            "occurred_at": "2026-06-10T12:00:00",
            "icon": "🍜",
            "color": "#fae5dd",
        },
    )
    transaction_id = created.json()["id"]

    second = client.post(
        "/api/v1/auth/register",
        json={
            "email": "second@example.com",
            "password": "second-password-123",
            "display_name": "第二位用户",
        },
    )
    second_headers = {"Authorization": f"Bearer {second.json()['access_token']}"}

    assert client.get(
        "/api/v1/transactions?year=2026", headers=second_headers
    ).json() == []
    assert client.get(
        f"/api/v1/transactions/{transaction_id}", headers=second_headers
    ).status_code == 404


def test_protected_endpoint_rejects_anonymous_request(client):
    assert client.get(
        "/api/v1/accounts", headers={"Authorization": ""}
    ).status_code == 401
