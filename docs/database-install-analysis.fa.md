# تحلیل بخش دیتابیس برای پایداری نصب

این سند برای کاهش خطاهای نصب در مسیر دیتابیس (PostgreSQL/SQLite + Prisma) نوشته شده است.

## جمع‌بندی سریع

- مسیر production در `docker-compose.yml` و `install.sh` روی PostgreSQL و اصل least-privilege هم‌راستا است.
- مسیر migration از runtime جدا شده است (`MIGRATION_DATABASE_URL`) و این برای امنیت/پایداری صحیح است.
- مسیر development با SQLite از مسیر مجزا (`schema.sqlite.prisma`) انجام می‌شود و با production قاطی نشده است.
- برای جلوگیری از رگرسیون نصب، چک تشخیصی داکتر برای کلیدهای حیاتی دیتابیس تقویت شد.

## جریان دیتابیس در نصب

1. installer مقادیر زیر را در `.env` می‌سازد/اعتبارسنجی می‌کند:
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `APP_DB_USER`, `APP_DB_PASSWORD`
   - `DATABASE_URL`, `MIGRATION_DATABASE_URL`
2. کانتینر `db` با کاربر bootstrap بالا می‌آید و role اپلیکیشن provision می‌شود.
3. کانتینر `app` برای runtime از `DATABASE_URL` (کاربر محدود) و برای migration از `MIGRATION_DATABASE_URL` استفاده می‌کند.
4. `prisma migrate deploy` در startup اجرا می‌شود؛ fallback ناامن به `db push` در production وجود ندارد.

## ریسک‌های رایج نصب که باید مانیتور شوند

- جابجایی اشتباه roleها در URLها (استفاده از bootstrap در runtime).
- نبود `MIGRATION_DATABASE_URL` در محیط production.
- تغییر compose بدون هم‌راستاسازی installer (drift بین envهای موردنیاز).
- تلاش برای اجرای production schema روی SQLite.

## چک‌های پیشنهادی قبل از هر release

```bash
node scripts/doctor.mjs
npm run test -- tests/install-compose-security.test.ts
npm run test -- tests/installer-env-compatibility.test.ts
```

## نکته امنیتی

با توجه به مدل privacy-first پروژه، این تحلیل فقط روی لایه persistence و نصب است و مرز E2EE را تغییر نمی‌دهد؛
سرور همچنان نباید به plaintext پیام/کلید خصوصی دسترسی داشته باشد.
