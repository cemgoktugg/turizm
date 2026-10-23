# ============================================================================
# Nemira — Next.js + Prisma (SQLite) production imajı
# Veritabanı (/app/data) ve yüklenen dosyalar (/app/storage/uploads) kalıcı
# volume'larda durur; yeni sürüm yayınlansa da silinmez (bkz. docker-compose.yml).
# ============================================================================

FROM node:22-bookworm-slim AS base
# Prisma motoru için OpenSSL gerekir
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1

# ---- Derleme ---------------------------------------------------------------
FROM base AS builder
COPY package.json package-lock.json ./
COPY prisma ./prisma
# postinstall → prisma generate
RUN npm ci
COPY . .
# Site sayfaları her istekte canlı veritabanından üretilir; derleme sırasında
# yalnızca boş bir şema yeterli.
ENV DATABASE_URL="file:/tmp/build.db"
RUN node_modules/.bin/prisma migrate deploy && npm run build

# ---- Çalıştırma ------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL="file:/app/data/turizm.db"
# Açılışta veritabanı geçişi ve ilk kurulum için prisma + tsx de gerekli olduğundan
# bağımlılıklar olduğu gibi kopyalanır.
COPY --from=builder /app ./
RUN chmod +x scripts/docker-entrypoint.sh && mkdir -p /app/data /app/storage/uploads
EXPOSE 3000
ENTRYPOINT ["scripts/docker-entrypoint.sh"]
