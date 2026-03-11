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
- اختر `Mashrook/5taah`

### 2. اختيار الفرع (Branch)
في إعدادات **Source → Branch connected to production**، اختر **`main`**

> ✅ هذا هو الفرع الرئيسي الذي يحتوي على الكود النهائي

### 3. إعدادات البناء والتشغيل
Railway سيكتشف إعدادات `railway.json` تلقائياً:
- **Build Command**: `npm run build`
- **Start Command**: `npx serve -s dist --listen tcp://0.0.0.0:$PORT`

### 4. متغيرات البيئة
في تبويب **Variables**، أضف:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> ⚠️ مفاتيح Amadeus تُضاف في **Supabase Edge Function Secrets** وليس هنا

### 5. الدومين
بعد النشر، ستجد رابط تطبيقك في **Settings → Networking**:
```
https://5taah-production.up.railway.app
```

### 6. نشر Supabase Functions

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
