# ─── Stage 1: Build ──────────────────────────────────────────
FROM node:22-alpine AS builder

# تثبيت الاعتمادات الضرورية للبناء
RUN apk add --no-cache git openssl python3 make g++

WORKDIR /app

# نسخ ملفات التبعيات أولاً
COPY package.json pnpm-lock.yaml ./

# تثبيت pnpm والمكتبات
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# نسخ باقي الكود
COPY . .

# توليد Prisma Client (خطوة حاسمة قبل البناء)
RUN npx prisma generate

# إعداد متغيرات البيئة للبناء
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# تنفيذ البناء
RUN pnpm build

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
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
