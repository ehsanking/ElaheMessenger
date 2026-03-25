#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
APP_DIR="$ROOT_DIR"
ENV_FILE="$APP_DIR/.env.production"
COMPOSE_FILE="$APP_DIR/compose_prod_full.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "[deploy] Missing .env.production"
  echo "[deploy] Copy production.env.example or generate strong credentials before deployment."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "[deploy] Missing compose_prod_full.yml"
  exit 1
fi

if [ ! -f "$APP_DIR/package-lock.json" ]; then
  echo "[deploy] Missing package-lock.json"
  echo "[deploy] Production-safe Docker build uses npm ci and requires a real lockfile."
  exit 1
fi

export APP_ENV=production
export NODE_ENV=production

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config >/dev/null

echo "[deploy] Starting production-safe stack..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
