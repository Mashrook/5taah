# تطبيق خته - 5ATTH Travel

تطبيق ويب لحجز الرحلات والفنادق والسيارات والجولات والخدمات السياحية.

## التقنيات

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth + Database + Edge Functions)
- **Payment**: Moyasar
- **Travel API**: Amadeus

## المتطلبات

- Node.js 18+
- npm أو bun

## التثبيت

```bash
npm install
```

## تشغيل التطوير

```bash
npm run dev
```

## بناء للإنتاج

```bash
npm run build
```

## متغيرات البيئة

الملف `.env` تم تحديثه:

```
VITE_SUPABASE_URL=https://yxojwultjidolgiwyktl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=yxojwultjidolgiwyktl
```

## إعداد Supabase

### 1. تشغيل SQL Schema

اذهب إلى [Supabase SQL Editor](https://supabase.com/dashboard) لمشروعك وانسخ محتويات ملف:

```
supabase/schema.sql
```

واضغط "Run" لتنفيذ SQL.

### 2. إعداد API Keys في الأدمن

بعد تشغيل التطبيق، اذهب إلى لوحة الأدمن وأنشئ مفاتيح API:

- **Amadeus**: 
  - Client ID: `7W5MzlS607pHr3JqnSYqQP8tJjUgMzj2`
  - Client Secret: `7nlYxguGaMgnDMe5`

- **Moyasar**: أضف مفاتيح Moyasar

## النشر على Railway

### 1. ربط GitHub
- اذهب لـ [railway.app](https://railway.app)
- أنشئ مشروع جديد واختر "Deploy from GitHub repo"

### 2. متغيرات البيئة
أضف في Railway Settings:

```
AMADEUS_CLIENT_ID=7W5MzlS607pHr3JqnSYqQP8tJjUgMzj2
AMADEUS_CLIENT_SECRET=7nlYxguGaMgnDMe5

VITE_SUPABASE_URL=https://yxojwultjidolgiwyktl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=yxojwultjidolgiwyktl
```

### 3. نشر Supabase Functions

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref yxojwultjidolgiwyktl

# نشر الـ functions
supabase functions deploy amadeus
supabase functions deploy moyasar-verify
supabase functions deploy billing-checkout
supabase functions deploy billing-subscription
supabase functions deploy billing-invoices
supabase functions deploy public-config
supabase functions deploy health
supabase functions deploy run-cleanup
```

## الخدمات المدعومة

### ✈️ الرحلات (Flights)
- البحث عن رحلات جوية
- حجز وتأكيد الرحلات
- الدفع عبر Moyasar

### 🏨 الفنادق (Hotels)
- البحث عن فنادق
- عرض الغرف والأسعار
- حجز الفنادق

### 🚗 تأجير السيارات (Cars)
- البحث عن السيارات
- اختيار فترة الإيجار
- تأكيد الحجز

### 🎫 الجولات (Tours)
- استكشاف الجولات
- حجز الجولات
- تفاصيل الرحلة

### 🚐 النقل (Transfers)
- انتقالات المطار
- حجز النقل

### 🎓 الدراسة بالخارج (Study Abroad)
- برامج الدراسة
- تقديم الطلبات

## هيكل المشروع

```
src/
├── components/       # مكونات الواجهة
├── pages/           # الصفحات
│   ├── admin/       # صفحات الأدمن
│   └── dashboard/   # صفحات المستخدم
├── stores/          # حالة التطبيق (Zustand)
├── lib/             # الأدوات
└── integrations/    # التكاملات (Supabase)
```

## الترخيص

MIT
