<div align="center">

<img src="docs/assets/cover.svg" alt="TiTaN Panel — deployment and operations" width="100%">

# TiTaN Panel

**Manage users. Publish subscriptions. Connect your nodes.**

🇬🇧 [English guide](docs/en/README.md) · 🇮🇷 [راهنمای فارسی](docs/fa/README.md)

[Deployment](DEPLOY.md) · [Environment reference](docs/environment.md) · [Maintenance report](docs/maintenance-report.md)

</div>

---

## 🇬🇧 English

TiTaN is a **FastAPI + SQLite proxy-management panel** with a Persian/English dashboard and a public subscription page. Its Docker image runs **Nginx, the Python panel and Xray-core** together. The same codebase can run as the main panel or as a remote node.

### What is actually included

| Area | In this repository |
| :--- | :--- |
| **Users & configs** | Create/edit users, choose protocol/transport, set quota and expiry, copy links and QR codes |
| **Subscriptions** | Select existing users/configs, create named links, set an image/plan label, enable or disable a link |
| **Public page** | Profile, usage, expiry, config locations, copy actions and client import/download links |
| **Nodes** | Domain discovery, credential bootstrap, config synchronization, usage reports and health checks |
| **Location & flags** | Node-specific GeoIP estimates, manual country metadata and self-hosted country flags; no CDN-country guessing |
| **Operations** | Settings, Xray configuration generation, traffic collection, database backup/restore and diagnostics |

> **Know the boundaries.** Protocol availability depends on the installed core and the ports your host exposes. Hysteria2 and WireGuard need UDP; WireGuard also needs host capabilities. Some legacy UI controls are presentational, and device/IP/request limits are not enforced by the current proxy path. The [full guide](docs/en/README.md#limitations) documents these limits rather than promising features the code does not implement.

### Start here

1. Read the [requirements and installation steps](docs/en/README.md#requirements).
2. For Railway, use the included Docker deployment and attach a **persistent volume at `/app/data`**.
3. Open `/login`. A fresh database uses **`TiTaN` as the password**, unless `TITAN_ADMIN_PASS` was set before first boot. **An empty password is not valid.**
4. Change the initial password, set the public domain, then create a user and subscription.

```bash
# Local UI/API development; no real proxy traffic without Xray + ingress.
git clone https://github.com/rashiditestm-dot/test-titanoo.git
cd test-titanoo
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
mkdir -p data
export TITAN_DATA_DIR="$PWD/data"
export TITAN_XRAY_CONFIG="$PWD/data/xray.json"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-proxy-headers
```

Open **`http://localhost:8000/login`**. See the guide for Windows, Docker, HTTPS, Railway and nodes.

---

<div dir="rtl">

## 🇮🇷 فارسی

TiTaN یک **پنل مدیریت پروکسی با FastAPI و SQLite** است. داشبورد مدیریتی و صفحهٔ عمومی اشتراک از فارسی و انگلیسی پشتیبانی می‌کنند. در نسخهٔ Docker، **Nginx، پنل پایتون و Xray-core** در یک کانتینر اجرا می‌شوند. همین کد می‌تواند نقش پنل اصلی یا نود را داشته باشد.

### قابلیت‌های موجود در همین مخزن

| بخش | امکانات موجود |
| :--- | :--- |
| **کاربران و کانفیگ‌ها** | ساخت و ویرایش کاربر، انتخاب پروتکل و روش انتقال، تعیین حجم و انقضا، لینک اتصال و کد QR |
| **اشتراک‌ها** | انتخاب کاربران و کانفیگ‌های موجود، ساخت لینک با نام دلخواه، تصویر و عنوان پلن، فعال یا غیرفعال کردن لینک |
| **صفحهٔ عمومی اشتراک** | نمایش پروفایل، مصرف، انقضا، مکان کانفیگ‌ها، کپی و لینک ورود به کلاینت یا دانلود آن |
| **نودها** | شناسایی با دامنه، تنظیم اطلاعات اتصال، همگام‌سازی کانفیگ، گزارش مصرف و بررسی وضعیت |
| **مکان و پرچم** | تخمین مکان از خود نود، اطلاعات دستی کشور و پرچم‌های محلی؛ بدون حدس زدن مکان سرور از لبهٔ CDN |
| **نگهداری** | تنظیمات، تولید کانفیگ Xray، جمع‌آوری مصرف، پشتیبان‌گیری و بازیابی دیتابیس و ابزارهای بررسی |

> **محدودیت‌ها را بشناسید.** پشتیبانی عملی از هر پروتکل به هسته و پورت‌های قابل دسترس میزبان وابسته است. Hysteria2 و WireGuard به UDP نیاز دارند و WireGuard به دسترسی‌های سیستم هم نیاز دارد. بعضی کنترل‌های قدیمی رابط صرفاً نمایشی‌اند و محدودیت دستگاه، IP و تعداد درخواست در مسیر فعلی پروکسی اعمال نمی‌شوند. [راهنمای کامل](docs/fa/README.md#limitations) این موارد را شفاف توضیح می‌دهد.

### از اینجا شروع کنید

۱. [پیش‌نیازها و روش نصب](docs/fa/README.md#requirements) را بخوانید.

۲. برای Railway از Docker موجود استفاده کنید و **Volume دائمی با مسیر `/app/data`** بسازید.

۳. صفحهٔ `/login` را باز کنید. رمز عبور دیتابیس تازه **`TiTaN`** است، مگر اینکه پیش از اولین اجرا `TITAN_ADMIN_PASS` را تعیین کرده باشید. **رمز خالی معتبر نیست.**

۴. رمز اولیه را تغییر دهید، دامنهٔ عمومی را تنظیم کنید و سپس کاربر و لینک اشتراک بسازید.

[راهنمای فارسی: نصب، داشبورد، اشتراک، نود و عیب‌یابی ←](docs/fa/README.md)

</div>

---

## Project structure · ساختار پروژه

```text
.
├── app/                  FastAPI, SQLite, routing, geo, Xray and node coordination
├── templates/            login.html, dashboard.html, subscription.html, status.html
├── static/
│   ├── js/               Translations, dashboard bindings and shared flag renderer
│   ├── css/              Local fonts and the public status page stylesheet
│   ├── data/             Country names/codes shared with the backend
│   ├── fonts/            Vazirmatn + OFL license
│   └── img/              Existing artwork, gallery and local SVG flags
├── tests/                Application and frontend regressions
├── scripts/              Development, verification and browser checks
├── docs/                 English/Persian guides, reference and change report
├── Dockerfile            Single-container runtime (Linux x86-64 binaries)
├── entrypoint.sh         Container startup and public-port routing
├── nginx.conf            Panel and Xray ingress routes
├── railway.json          Railway Docker deployment and /healthz check
├── render.yaml           Existing Render deployment descriptor
├── Procfile              Existing process entry point
├── requirements.txt      Runtime dependencies
└── requirements-dev.txt  Test and lint dependencies
```

### Verification · بررسی تغییرات

```bash
pip install -r requirements.txt -r requirements-dev.txt
python -m pytest
node scripts/check_i18n.js
node scripts/bridge_smoke.js

# Optional: an isolated test server, real browsers and temporary data only.
python -m playwright install --with-deps chromium firefox webkit
python scripts/check_ui.py
```

The [maintenance report](docs/maintenance-report.md) records the tested scope and remaining deployment checks. A passing mock/API test is **not** proof of live proxy connectivity.

گزارش تغییرات، محدودهٔ تست‌ها و بررسی‌های باقی‌مانده برای دیپلوی واقعی را مشخص می‌کند. موفقیت تست‌های API یا حالت آزمایشی، به معنی تأیید عبور ترافیک واقعی پروکسی نیست.

### Licensing · مجوزها

No project-wide `LICENSE` file is included in this snapshot; do not assume a project license from an older README. See [third-party notices](docs/third-party.md) for bundled flags and fonts.

در این نسخه فایل مجوز سراسری پروژه وجود ندارد. مجوز پرچم‌ها و فونت‌های همراه در [یادداشت وابستگی‌های ثالث](docs/third-party.md) آمده است.
