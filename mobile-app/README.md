# Portfolio Manager Pro - Mobile App 📱

تطبيق إدارة المحافظ الاستثمارية للموبايل مبني بـ Expo و React Native.

## 🚀 التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---------|---------|----------|
| Expo | 52 | إطار العمل الأساسي |
| React Native | 0.74 | تطوير الموبايل |
| Expo Router | 4 | التنقل بين الشاشات |
| Zustand | 4.5 | إدارة الحالة |
| React Query | 5 | جلب البيانات |
| TypeScript | 5 | الكتابة الآمنة |

## 📁 هيكل المشروع

```
mobile-app/
├── app.json                 # تكوين Expo
├── package.json             # التبعيات
├── tsconfig.json            # تكوين TypeScript
├── src/
│   ├── screens/             # شاشات التطبيق
│   │   └── HomeScreen.tsx   # الشاشة الرئيسية
│   ├── components/          # المكونات
│   ├── navigation/          # التنقل
│   ├── hooks/               # Custom Hooks
│   ├── services/
│   │   └── api.ts           # خدمات API
│   ├── store/
│   │   └── usePortfolioStore.ts  # Zustand Store
│   ├── types/
│   │   └── index.ts         # TypeScript Types
│   └── utils/
│       └── formatting.ts    # دوال التنسيق
└── assets/                  # الصور والأيقونات
```

## 🔧 التثبيت والتشغيل

### 1. تثبيت التبعيات
```bash
cd mobile-app
npm install
# أو
yarn install
# أو
bun install
```

### 2. تشغيل التطبيق
```bash
# تشغيل على المحاكي
npm start

# تشغيل على iOS
npm run ios

# تشغيل على Android
npm run android
```

### 3. بناء التطبيق للإنتاج
```bash
# بناء Android
npm run build:android

# بناء iOS
npm run build:ios
```

## 🔗 ربط التطبيق بـ API

### تغيير عنوان API
في ملف `src/services/api.ts`:

```typescript
// غيّر هذا إلى عنوان السيرفر الخاص بك
const BASE_URL = 'http://localhost:3000/api';
// أو للإنتاج:
const BASE_URL = 'https://your-domain.com/api';
```

### نقاط النهاية المتاحة

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/auth/login` | POST | تسجيل الدخول |
| `/stocks` | GET | جلب الأسهم |
| `/stocks` | POST | إضافة سهم |
| `/bonds` | GET | جلب السندات |
| `/funds` | GET | جلب الصناديق |
| `/alerts` | GET | جلب التنبيهات |
| `/market/indices` | GET | مؤشرات السوق |
| `/ai/chat` | POST | المحادثة مع AI |

## 📱 الميزات

### ✅ مُنجزة
- [x] شاشة رئيسية مع ملخص المحفظة
- [x] عرض مؤشرات السوق
- [x] قائمة الأسهم مع الأسعار
- [x] رؤى الذكاء الاصطناعي
- [x] تصميم RTL للعربية
- [x] ثيم احترافي بالألوان الذهبية

### 🚧 قيد التطوير
- [ ] شاشة تفاصيل السهم
- [ ] شاشة التنبيهات
- [ ] شاشة الإعدادات
- [ ] نظام الإشعارات
- [ ] المصادقة البصمة/الوجه
- [ ] وضع الظلام

## 🎨 الألوان

| اللون | الكود | الاستخدام |
|-------|-------|----------|
| الذهبي الأساسي | `#AA7942` | الأزرار، العناوين |
| البني الداكن | `#784B30` | التدرجات |
| الأخضر | `#4CAF50` | الأرباح |
| الأحمر | `#F44336` | الخسائر |

## 📞 الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- البريد: support@portfolio.sa
- GitHub Issues: [رابط المستودع]

---

**Portfolio Manager Pro v5.0** - جميع الحقوق محفوظة © 2024
