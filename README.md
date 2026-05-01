# 📊 نظام إدارة المحافظ الاستثمارية - الشامل

نظام متكامل لإدارة المحافظ الاستثمارية مع دعم الأسواق العربية والعالمية والأسهم الشرعية.

---

## 🚀 تثبيت وتشغيل المشروع

### المتطلبات
- Node.js 18+
- npm أو bun

### التثبيت من GitHub

```bash
# استنساخ المشروع
git clone https://github.com/faisal702tv/portfolio.git

# الدخول للمجلد
cd portfolio

# تثبيت الحزم
npm install

# تشغيل بيئة التطوير
npm run dev

# أو للإنتاج
npm run build
npm start
```

### فتح المتصفح
```
http://localhost:3333
```

---

## 🐳 النشر على الإنترنت عبر Docker (Production)

### 1) تجهيز ملف البيئة على السيرفر

```bash
cp .env.example .env
```

ثم عدّل القيم التالية في `.env`:

- `DATABASE_URL=postgresql://...`
- `JWT_SECRET` قيمة قوية
- `NEXT_PUBLIC_APP_URL=https://your-domain.com`
- `DOMAIN=your-domain.com`
- `ACME_EMAIL=you@example.com`
- `DOCKER_DATABASE_URL=postgresql://...` (اختياري، له قيمة افتراضية في `docker-compose.yml`)
- `REDIS_URL=redis://...` (اختياري، له قيمة افتراضية `redis://redis:6379` داخل Docker)

### 2) بناء وتشغيل الحاويات

```bash
docker compose up -d --build
```

### 3) التحقق من الحالة

```bash
docker compose ps
docker compose logs -f portfolio
docker compose logs -f caddy
```

### 4) تحديث المشروع مستقبلًا

```bash
git pull
docker compose up -d --build
```

### ملاحظات مهمة

- قاعدة البيانات PostgreSQL تُحفظ في Volume باسم `postgres-data` ولن تضيع عند إعادة البناء.
- Redis يُحفظ في Volume باسم `redis-data` ويستخدم لـ Rate Limiting بنمط Token Bucket.
- الحاوية تطبّق `prisma migrate deploy` ثم `prisma db push` عند الإقلاع لمزامنة الجداول.
- Caddy يفعّل HTTPS تلقائيًا عندما يكون `DOMAIN` صحيحًا ومشيرًا إلى IP السيرفر.

### ترحيل البيانات من SQLite إلى PostgreSQL (مرة واحدة)

```bash
# 1) شغّل PostgreSQL (مثلاً عبر Docker)
docker compose up -d postgres

# 2) طبّق schema على PostgreSQL
npm run db:push:pg

# 3) معاينة بدون كتابة
npm run db:migrate:sqlite-to-pg:dry-run

# 4) تنفيذ الترحيل الفعلي
npm run db:migrate:sqlite-to-pg
```

> السكربت يقرأ من `SQLITE_DATABASE_URL` (الافتراضي: `file:./prisma/dev.db`) ويكتب إلى `DATABASE_URL` (PostgreSQL).
> السكربت ينشئ نسخة احتياطية تلقائيًا من ملف SQLite قبل النقل الفعلي.

---

## 🌍 الأسواق المدعومة

### الأسواق العربية

| السوق | الرمز | عدد الأسهم | العلم |
|-------|-------|-----------|-------|
| السعودية (تداول) | TADAWUL | 393 | 🇸🇦 |
| الإمارات - أبوظبي | ADX | 80 | 🇦🇪 |
| الإمارات - دبي | DFM | 77 | 🇦🇪 |
| قطر | QE | 55 | 🇶🇦 |
| الكويت | KSE | 136 | 🇰🇼 |
| البحرين | BHB | 24 | 🇧🇭 |
| عمان | MSX | 85 | 🇴🇲 |
| مصر | EGX | 253 | 🇪🇬 |
| الأردن | ASE | 200+ | 🇯🇴 |

**إجمالي الأسواق العربية: 1,303+ سهم**

### الأسواق الدولية

| السوق | الرمز | عدد الأسهم | العلم |
|-------|-------|-----------|-------|
| أمريكا - NASDAQ | NASDAQ | 3,368 | 🇺🇸 |
| أمريكا - NYSE | NYSE | 8,000+ | 🇺🇸 |
| أمريكا - أخرى | US Others | 3,600+ | 🇺🇸 |
| صناديق ETF | US_ETF | 542+ | 🇺🇸 |

**إجمالي الأسواق الأمريكية: 15,000+ سهم**

### المؤشرات الأمريكية المدعومة

| المؤشر | الرمز | الوصف |
|--------|-------|-------|
| S&P 500 | SPX | المؤشر الأشمل للشركات الكبيرة |
| Dow Jones Industrial | DJI | مؤشر داو جونز الصناعي |
| NASDAQ Composite | IXIC | مؤشر ناسداك المركب |
| NASDAQ 100 | NDX | أكبر 100 شركة في ناسداك |
| Russell 2000 | RUT | مؤشر الشركات الصغيرة |
| Russell 1000 | RUI | مؤشر الشركات الكبيرة |
| Russell 3000 | RUA | مؤشر السوق الشامل |
| VIX | VIX | مؤشر الخوف (تقلب السوق) |
| S&P 400 MidCap | MID | الشركات المتوسطة |
| S&P 600 SmallCap | SML | الشركات الصغيرة |
| Dow Jones Transport | DJT | مؤشر النقل |
| Dow Jones Utility | DJU | مؤشر المرافق |
| NYSE Composite | NYA | مؤشر NYSE المركب |
| Wilshire 5000 | W5000 | السوق الكلي |

### السلع والمعادن

| النوع | العدد | الأمثلة |
|-------|-------|---------|
| المعادن الثمينة | 4 | ذهب، فضة، بلاتين، بلاديوم |
| المعادن الصناعية | 5 | نحاس، ألمنيوم، زنك، نيكل |
| الطاقة | 6 | نفط WTI، برنت، غاز طبيعي |
| المنتجات الزراعية | 9 | قمح، ذرة، قهوة، كاكاو |
| الماشية | 3 | مواشي، خنازير |

### العملات الرقمية

| الفئة | العدد | الأمثلة |
|-------|-------|---------|
| العملات الرئيسية | 5 | بيتكوين، إيثيريوم، سولانا |
| العملات المستقرة | 2 | USDT، USDC |
| DeFi | 5 | كاردانو، أفالانش، يونيسواب |
| Meme Coins | 3 | دوج كوين، شبا، بيبي |
| Layer 2 | 3 | بوليجون، أربيتروم |
| AI Coins | 3 | فيتش، ريندر |

### سوق العملات (Forex)

| الفئة | العدد | الأمثلة |
|-------|-------|---------|
| أزواج رئيسية | 7 | EUR/USD، GBP/USD، USD/JPY |
| أزواج ثانوية | 8 | EUR/GBP، EUR/JPY |
| أسواق ناشئة | 9 | USD/SAR، USD/EGP |
| عملات عربية | 4 | SAR/AED، SAR/KWD |

---

## 📈 إحصائيات المشروع

| البيان | القيمة |
|--------|--------|
| إجمالي الأوراق المالية | 16,500+ |
| الأسواق المدعومة | 15 |
| الأسهم المتوافقة شرعاً | 9,500+ |
| نسبة التوافق الشرعي | ~60% |
| المؤشرات المدعومة | 50+ |

---

## 🧠 Advanced Analytics & Rebalancing

### المؤشرات المالية المتقدمة (`src/lib/financials.ts`)

المكتبة توفر دوال تحليل مؤسسية (Pure Functions):

- `calculateCAGR(startValue, endValue, years)`
- `calculateSharpeRatio(periodReturns, riskFreeRate, periodsPerYear)`
- `calculateSortinoRatio(periodReturns, riskFreeRate, periodsPerYear, targetReturnPerPeriod)`
- `calculateMaxDrawdown(prices)`
- `calculateVolatility(periodReturns, periodsPerYear)`
- `toReturnsFromPrices(prices)`

### صفحة إعادة التوازن الذكي

- المسار: `/dashboard/rebalance`
- الوظيفة:
  - مقارنة التوزيع الحالي مقابل التوزيع المستهدف.
  - إنشاء توصيات شراء/بيع بقيمة مالية مباشرة.
  - حفظ التوزيع المستهدف لكل محفظة في قاعدة البيانات (`Portfolio.targetAllocation`).

### اختبارات الدقة

تمت إضافة اختبارات وحدة للمكتبة الجديدة في:

- `src/lib/__tests__/financials.test.ts`

---

## 🕌 معايير الشريعة الإسلامية (4 معايير فقط)

### 1. بنك البلاد
| المعيار | الحد المسموح |
|---------|-------------|
| التمويل غير الإسلامي | ≤ 30% من الأصول |
| تكلفة التمويل غير الإسلامي | ≤ 5% من النفقات |
| الاستثمارات غير الإسلامية | ≤ 30% من الأصول |

### 2. بنك الراجحي
| المعيار | الحد المسموح |
|---------|-------------|
| الديون ذات الفوائد | ≤ 25% من الأصول |
| الإيرادات غير الشرعية | ≤ 5% من الإيرادات |

### 3. مكتب المقاصد (د. محمد العصيمي)
| المعيار | الحد المسموح |
|---------|-------------|
| نسبة الدين | ≤ 30% |
| نسبة النقد | ≤ 30% |

**المصدر:** [almaqased.net](https://almaqased.net)

### 4. صفر ديون (الأكثر صرامة)
| المعيار | الحد المسموح |
|---------|-------------|
| القروض والديون الربوية | 0% |
| الأنشطة المحرمة | 0% |

---

## 📋 الصفحات المتاحة

### الصفحات الرئيسية

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| 🏠 الرئيسية | `/` | لوحة التحكم الرئيسية |
| 📊 الأسهم | `/stocks` | إدارة الأسهم في المحفظة |
| 💼 الصناديق | `/funds` | الصناديق الاستثمارية |
| 📄 السندات والصكوك | `/bonds` | السندات والصكوك |
| 👁️ قائمة المتابعة | `/watchlist` | الأسهم المتابعة |
| 💰 التوزيعات | `/dividends` | توزيعات الأرباح |
| 📈 الأداء | `/performance` | أداء المحفظة |

### الأسواق

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| 🌐 جميع الأسواق | `/markets` | نظرة عامة على الأسواق |
| 🇺🇸 السوق الأمريكي | `/us-market` | الأسهم والمؤشرات الأمريكية |
| 📊 السوق اليومي | `/market` | حركة السوق اليومية |
| 💱 العملات | `/forex` | أزواج العملات الأجنبية |
| 🔥 الخريطة الحرارية | `/heatmap` | خريطة السوق الحرارية |
| 🔍 السكرينر | `/screener` | فلترة وفرز الأسهم |
| ⚖️ مقارنة الأسهم | `/compare` | مقارنة الأسهم |

### الشريعة الإسلامية

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| ☪️ الأسهم الشرعية | `/sharia-stocks` | قاعدة الأسهم المتوافقة شرعاً |
| 📋 قاعدة الصناديق الشرعية | `/funds-database` | الصناديق المتوافقة شرعاً |

### التحليل والأدوات

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| 🤖 مساعد AI | `/ai-assistant` | مساعد الاستثمار الذكي |
| 🧠 تحليل AI | `/ai-analysis` | تحليلات الذكاء الاصطناعي |
| 📊 تحليل المحفظة | `/portfolio-ai` | تحليل المحفظة بالذكاء الاصطناعي |
| 🎯 إعادة التوازن الذكي | `/dashboard/rebalance` | موازنة المحفظة وتوصيات شراء/بيع |
| 🕯️ الشموع اليابانية | `/candlestick` | تحليل الشموع اليابانية |
| 🧮 الحاسبة المالية | `/calculator` | حاسبة الأرباح والخسائر |

### الأخبار والمعلومات

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| 📰 الأخبار | `/news` | أخبار الأسواق المالية |
| 📖 القاموس المالي | `/dictionary` | المصطلحات المالية |

### الإدارة والإعدادات

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| 📁 إدارة المحافظ | `/portfolios` | إنشاء وإدارة المحافظ |
| 🔔 التنبيهات | `/alerts` | تنبيهات الأسعار |
| 🗄️ قاعدة البيانات | `/database` | إدارة قاعدة البيانات |
| ⚙️ الإعدادات | `/settings` | إعدادات النظام |

---

## 🛠️ التقنيات المستخدمة

| التقنية | الإصدار | الوصف |
|---------|---------|-------|
| Next.js | 16 | إطار العمل الرئيسي |
| TypeScript | 5 | لغة البرمجة |
| Tailwind CSS | 4 | التصميم والتنسيق |
| shadcn/ui | Latest | مكونات واجهة المستخدم |
| Prisma ORM | 6 | قاعدة البيانات |
| SQLite | - | قاعدة البيانات المحلية |
| Recharts | 2.15 | الرسوم البيانية |
| Lucide Icons | Latest | الأيقونات |
| z-ai-web-dev-sdk | Latest | الذكاء الاصطناعي |

---

## 📁 هيكل المشروع

```
portfolio/
├── 📁 src/
│   ├── 📁 app/                    # صفحات Next.js
│   │   ├── 📁 api/                # API Routes
│   │   │   ├── 📄 ai/route.ts
│   │   │   ├── 📄 forex/route.ts
│   │   │   ├── 📄 funds/route.ts
│   │   │   ├── 📄 markets/route.ts
│   │   │   ├── 📄 sharia-stocks/route.ts
│   │   │   ├── 📄 stocks/route.ts
│   │   │   └── 📄 us-stocks/route.ts
│   │   ├── 📄 page.tsx            # الصفحة الرئيسية
│   │   ├── 📄 layout.tsx          # التخطيط الرئيسي
│   │   ├── 📄 globals.css         # الأنماط العامة
│   │   ├── 📁 us-market/          # السوق الأمريكي
│   │   ├── 📁 sharia-stocks/      # الأسهم الشرعية
│   │   ├── 📁 forex/              # العملات
│   │   ├── 📁 calculator/         # الحاسبة
│   │   ├── 📁 dictionary/         # القاموس المالي
│   │   ├── 📁 stocks/             # الأسهم
│   │   ├── 📁 funds/              # الصناديق
│   │   ├── 📁 bonds/              # السندات
│   │   ├── 📁 watchlist/          # قائمة المتابعة
│   │   ├── 📁 alerts/             # التنبيهات
│   │   ├── 📁 markets/            # الأسواق
│   │   ├── 📁 heatmap/            # الخريطة الحرارية
│   │   ├── 📁 screener/           # السكرينر
│   │   ├── 📁 compare/            # المقارنة
│   │   ├── 📁 news/               # الأخبار
│   │   ├── 📁 performance/        # الأداء
│   │   ├── 📁 ai-assistant/       # مساعد AI
│   │   ├── 📁 ai-analysis/        # تحليل AI
│   │   ├── 📁 portfolio-ai/       # تحليل المحفظة
│   │   ├── 📁 dashboard/rebalance/# إعادة التوازن الذكي
│   │   ├── 📁 candlestick/        # الشموع اليابانية
│   │   ├── 📁 dividends/          # التوزيعات
│   │   ├── 📁 portfolios/         # إدارة المحافظ
│   │   ├── 📁 database/           # قاعدة البيانات
│   │   └── 📁 settings/           # الإعدادات
│   ├── 📁 components/             # مكونات React
│   │   ├── 📁 ui/                 # مكونات shadcn/ui
│   │   ├── 📁 dashboard/          # مكونات لوحة التحكم
│   │   └── 📁 layout/             # مكونات التخطيط
│   ├── 📁 data/                   # ملفات البيانات
│   │   ├── 📄 stocks_database.json
│   │   ├── 📄 us_stocks_database.json
│   │   ├── 📄 funds_database.json
│   │   ├── 📄 sharia_stocks.ts
│   │   ├── 📄 markets.ts
│   │   └── 📄 demo.ts
│   ├── 📁 lib/                    # الدوال المساعدة
│   │   ├── 📄 utils.ts
│   │   ├── 📄 helpers.ts
│   │   ├── 📄 financials.ts       # التحليلات المالية المتقدمة
│   │   └── 📄 db.ts
│   ├── 📁 hooks/                  # React Hooks
│   └── 📁 types/                  # أنواع TypeScript
│       └── 📄 index.ts
├── 📁 prisma/                     # قاعدة البيانات
│   ├── 📄 schema.prisma
│   └── 📁 migrations/             # ترحيلات PostgreSQL
├── 📁 public/                     # الملفات العامة
│   ├── 📄 logo.svg
│   ├── 📄 manifest.json
│   └── 📄 robots.txt
├── 📄 package.json
├── 📄 next.config.ts
├── 📄 tailwind.config.ts
├── 📄 tsconfig.json
├── 📄 Caddyfile
└── 📄 README.md
```

---

## ⚙️ أوامر التشغيل

```bash
# تشغيل بيئة التطوير (المنفذ 3333)
npm run dev

# بناء للإنتاج
npm run build

# تشغيل الإنتاج
npm start

# فحص الكود
npm run lint

# تهيئة قاعدة البيانات
npm run db:push

# تهيئة PostgreSQL
npm run db:push:pg

# توليد Prisma Client
npm run db:generate

# تشغيل الهجرات
npm run db:migrate

# ترحيل بيانات SQLite إلى PostgreSQL
npm run db:migrate:sqlite-to-pg
```

---

## 📌 ملاحظات مهمة

| الملاحظة | التفاصيل |
|----------|----------|
| المنفذ الافتراضي | 3500 |
| اللغة | العربية (RTL) |
| الوضع الداكن | مدعوم |
| قاعدة البيانات | PostgreSQL 16 (مع سكربت ترحيل من SQLite) |
| عدد الصفحات | 37 صفحة |
| عدد APIs | 8 نقاط نهاية |

---

## 🔗 روابط مهمة

| الرابط | الوصف |
|--------|-------|
| [GitHub Repository](https://github.com/faisal702tv/portfolio) | الكود المصدري |
| [almaqased.net](https://almaqased.net) | معايير الشريعة الإسلامية |

---

## 📄 الترخيص

MIT License

---

## 👨‍💻 المطور

**Faisal Mohammed**
- GitHub: [@faisal702tv](https://github.com/faisal702tv)
