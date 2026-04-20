#!/bin/sh
set -eu

echo "[entrypoint] Starting Portfolio Manager..."

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Syncing database schema with Prisma (db push)..."
  ./node_modules/.bin/prisma db push --skip-generate
else
  echo "[entrypoint] DATABASE_URL is not set; skipping db push."
fi

echo "[entrypoint] Launching server on port ${PORT:-3333}..."
exec node server.js
