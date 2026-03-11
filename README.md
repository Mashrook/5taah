# تطبيق خته - Mashrook/Khattah

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

أنشئ ملف `.env` بناءً على `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

## النشر على Railway

### 1. ربط GitHub
- اذهب لـ [railway.app](https://railway.app)
- أنشئ مشروع جديد واختر "Deploy from GitHub repo"

### 2. متغيرات البيئة
أضف في Railway Settings:

```
AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 3. نشر Supabase Functions

```bash
# تثبيت Supabase CLI
npm install -g supabase

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

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
