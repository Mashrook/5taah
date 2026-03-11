# 5taah

مستودع جاهز لاستقبال مشروع جديد.

---

## كيفية دفع مشروعك إلى هذا المستودع

### 1. من مشروع موجود على جهازك

```bash
git remote add origin https://github.com/Mashrook/5taah.git
git branch -M main
git push -u origin main
```

### 2. إنشاء مشروع جديد ودفعه

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Mashrook/5taah.git
git push -u origin main
```

### 3. دفع التحديثات لاحقًا بدون أسئلة

```bash
git add .
git commit -m "update"
git push
```

---

## ملاحظات
- تأكد من إعداد بيانات الاعتماد مسبقًا (Personal Access Token أو SSH key) لتجنب الأسئلة عند كل دفع.
- يحتوي هذا المستودع على `.gitignore` شامل يمنع رفع الملفات غير الضرورية.
