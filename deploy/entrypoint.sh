#!/bin/sh
set -e

echo "⏳ Waiting for MySQL..."
until mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" --silent --ssl=0 2>/dev/null; do
  sleep 2
done
echo "✅ MySQL ready"

echo "⏳ Running init.sql..."
mysql --skip-ssl -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /app/init.sql
echo "✅ Schema created"

echo "⏳ Running seed..."
node /app/seed.mjs 2>&1 || echo "⚠️ Seed failed (non-fatal)"
echo "✅ Seed done"

echo "🚀 Starting app..."
exec node /app/dist/server/entry.mjs
