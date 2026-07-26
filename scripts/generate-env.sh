#!/usr/bin/env bash
# Generate a .env file for the Docker deployment with strong random credentials
# and JWT secrets. Idempotent guard: refuses to clobber an existing .env.

set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
  echo "Refusing to overwrite existing $ENV_FILE. Delete it first for fresh secrets." >&2
  exit 1
fi

command -v openssl >/dev/null || {
  echo "openssl is required" >&2
  exit 1
}

# Static environment config
pg_user="link_admin"
pg_db="link_application"

# Generate URL/YAML-safe random passwords and JWT secrets (32-byte hex strings)
pg_pw="$(openssl rand -hex 24)"
redis_pw="$(openssl rand -hex 24)"
jwt_access_secret="$(openssl rand -hex 32)"
jwt_refresh_secret="$(openssl rand -hex 32)"

# Restrict file permissions so secrets are only readable by the owner
umask 077

cat >"$ENV_FILE" <<EOF
# ==========================================
# Database & Cache Credentials
# ==========================================
POSTGRES_USER=$pg_user
POSTGRES_PASSWORD=$pg_pw
POSTGRES_DB=$pg_db

REDIS_PASSWORD=$redis_pw

# Connection Strings (Local Runner / Scripts)
DATABASE_URL=postgresql://${pg_user}:${pg_pw}@localhost:5432/${pg_db}?sslmode=disable
REDIS_URL=redis://:${redis_pw}@localhost:6379

# ==========================================
# JWT Configuration
# ==========================================
JWT_ACCESS_SECRET=$jwt_access_secret
JWT_REFRESH_SECRET=$jwt_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
EOF

echo "Wrote $ENV_FILE (mode 600) with fresh JWT secrets and strong DB/Redis passwords."
echo "Next step: docker compose up -d --build"
