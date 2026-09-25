# SmartCart Authentication

## Current Status

SmartCart backend authentication is implemented and verified through Swagger/OpenAPI.

Implemented:
- User registration
- Duplicate email/mobile validation
- Argon2 password hashing and verification
- JWT access-token generation
- JWT Bearer authentication
- JWT validation
- Current-user lookup from PostgreSQL
- Protected `/auth/me` endpoint
- Inactive-user protection
- Alembic migration for the `users` table

Not implemented yet:
- React authentication context
- Login/Register UI
- Frontend token handling and logout
- User-specific orders
- Admin authorization
- Role-based protected endpoints

## Authentication Flow

```text
Register
   |
   v
POST /auth/register
   |
   v
Validate email/mobile
   |
   v
Hash password with Argon2
   |
   v
Save UserDB in PostgreSQL
```

Login:

```text
Login credentials
      |
      v
POST /auth/token
      |
      v
Find user by email
      |
      v
Verify Argon2 password hash
      |
      v
Create JWT
      |
      v
Return Bearer access token
```

Protected request:

```text
Client
  |
  | Authorization: Bearer <JWT>
  v
OAuth2PasswordBearer
  |
  v
JWT decode + validation
  |
  v
Extract user ID from "sub"
  |
  v
Load UserDB from PostgreSQL
  |
  v
Check is_active
  |
  v
Return current user
```

## User Database Model

Migration:

```text
55f8fce63cc2_add_users_table.py
```

Current Alembic head:

```text
55f8fce63cc2
```

The `users` table contains:

| Column | Purpose |
|---|---|
| id | Primary key |
| name | User name |
| email | Unique login identifier |
| mobile_number | Unique mobile number |
| password_hash | Argon2 password hash |
| role | Current role, default `CUSTOMER` |
| is_active | Account activation status |
| created_at | Account creation timestamp |

Plain-text passwords are never stored.

## Password Security

SmartCart uses `pwdlib` with its recommended password hashing configuration.

```python
password_hash = PasswordHash.recommended()
```

Registration hashes the supplied password. Login verifies the supplied password against the stored hash.

The stored database value is an Argon2 hash beginning with:

```text
$argon2id$
```

## Registration

Endpoint:

```http
POST /auth/register
```

The endpoint:

1. Validates the request with Pydantic.
2. Normalizes the email to lowercase.
3. Checks for an existing email.
4. Checks for an existing mobile number.
5. Hashes the password.
6. Creates the user.
7. Commits the transaction.
8. Returns public user information without the password hash.

Duplicate email/mobile requests return:

```http
409 Conflict
```

## Login

Endpoint:

```http
POST /auth/token
```

FastAPI's `OAuth2PasswordRequestForm` is used.

The form fields are:

```text
username=<email>
password=<password>
```

In SmartCart, the OAuth2 `username` field represents the user's email.

Successful login returns:

```json
{
  "access_token": "<JWT>",
  "token_type": "bearer"
}
```

Invalid credentials return `401 Unauthorized`.

Inactive users return `403 Forbidden`.

## JWT Configuration

Local `.env` configuration:

```text
JWT_SECRET_KEY=<secret>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

The secret must not be committed to Git.

`.env.example` should contain placeholders:

```text
JWT_SECRET_KEY=change_me
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

The JWT contains:

```text
sub  -> user ID
role -> user role
exp  -> expiration timestamp
```

## JWT Verification

FastAPI uses:

```python
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
)
```

Protected endpoints depend on:

```python
get_current_user
```

The dependency:

1. Reads the Bearer token.
2. Decodes and validates the JWT.
3. Requires the `sub` claim.
4. Converts the user ID to an integer.
5. Loads the user from PostgreSQL.
6. Rejects a missing user.
7. Rejects an inactive user.
8. Returns `UserDB`.

Invalid or unusable tokens return:

```http
401 Unauthorized
```

with:

```json
{
  "detail": "Could not validate credentials"
}
```

## Current User Endpoint

Endpoint:

```http
GET /auth/me
```

The endpoint is protected by `get_current_user`.

A successful request returns the authenticated user's public information, for example:

```json
{
  "id": 1,
  "name": "Pankaj Behera",
  "email": "pankaj@example.com",
  "mobile_number": "9876543210",
  "role": "CUSTOMER",
  "is_active": true,
  "created_at": "2026-09-21T05:01:23.061199Z"
}
```

This verifies that the backend can identify the user from the JWT and then load the authoritative user record from PostgreSQL.

## Verification Completed

### Valid JWT

`GET /auth/me` was executed through Swagger with a valid Bearer token.

Result:

```http
200 OK
```

The expected user record was returned.

### Invalid JWT

`GET /auth/me` was tested with:

```text
Authorization: Bearer invalid-token
```

Result:

```http
401 Unauthorized
```

Response:

```json
{
  "detail": "Could not validate credentials"
}
```

### Login

`POST /auth/token` was previously verified successfully and returns a JWT access token.

## Important Security Note

Bearer JWTs are credentials. Do not commit them or share them outside a controlled development environment.

The local test token is short-lived according to:

```text
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Production secrets should be supplied through a suitable secret-management mechanism rather than source control.

## Current Authentication Architecture

```text
React Frontend
      |
      | credentials
      v
FastAPI
      |
      +--> /auth/register
      |       |
      |       +--> Argon2 hash
      |       |
      |       +--> PostgreSQL users
      |
      +--> /auth/token
      |       |
      |       +--> verify password
      |       |
      |       +--> create JWT
      |
      +--> /auth/me
              |
              +--> validate JWT
              |
              +--> find UserDB
              |
              +--> return current user
```

## Files Involved

```text
backend/
├── app/
│   ├── auth.py
│   ├── database.py
│   ├── db_models.py
│   ├── main.py
│   └── models.py
│
└── alembic/
    └── versions/
        └── 55f8fce63cc2_add_users_table.py
```

| File | Responsibility |
|---|---|
| `auth.py` | Password hashing, JWT creation, JWT validation, current-user dependency |
| `models.py` | Pydantic request/response models |
| `db_models.py` | SQLAlchemy database models |
| `database.py` | PostgreSQL engine and DB session |
| `main.py` | Authentication API endpoints |
| Alembic migration | Creates the `users` table |

## Current Limitation: Orders

Orders are not yet linked to users.

Existing order records were created before authentication and currently do not contain a `user_id`.

The next order/auth database change should therefore be a real Alembic migration that:

1. Adds `user_id` to `orders`.
2. Establishes the relationship to `users`.
3. Handles existing orders safely.
4. Uses the authenticated user during order creation.
5. Makes `GET /orders` user-specific.

Until that is completed, the existing Orders page should not be described as a true user-specific "My Orders" implementation.

## Next Application Step

The next application-layer task is the React authentication flow:

```text
Login/Register UI
       |
       v
AuthContext
       |
       +--> login
       +--> register
       +--> current user
       +--> logout
       |
       v
Authenticated frontend behavior
```

Then:

```text
React Auth
    ↓
user_id on orders
    ↓
User-specific My Orders
    ↓
Order details / tracking / cancellation
    ↓
Admin authorization
```

## Authentication Status

```text
[x] Users table
[x] Alembic users migration
[x] Registration
[x] Duplicate email protection
[x] Duplicate mobile protection
[x] Argon2 password hashing
[x] Login
[x] JWT generation
[x] JWT expiration
[x] JWT Bearer verification
[x] Current-user dependency
[x] /auth/me
[x] Invalid-token rejection
[x] Inactive-user rejection

[ ] React AuthContext
[ ] Login UI
[ ] Register UI
[ ] Logout
[ ] User-specific orders
[ ] Admin authorization
[ ] Role-based protected endpoints
```
