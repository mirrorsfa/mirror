import argparse

from backend.app.core.security import hash_password
from backend.app.db.database import SessionLocal
from backend.app.repositories.user_repository import UserRepository
from backend.app.schemas.user import UserRegister
from backend.app.services.auth_service import AuthService


def main() -> None:
    parser = argparse.ArgumentParser(description="创建或更新今日记账管理员")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--name", default="管理员")
    args = parser.parse_args()

    if len(args.password) < 8:
        parser.error("密码至少需要 8 位")

    with SessionLocal() as session:
        users = UserRepository(session)
        user = users.get_by_email(args.email)
        if user is None:
            AuthService(session).register(
                UserRegister(
                    email=args.email,
                    password=args.password,
                    display_name=args.name,
                )
            )
            user = users.get_by_email(args.email)
        else:
            user.password_hash = hash_password(args.password)
            user.display_name = args.name
        user.is_active = True
        user.is_admin = True
        session.commit()
        print(f"管理员已就绪：{user.email}")


if __name__ == "__main__":
    main()
