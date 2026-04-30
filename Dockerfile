# ─── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS builder

# تثبيت الأدوات اللازمة
RUN apk add --no-cache git openssl python3 make g++

WORKDIR /app

# نسخ ملفات التبعيات (نستخدم npm لأن المشروع لا يحتوي على pnpm-lock.yaml)
COPY package.json package-lock.json ./

# تثبيت المكتبات باستخدام npm
RUN npm ci

# نسخ باقي الكود
COPY . .

# توليد Prisma Client (خطوة حاسمة قبل البناء)
RUN npx prisma generate

# متغيرات البيئة للبناء (قيم وهمية كافية لإتمام البناء)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/temp_db"
ENV JWT_SECRET="build-time-secret-key-for-nextjs-build-process-only"
ENV ENCRYPTION_KEY="build-time-encryption-key-32-chars-min"

# تنفيذ البناء
RUN npm run build

# ─── Stage 2: Production Runner ──────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# إنشاء مستخدم غير جذري للأمان
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# نسخ الملفات المبنية
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# نسخ ملفات Prisma للهجرة لاحقاً إذا لزم الأمر
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
