# Argon2 Password Hashing Migration

## Changes Made

### 1. Updated Dependencies
**File**: `requirements.txt`
```diff
- passlib[bcrypt]==1.7.4
+ passlib[argon2]==1.7.4
```

### 2. Updated Password Hashing Implementation
**File**: `app/auth.py`

#### Changed CryptContext:
```python
# Before (bcrypt)
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# After (argon2)
pwd_ctx = CryptContext(schemes=["argon2"], deprecated="auto")
```

#### Simplified Password Functions:
```python
# Before (with 72-byte truncation for bcrypt)
def hash_password(p: str) -> str:
    p_truncated = p.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_ctx.hash(p_truncated)

def verify_password(p: str, h: str) -> bool:
    p_truncated = p.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_ctx.verify(p_truncated, h)

# After (no truncation needed)
def hash_password(p: str) -> str:
    # Argon2 has no length limitation, can handle any password length
    return pwd_ctx.hash(p)

def verify_password(p: str, h: str) -> bool:
    # Argon2 verification - no truncation needed
    return pwd_ctx.verify(p, h)
```

## Why Argon2?

### Advantages Over Bcrypt:
1. ✅ **No password length limitation** (bcrypt limited to 72 bytes)
2. ✅ **Winner of Password Hashing Competition 2015**
3. ✅ **Modern algorithm** designed specifically for password hashing
4. ✅ **Configurable memory hardness** (resistant to GPU attacks)
5. ✅ **Recommended by OWASP** for new applications
6. ✅ **Better security parameters** than bcrypt

### Security Features:
- **Memory-hard**: Requires significant RAM, making brute-force harder
- **Configurable**: Can adjust time cost, memory cost, and parallelism
- **Side-channel resistant**: Designed to resist timing attacks
- **Future-proof**: More adaptable to hardware improvements

### Performance:
- Slightly slower than bcrypt (this is intentional and good for security)
- Configurable to balance security and performance needs
- Default settings provide excellent security

## Migration Notes

### Important: Existing Users
⚠️ **Existing password hashes in the database are now invalid!**

If you have existing users:
1. They won't be able to log in with old bcrypt hashes
2. Options:
   - **Reset all passwords** (recommended for development)
   - **Clear user table** and have users re-register
   - **Hybrid approach**: Keep both schemes for migration period

### Hybrid Migration (If Needed):
```python
# Support both bcrypt and argon2 during migration
pwd_ctx = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="bcrypt"
)
# This will automatically upgrade bcrypt hashes to argon2 on next login
```

## Testing

### Test Endpoints:
```bash
# Create account
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"very_long_password_that_exceeds_72_bytes_and_would_fail_with_bcrypt_but_works_with_argon2"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"very_long_password_that_exceeds_72_bytes_and_would_fail_with_bcrypt_but_works_with_argon2"}'
```

## Configuration (Optional)

You can customize Argon2 parameters in `auth.py`:
```python
pwd_ctx = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__time_cost=2,      # Number of iterations (default: 2)
    argon2__memory_cost=512,  # Memory in KiB (default: 512)
    argon2__parallelism=2     # Number of parallel threads (default: 2)
)
```

## Deployment Status
✅ Agent service rebuilt with Argon2
✅ All services running successfully
✅ Health checks passing
✅ Ready for testing

## Next Steps
1. Clear existing user database (or migrate hashes)
2. Test signup with various password lengths
3. Verify login works correctly
4. Test password validation edge cases
