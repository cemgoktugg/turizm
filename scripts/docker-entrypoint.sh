#!/bin/sh
# Konteyner açılışı: veritabanı geçişleri → (ilk kurulumda) örnek içerik → yönetici hesabı → site
set -e
cd /app
mkdir -p /app/data /app/storage/uploads

DB_FILE="${DATABASE_URL#file:}"
FIRST_RUN=0
if [ ! -s "$DB_FILE" ]; then
  FIRST_RUN=1
fi

echo "[başlangıç] Veritabanı geçişleri uygulanıyor ($DB_FILE)..."
node_modules/.bin/prisma migrate deploy

if [ "$FIRST_RUN" = "1" ]; then
  echo "[başlangıç] İlk kurulum: başlangıç içeriği yükleniyor..."
  SEED_PROFILE=production node_modules/.bin/tsx prisma/seed.ts
fi

node scripts/ensure-admin.mjs

echo "[başlangıç] Site başlatılıyor (port ${PORT:-3000})..."
exec node_modules/.bin/next start -p "${PORT:-3000}" -H 0.0.0.0
