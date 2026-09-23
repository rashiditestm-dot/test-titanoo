# TiTaN deployment · راه‌اندازی TiTaN

<div align="center">

**One service for the panel. The same image for your nodes.**

🇬🇧 [Complete English guide](docs/en/README.md) · 🇮🇷 [راهنمای کامل فارسی](docs/fa/README.md)

</div>

| Task / کار | English | فارسی |
| :--- | :--- | :--- |
| Requirements & local setup / پیش‌نیاز و اجرای محلی | [Open](docs/en/README.md#requirements) | [مشاهده](docs/fa/README.md#requirements) |
| Docker | [Open](docs/en/README.md#docker) | [مشاهده](docs/fa/README.md#docker) |
| Railway | [Open](docs/en/README.md#railway) | [مشاهده](docs/fa/README.md#railway) |
| Dashboard / داشبورد | [Open](docs/en/README.md#dashboard) | [مشاهده](docs/fa/README.md#dashboard) |
| Subscription page / صفحهٔ اشتراک | [Open](docs/en/README.md#subscriptions) | [مشاهده](docs/fa/README.md#subscriptions) |
| Remote nodes / نودها | [Open](docs/en/README.md#nodes) | [مشاهده](docs/fa/README.md#nodes) |
| Environment / متغیرهای محیطی | [Shared reference](docs/environment.md) | [مرجع مشترک](docs/environment.md) |
| Troubleshooting / عیب‌یابی | [Open](docs/en/README.md#troubleshooting) | [مشاهده](docs/fa/README.md#troubleshooting) |

> **Before exposing a deployment:** attach persistent storage, set a strong initial password, configure HTTPS and verify the public port. The default password is `TiTaN`, not an empty string. Do not run intrusive verification scripts against a production panel without a backup.

> **پیش از عمومی کردن سرویس:** ذخیره‌سازی دائمی، رمز اولیهٔ قوی، HTTPS و پورت عمومی را بررسی کنید. رمز پیش‌فرض `TiTaN` است، نه مقدار خالی. اسکریپت‌های بررسیِ تغییردهندهٔ داده را بدون پشتیبان روی سرویس اصلی اجرا نکنید.
