from app.database import get_db
from app.models import User
from app.auth import get_password_hash
from datetime import datetime


# Buat akun user
def create_test_user():
    db = next(get_db())

    # Cek apakah user sudah ada
    existing_user = db.query(User).filter(User.email == "test@example.com").first()
    if existing_user:
        print(f"User dengan email test@example.com sudah ada (id: {existing_user.id})")
        return

    # Buat user baru
    hashed_password = get_password_hash("password123")
    new_user = User(
        email="test@example.com",
        hashed_password=hashed_password,
        is_active=True,
        created_at=datetime.utcnow(),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print(f"User baru berhasil dibuat dengan id: {new_user.id}")
    print("Email: test@example.com")
    print("Password: password123")


if __name__ == "__main__":
    create_test_user()
