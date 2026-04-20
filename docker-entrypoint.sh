#!/bin/sh
set -eu

echo "[entrypoint] Starting Portfolio Manager..."

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Syncing database schema with Prisma (db push)..."
  if ! ./node_modules/.bin/prisma db push --skip-generate; then
    echo "[entrypoint][warn] prisma db push failed. Continuing startup to keep container alive; check DATABASE_URL/volume permissions."
  fi
else
  echo "[entrypoint] DATABASE_URL is not set; skipping db push."
fi

echo "[entrypoint] Launching server on port ${PORT:-3333}..."
exec node server.js
