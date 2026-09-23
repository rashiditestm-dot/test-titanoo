# Environment reference · مرجع متغیرهای محیطی

[English guide](en/README.md) · [راهنمای فارسی](fa/README.md) · [Home](../README.md)

This reference follows `app/config.py`, bootstrap code in `app/db.py`, `app/main.py` and `entrypoint.sh`. Defaults are the repository defaults, **not** a promise about a hosting provider’s network or available plan.

<div dir="rtl">

این مرجع از تنظیمات واقعی کد نوشته شده است. پیش‌فرض‌های جدول مربوط به خود پروژه‌اند، نه تضمینی دربارهٔ شبکه یا پلن میزبان. فایل `.env` خودکار توسط برنامه خوانده نمی‌شود. نمونهٔ [`.env.example`](../.env.example) برای کانتینر است و باید رمز آن را پیش از استفاده تغییر دهید.

</div>

> Variables initialize the process; dashboard settings are stored in SQLite. In particular, `public_domain` is a **setting**, not a `PUBLIC_DOMAIN` environment variable. Initial admin variables do **not** reset an existing database account.<br>
> متغیرها محیط فرایند را تنظیم می‌کنند، اما تنظیمات داشبورد در SQLite ذخیره می‌شوند. `public_domain` یک تنظیم دیتابیس است. متغیرهای مدیر اولیه، رمز حساب موجود را بازنشانی نمی‌کنند.

## 1 / Storage & process · ذخیره‌سازی و اجرا

| Variable | Default | Meaning / توضیح |
| :--- | :--- | :--- |
| `TITAN_DATA_DIR` | `<repository>/data` → `/app/data` in Docker | Persistent data directory / پوشهٔ دائمی داده |
| `TITAN_DB_PATH` | `<TITAN_DATA_DIR>/titan.db` | SQLite file; keep it on persistent storage / مسیر دیتابیس دائمی |
| `PORT` | `8000` | Container’s public HTTP listener / پورت عمومی HTTP کانتینر |
| `PANEL_PORT` | `10000` | Panel port behind Nginx / پورت داخلی پنل پشت Nginx |
| `PANEL_HOST` | Automatic IPv4 + IPv6 when available | Explicit bind override for `python -m app.main` / آدرس اتصال صریح هنگام اجرای ماژول برنامه |
| `NGINX_CONF` | `/etc/nginx/nginx.conf` | Entrypoint’s Nginx config path / مسیر کانفیگ Nginx برای اسکریپت شروع |
| `TITAN_EXTRA_LISTEN_PORTS` | `443,8080,8000,3000,80` | Extra HTTP listeners; empty disables extras, reserved inbound ports excluded / شنونده‌های اضافی HTTP؛ مقدار خالی آن‌ها را خاموش می‌کند |
| `XRAY_BIN` | `/usr/local/bin/xray` | Xray executable / مسیر باینری Xray |
| `TITAN_XRAY_CONFIG` | `/usr/local/bin/config.json` | Generated config; use a writable path locally / فایل تولیدشده؛ در اجرای محلی مسیر قابل نوشتن انتخاب کنید |
| `TITAN_XRAY_LOG` | `<TITAN_DATA_DIR>/xray.log` | Xray process output / خروجی فرایند Xray |
| `TITAN_DOCS` | Off | Enable FastAPI docs with `1`, `true` or `yes` / فعال‌سازی مستندات API برای توسعه |
| `TITAN_TRUST_PROXY_HEADERS` | `1` | Existing trusted-peer proxy-header handling; `0` disables it / کنترل فعلی هدرهای پراکسی برای همتای مورد اعتماد |

If the data directory is not writable, the current application logs an error and can fall back to temporary storage. A successful boot in that condition does **not** mean persistence is working.

اگر پوشهٔ داده قابل نوشتن نباشد، برنامهٔ فعلی خطا ثبت می‌کند و ممکن است از فضای موقت استفاده کند. بالا آمدن سرویس در این حالت، به معنی دائمی بودن داده‌ها نیست.

The extra Nginx listeners are **HTTP**, even if one happens to use port `443`. They do not install a TLS certificate. HTTP transport upstreams in `nginx.conf` retain their fixed internal ports unless you edit them alongside any port overrides.

شنوندهٔ اضافی Nginx حتی روی پورت `443`، بدون تنظیم جداگانهٔ TLS، همچنان HTTP است. تغییر پورت‌های Xray باید با upstreamهای ثابت `nginx.conf` هماهنگ باشد.

## 2 / Initial administrator · مدیر اولیه

| Variable | Default | Meaning / توضیح |
| :--- | :--- | :--- |
| `TITAN_ADMIN_USER` | `TiTaN` | Initial database username. The shipped password-only form submits `TiTaN`; keep this default for that form / نام اولیهٔ حساب؛ فرم فعلی نام `TiTaN` را ارسال می‌کند |
| `TITAN_ADMIN_PASS` | `TiTaN` | Initial password, read when the account is created / رمز اولیه در زمان ایجاد حساب |

Set a strong initial password before exposing a fresh service. There is no `SECRET_KEY`/`DATABASE_URL` requirement in this repository: session signing material and protocol keys are persisted through the existing database code.

پیش از عمومی کردن سرویس تازه، رمز اولیهٔ قوی تعیین کنید. متغیرهای فرضی مانند `SECRET_KEY` یا `DATABASE_URL` برای این پروژه لازم نیستند؛ اطلاعات امضای نشست و کلیدهای پروتکل با کد موجود در دیتابیس نگهداری می‌شوند.

## 3 / Nodes · نودها

| Variable | Default | Meaning / توضیح |
| :--- | :--- | :--- |
| `TITAN_ROLE` | `main` | `main` or `node` / نقش پنل اصلی یا نود |
| `TITAN_NODE_NAME` | Empty | Optional label for discovery / نام اختیاری برای شناسایی |
| `TITAN_NODE_SECRET` | Empty | Shared fleet credential. The main panel can mint/store a fleet secret when omitted / کلید مشترک؛ در صورت نبودن، پنل می‌تواند کلید خود را ایجاد و ذخیره کند |
| `TITAN_NODE_TOKEN` | Empty | Per-node credential issued by the main panel / توکن اختصاصی صادرشده از پنل |
| `TITAN_MAIN_URL` | Empty | Main panel URL on a node; bootstrap can also store a panel URL / آدرس پنل روی نود؛ اتصال اولیه می‌تواند آن را ذخیره کند |
| `TITAN_NODE_URL` | Derived from `RAILWAY_PUBLIC_DOMAIN`, else empty | This node’s public URL / URL عمومی خود نود |
| `TITAN_NODE_SYNC_INTERVAL` | `60` | Main-side background sync interval in seconds / فاصلهٔ همگام‌سازی پس‌زمینه، به ثانیه |

`TITAN_ROLE=node` is important for usage reporting. Bootstrap stores credentials; it does not rewrite the process environment or turn an already running `main` process into `node` role.

تنظیم `TITAN_ROLE=node` برای گزارش مصرف اهمیت دارد. اتصال اولیه اطلاعات اتصال را ذخیره می‌کند، اما محیط فرایند را بازنویسی نمی‌کند و نقش فرایند در حال اجرای `main` را به `node` تغییر نمی‌دهد.

## 4 / Public edge & TCP proxy · ورودی عمومی و TCP Proxy

| Variable | Default | Meaning / توضیح |
| :--- | :--- | :--- |
| `TITAN_EDGE_HTTP_ONLY` | Derived from Railway public/TCP domain presence | Explicit HTTP-edge-only behavior override / تعیین صریح حالت ورودی فقط HTTP |
| `TITAN_TCP_PROXY_DOMAIN` | `RAILWAY_TCP_PROXY_DOMAIN` or empty | External TCP proxy host / میزبان خارجی TCP Proxy |
| `TITAN_TCP_PROXY_PORT` | `RAILWAY_TCP_PROXY_PORT` or `0` | External TCP proxy port / پورت خارجی TCP Proxy |
| `TITAN_TCP_PROXY_APP_PORT` | `RAILWAY_TCP_APPLICATION_PORT` or `0` | Exact internal port that the proxy forwards to / همان پورت داخلی که پراکسی به آن متصل است |

Railway’s `RAILWAY_SERVICE_ID`/`RAILWAY_PROJECT_ID` identify the platform, `RAILWAY_PUBLIC_DOMAIN` helps derive public URLs, and `RAILWAY_SERVICE_NAME` can supply a node name. They are platform-injected values, not additional secrets to invent.

مقادیر Railway برای شناسایی پلتفرم، دامنه و نام سرویس به‌کار می‌روند و معمولاً توسط خود پلتفرم ارائه می‌شوند. آن‌ها را با رمز یا توکن اشتباه نگیرید.

## 5 / TLS, Reality & optional transports · پروتکل‌های اختیاری

| Variable | Default | Meaning / توضیح |
| :--- | :--- | :--- |
| `TITAN_TLS_CERT` | Empty | Certificate path for Xray-terminated TLS / مسیر گواهی TLS برای Xray |
| `TITAN_TLS_KEY` | Empty | Matching private key path / مسیر کلید خصوصی متناظر |
| `TITAN_REALITY_DEST` | `1.1.1.1:443` | Reality destination / مقصد Reality |
| `TITAN_REALITY_SNI` | `www.microsoft.com` | Reality SNI / نام SNI در Reality |
| `TITAN_FALLBACK_PORT` | `0` | Optional single-port fallback; needs certificate files / پورت ورودی جایگزین تک‌پورتی؛ نیازمند گواهی |
| `XRAY_SS_METHOD` | `2022-blake3-aes-128-gcm` | Default Shadowsocks method / روش پیش‌فرض Shadowsocks |
| `TITAN_HY2_OBFS` | Empty | Optional Salamander password; requires compatible core / رمز اختیاری Salamander با هستهٔ سازگار |
| `TITAN_HY2_MASQUERADE_URL` | Empty | Optional Hysteria masquerade proxy URL / آدرس اختیاری پراکسی masquerade |
| `TITAN_WG_BIN` | `/usr/local/bin/amnezia-wg-go` | Optional WireGuard userspace binary / باینری اختیاری WireGuard |
| `TITAN_WG_PORT` | `51820` | WireGuard UDP port / پورت UDP |
| `TITAN_WG_SUBNET` | `10.200.0.0/24` | WireGuard client subnet / زیرشبکهٔ کلاینت‌های WireGuard |
| `TITAN_WG_CONFIG` | `/usr/local/bin/wg0.conf` | Generated WireGuard config / کانفیگ تولیدشدهٔ WireGuard |

Reality private/public keys are generated/persisted by existing code, not by a new environment variable in this pass. Preserve the database. Setting UDP-related variables does not make an HTTP-only host expose UDP.

کلیدهای Reality با کد موجود ایجاد و ذخیره می‌شوند؛ متغیر محیطی جدیدی برای آن‌ها اضافه نشده است. دیتابیس را نگه دارید. تنظیم یک متغیر UDP، میزبان فقط HTTP را به سرویس‌دهندهٔ UDP تبدیل نمی‌کند.

<details>
<summary><strong>Internal inbound ports / پورت‌های ورودی داخلی</strong></summary>

| Variable | Default | Inbound |
| :--- | ---: | :--- |
| `XRAY_VLESS_WS_PORT` | `10001` | VLESS WS |
| `XRAY_VMESS_WS_PORT` | `10002` | VMess WS |
| `XRAY_TROJAN_WS_PORT` | `10003` | Trojan WS |
| `XRAY_XHTTP_PORT` | `10004` | XHTTP |
| `XRAY_GRPC_PORT` | `10005` | gRPC |
| `XRAY_SS_PORT` | `10006` | Classic Shadowsocks |
| `XRAY_TCP_VLESS_PORT` | `10007` | VLESS TCP / none |
| `XRAY_TCP_VLESS_TLS_PORT` | `10008` | VLESS TCP / TLS |
| `XRAY_TCP_VLESS_REALITY_PORT` | `10009` | VLESS TCP / Reality |
| `XRAY_TCP_VMESS_PORT` | `10010` | VMess TCP / none |
| `XRAY_TCP_VMESS_TLS_PORT` | `10011` | VMess TCP / TLS |
| `XRAY_TCP_TROJAN_PORT` | `10012` | Trojan TCP / TLS |
| `XRAY_HTTPUPGRADE_PORT` | `10013` | HTTPUpgrade |
| `XRAY_SS_2022_PORT` | `10014` | Shadowsocks 2022 |
| `XRAY_HY2_PORT` | `443` | Hysteria2 UDP |
| `XRAY_API_PORT` | `10085` | Internal Xray statistics/control |

</details>

## 6 / Contact metadata · اطلاعات تماس

| Variable | Default | Actual use / کاربرد واقعی |
| :--- | :--- | :--- |
| `TITAN_SUPPORT_URL` | `https://t.me/Code_Shield` | Telegram value in subscription-page API metadata / مقدار تلگرام در متادیتای API صفحهٔ اشتراک |
| `TITAN_GITHUB_URL` | `https://github.com/mr-rashidi` | GitHub value in subscription-page API metadata / مقدار گیت‌هاب در متادیتای API |

The current template’s contact anchors are still literal links in `templates/subscription.html`; these metadata variables do not automatically rewrite those anchors. To change the visible links, edit the existing anchors and restart the service, since the subscription template is cached in-process. No contact-integration feature is implied here.

لینک‌های منوی تماسِ قالب فعلی هنوز مستقیم در `templates/subscription.html` نوشته شده‌اند. این متغیرهای متادیتا، لینک‌های قالب را خودکار تغییر نمی‌دهند. برای تغییر لینک قابل کلیک، همان anchorها را ویرایش و سرویس را دوباره اجرا کنید، چون قالب اشتراک داخل فرایند cache می‌شود.

## 7 / Browser & development-only values · مقادیر مرورگر و ابزارها

- `titan_lang` is browser `localStorage` (`fa`/`en`), **not** an environment or database variable. The older `titan-language` preference is read as a fallback.
- `TITAN_LANG=en` selects the language for `scripts/bridge_smoke.js` only.
- `TITAN_ADMIN_PASSWORD` supplies the password to the verification/smoke tools only; the application’s bootstrap variable is **`TITAN_ADMIN_PASS`**.
- GeoIP services are contacted server-side over HTTPS (`ipwho.is`, with `ipapi.co` fallback). No API key is required by this implementation. The own-IP lookup deliberately bypasses HTTP proxy environment settings to avoid locating that proxy instead. If direct lookup is unavailable, location stays unknown/manual.

<div dir="rtl">

- `titan_lang` فقط تنظیم زبان مرورگر است و در متغیرهای محیطی یا دیتابیس ذخیره نمی‌شود. مقدار قدیمی `titan-language` به‌عنوان جایگزین خوانده می‌شود.
- `TITAN_LANG` و `TITAN_ADMIN_PASSWORD` برای ابزارهای تست‌اند؛ متغیر رمز اولیهٔ خود برنامه **`TITAN_ADMIN_PASS`** است.
- بررسی GeoIP در سمت سرور و با HTTPS انجام می‌شود. بررسی IP خود نود عمداً از پراکسی HTTP محیط استفاده نمی‌کند تا کشور پراکسی جای کشور نود قرار نگیرد. در صورت نبود دسترسی مستقیم، مکان نامشخص می‌ماند و ورود دستی قابل استفاده است.

</div>
