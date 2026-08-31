from app.core.security import verify_password, get_password_hash, create_access_token

class AuthService:
    @staticmethod
    def verify_user_password(plain, hashed):
        return verify_password(plain, hashed)

    @staticmethod
    def hash_password(password):
        return get_password_hash(password)

    @staticmethod
    def generate_token(user_id, role):
        return create_access_token(data={"sub": str(user_id), "role": role})
