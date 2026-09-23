# Maintenance report · گزارش اصلاحات

**Repository:** `rashiditestm-dot/test-titanoo`<br>
**Reviewed base:** `055281847034617d62dd03f59027077f232510d9`<br>
**Date:** 2026-09-23

[Home](../README.md) · [English guide](en/README.md) · [راهنمای فارسی](fa/README.md) · [Complete file manifest](change-manifest.txt) · [Verification data](verification.json)

---

<div dir="rtl">

## نتیجهٔ کار

اصلاحات در نسخهٔ کاری مخزن انجام شده است. **هیچ دیپلوی روی Railway یا VPS و هیچ push به GitHub انجام نشده است.** مسیرها و ورودی‌های API، ساختار دیتابیس، احراز هویت و منطق تولید و ارائهٔ اشتراک بازنویسی نشده‌اند.

تغییرات بک‌اند به اطلاعات مکان و پرچم محدود شده‌اند. نام‌ها، یادداشت‌ها، دامنه‌ها، توکن‌ها و محتوای کانفیگ کاربر برای ترجمه بازنویسی نمی‌شوند.

## ۱ / فایل‌های حذف‌شده

پیش از حذف، ارجاع‌های کد، قالب‌ها، CSS، اسکریپت‌ها، تست‌ها و مستندات بررسی شدند.

| فایل | دلیل حذف |
| :--- | :--- |
| `static/js/login.js` | به صفحهٔ ورودِ ارائه‌شده متصل نبود؛ صفحه از اسکریپت داخل قالب استفاده می‌کند |
| `static/js/ui.js` | رابط قدیمی و بدون مصرف‌کننده در قالب‌های فعال |
| `static/js/pages.js` | متعلق به همان رابط قدیمی؛ داشبورد فعال از `titan-bridge.js` استفاده می‌کند |
| `templates/setup.html` | هیچ مسیر فعالی آن را render نمی‌کرد؛ مسیر راه‌اندازی فعلی به ورود هدایت می‌شود |
| `static/css/login.css` | تنها ارجاع آن قالب راه‌اندازیِ بی‌استفاده بود؛ CSS ورود فعال داخل `login.html` است |
| `static/img/login-bg.jpg` | تنها در CSS حذف‌شدهٔ بالا استفاده می‌شد؛ پس‌زمینهٔ فعال ورود `titan-bg.png` است |
| `static/img/favicon.png` | بدون ارجاع و دقیقاً تکراریِ `logo.png` از نظر بایت |
| `static/img/backm.png` | فایل دو بایتیِ خالی، نه تصویر معتبر؛ قالب فعال از آن استفاده نمی‌کرد و فقط تست قدیمی به آن اشاره داشت |
| `app/colo_map.py` | پس از اصلاح منبع مکان، هیچ مصرف‌کننده‌ای برای تبدیل PoP کلودفلر به کشور نود باقی نماند |

قالب عمومی `status.html`، CSS مورد استفادهٔ آن، تصاویر فعال، فونت‌ها و فایل‌های گالری حفظ شدند. شناسه‌های `g1` تا `g6` به دلیل استفاده در API و داده‌های ذخیره‌شده تغییر نکردند.

## ۲ / فایل‌های تغییرنام‌یافته

**هیچ فایل یا پوشه‌ای rename نشده است.** تغییر نام غیرضروری، خصوصاً برای شناسه‌های گالری و فایل‌های دیپلوی، انجام نشد.

## ۳ / فایل‌های موجودِ اصلاح‌شده

| گروه | فایل‌ها |
| :--- | :--- |
| مکان و پرچم | `app/geo.py`، `app/main.py`، `app/nodes.py`، `app/tasks.py` |
| ترجمه و اتصال رابط | `static/js/i18n.js`، `static/js/titan-bridge.js` |
| صفحات درخواستی | `templates/login.html`، `templates/dashboard.html`، `templates/subscription.html` |
| مستندات اصلی | `README.md`، `DEPLOY.md` |
| ابزارهای بررسی | `requirements-dev.txt`، `scripts/bridge_smoke.js`، `scripts/smoke_test.py`، `scripts/verify_deploy.py` |
| تست‌های موجود | `tests/test_node_discovery.py`، `tests/test_subscription_page.py` |

فهرست کامل فایل‌ها، از جمله تک‌تک پرچم‌های افزوده‌شده، در [manifest](change-manifest.txt) است.

### فایل‌ها و منابع افزوده‌شده

- `.gitignore` و `.env.example` برای دادهٔ موقت، تنظیمات محلی و نمونهٔ محیط کانتینر؛ دادهٔ واقعی یا رمز خصوصی وارد مخزن نشده است.
- `static/js/country-flags.js` و `static/data/countries.json` برای نمایش و یکسان‌سازی کشورها.
- **۲۵۰ پرچم کشور/قلمرو** و یک پرچم خنثی در `static/img/flags/`، به همراه مجوز منبع.
- متن مجوز فونت Vazirmatn و داده‌های Unicode.
- `scripts/check_i18n.js` و `scripts/check_ui.py` برای بررسی تکرارپذیر ترجمه و مرورگر.
- `tests/test_geo.py` و `tests/test_i18n.py` برای جلوگیری از بازگشت خطاها.
- راهنماها، مرجع محیط، تصویر سربرگ مستندات و گزارش حاضر در `docs/`.

## ۴ / چه مشکلاتی در ترجمه اصلاح شد؟

- انتخاب زبان صفحهٔ ورود قبلاً فقط عنوان دکمه و پیام را عوض می‌کرد؛ اکنون متن صفحه، فرم، وضعیت ورود، خطاها و متن‌های دسترس‌پذیری تغییر می‌کنند.
- انتخاب زبان موجود در تنظیمات داشبورد متصل شد. اتصال دکمه‌ها و ورودی‌ها دیگر به عبارت فارسیِ label یا placeholder وابسته نیست و با ID و `data-setting` انجام می‌شود.
- عنوان‌ها، منوها، جدول‌ها، پنجره‌ها، tooltipها، پیام‌های خالی، وضعیت‌ها و پیام‌های خطا در هر دو زبان پوشش داده شدند.
- جهت RTL/LTR و قالب تاریخ با زبان هماهنگ شدند. تغییر زبان، نام و مقادیر ذخیره‌نشدهٔ فرم یا انتخاب کانفیگ‌ها را پاک نمی‌کند.
- در صفحهٔ اشتراک، «باقی‌مانده»، «مشاهدهٔ همه»، عنوان پیش‌فرض پلن، منوی تماس، توضیح کلاینت‌ها، دکمه‌های کپی و متن‌های ARIA کامل شدند. عبارت تکراری انگلیسیِ انقضا نیز اصلاح شد.
- متن‌هایی که به قابلیت ناموجود اشاره می‌کردند دقیق‌تر شدند: گزینه‌های کمک در ورود، ورود اجتماعی معرفی نمی‌شوند؛ باز نشدن برنامه هم به معنی تشخیص قطعی نصب نبودن آن نیست.
- انتخاب زبان بین این سه صفحه در `titan_lang` مشترک است. متن‌ها و نام‌های واردشده توسط مدیر همچنان بدون دست‌کاری نمایش داده می‌شوند.
- کاتالوگ مشترک **۷۳۲ کلید دوزبانه** و کاتالوگ صفحهٔ اشتراک **۵۱ کلید** دارد؛ وجود ترجمه‌ها و تطبیق پارامترها به‌صورت خودکار بررسی می‌شود.

## ۵ / علت و اصلاح Auto Location

علت اصلی در منبع داده بود: کار پس‌زمینه، `colo` دریافتی از Cloudflare را به شهر و کشور تبدیل می‌کرد و آن را در رکورد محلی نود می‌نوشت. این مقدار، نقطهٔ ورود به شبکهٔ Cloudflare است و الزاماً مکان سرور نیست. پنل سپس همان رکورد را از پاسخ شناسایی نود می‌خواند.

دو مشکل رابط نیز وجود داشت: نتیجه از `identity` خام نمایش داده می‌شد و فیلدهای دارای مقدار دوباره پر نمی‌شدند؛ بنابراین مقدار قدیمی می‌توانست بعد از تغییر دامنه باقی بماند.

اصلاحات:

1. نودِ به‌روز از IP خروجی خودش با HTTPS GeoIP تخمین مکان می‌گیرد؛ پاسخ مربوط به IP دیگری پذیرفته نمی‌شود.
2. پنل از پاسخ همان نود استفاده می‌کند؛ IP لبهٔ CDN یا کشور خود پنل جایگزین مکان نود نمی‌شود.
3. تبدیل `colo` به کشور نود و fallback جغرافیاییِ حدسی حذف شد. اگر تشخیص ممکن نباشد، مکان نامشخص و ورود دستی باقی می‌ماند.
4. کندی یا خطای GeoIP نباید شناسایی هویت یک نود سالم را از دسترس خارج کند؛ بخش اختیاری مکان مهلت محدود دارد.
5. فرم از `fields` نرمال‌شده استفاده می‌کند. نتیجهٔ مربوط به دامنهٔ قبلی یا پنجرهٔ بسته‌شده اعمال نمی‌شود؛ تغییر دامنه، دادهٔ خودکار قبلی را پاک می‌کند.
6. اطلاعات دستی کشور حفظ می‌شوند و پرچم با کد کشور معتبر هماهنگ می‌شود.

**محدودیت مهم:** GeoIP تخمینی است، به‌خصوص پشت NAT یا خروجی مشترک ابر. برای منبع اصلاح‌شده باید **پنل و نودها با هم به‌روز شوند**. دربارهٔ نود قدیمی یا مکان نامعلوم، کشور دقیقِ فیزیکی تضمین نمی‌شود و کشور ساختگی نیز نمایش داده نمی‌شود.

## ۶ / پرچم‌ها

پرچم‌ها بر پایهٔ کد معتبر کشور یا نام کشورِ قابل شناسایی انتخاب می‌شوند. پرچم خالی یا ناسازگار نمی‌تواند کد معتبر کشور را کنار بزند. کارت‌ها و نمایش‌های تصویری از SVG محلی استفاده می‌کنند و به CDN پرچم یا فونت ایموجی سیستم‌عامل وابسته نیستند. مکان نامعلوم پرچم خنثی دارد؛ کشور برای آن حدس زده نمی‌شود.

## ۷ / Responsive و چیدمان ورود

- **ورود:** کارت‌ها در دسکتاپ کنار هم و بدون فاصله‌اند، گوشه‌های بیرونی حفظ شده‌اند و مرز میانی مشترک است. در عرض کوچک، دو پنل عمودی می‌شوند؛ padding، متن‌ها، ویژگی‌ها و دکمه‌های پشتیبانی متناسب با عرض تغییر می‌کنند.
- **داشبورد:** منوی کناری در اندازهٔ تبلت/موبایل جمع می‌شود و قابل پیمایش است. نوار بالا، کارت‌های آماری، نمودارها و بخش‌های جزئیات reflow می‌شوند. جدول‌ها روی تلفن به ردیف‌های دارای برچسب تبدیل می‌شوند؛ فرم‌ها و پنجره‌ها تک‌ستونه و دکمه‌ها قابل دسترس می‌مانند.
- **اشتراک:** حلقهٔ مصرف و آمار در تلفن عمودی می‌شوند؛ کارت‌های کلاینت و دانلود به ردیف‌های خوانا تبدیل می‌شوند؛ فهرست کانفیگ و پنجرهٔ «همه» خطوط جدا برای مکان و لینک دارند. کوچک کردن متن تا اندازه‌های چندپیکسلی حذف شده است.
- **سازگاری:** جهت زبان، safe-area، ارتفاع پویا، حداقل اندازهٔ ورودی موبایل و reduced motion در نظر گرفته شدند.
- تصاویر و رنگ‌های فعال بازطراحی نشدند. MIME پس‌زمینهٔ JPEG صفحهٔ اشتراک تصحیح شد؛ بایت‌های خود تصویر همان تصویر اولیه‌اند.

ردیف‌های نمونهٔ تکراری که بخش‌های زندهٔ داشبورد بلافاصله جایگزینشان می‌کردند، به وضعیت بارگذاری تبدیل شدند تا مکان یا کاربر نمونه به‌جای دادهٔ واقعی نمایش داده نشود.

## ۸ / مستندات کجا هستند؟

- `README.md`: ورودی اصلی دوزبانه، معرفی، قابلیت‌های واقعی، شروع سریع و ساختار پروژه.
- `docs/en/README.md`: راهنمای کامل انگلیسی.
- `docs/fa/README.md`: راهنمای کامل فارسی.
- `docs/environment.md`: متغیرهای محیطی و پیش‌فرض‌های واقعی، به دو زبان.
- `DEPLOY.md`: مسیر دسترسی سریع به راهنماهای دیپلوی.
- `docs/third-party.md`: منابع و مجوز پرچم‌ها، فونت و دادهٔ کشورها.

راهنماها پیش‌نیاز، نصب، اجرای محلی، Railway، داشبورد، اشتراک، نود، کلاینت، تنظیمات، عیب‌یابی و نگهداری را پوشش می‌دهند. رمز پیش‌فرض درست (`TiTaN`، نه رمز خالی)، نیاز به Volume و محدودیت‌های واقعی پروژه صریح نوشته شده‌اند.

## ۹ / نتیجهٔ بررسی‌ها و حفظ عملکرد

| بررسی | نتیجه |
| :--- | :--- |
| کل مجموعهٔ pytest | **۲۹۸ موفق، صفر خطا/شکست/skip** |
| مرورگرها | Chromium، Firefox و WebKit |
| ماتریس صفحه | **۸۴ حالت زبان/عرض؛ ۲۵۲ بررسیِ سه صفحهٔ اصلی** |
| عرض‌ها | ۳۲۰، ۳۶۰، ۳۹۰، ۴۸۰، ۶۰۰، ۷۶۸، ۸۲۰، ۹۶۰، ۱۰۲۴، ۱۱۰۰، ۱۲۸۰، ۱۴۴۰، ۱۹۲۰ و ۲۵۶۰ پیکسل |
| تعامل‌ها | ورود، حفظ فرم هنگام تغییر زبان، تشخیص نود، ذخیرهٔ تنظیمات، ساخت و ویرایش کاربر، ساخت/غیرفعال‌سازی/حذف اشتراک و افزودن نود دستی |
| ترجمه و جاوااسکریپت | کاتالوگ‌ها، کلیدهای استفاده‌شده، پارامترها، syntax و رندر داشبورد در فارسی/انگلیسی بررسی شدند |
| lint و diff | `ruff check app tests scripts` و `git diff --check` موفق |
| تطبیق API | **۷۷ اعلان route و امضای ورودی با نسخهٔ مبنا یکسان‌اند** |

کدهای `app/db.py`، `app/security.py`، `app/config.py`، `app/routing.py`، `app/links.py`، `app/xray.py`، `app/reality.py`، `app/wg.py`، `app/sskeys.py` و `app/state.py` با نسخهٔ مبنا یکسان‌اند. فایل‌های Docker، Nginx، Railway، Render، entrypoint، Procfile و وابستگی‌های runtime نیز تغییر نکرده‌اند.

بدنهٔ توابع احراز هویت و منطق اصلی همگام‌سازی/اعتبارسنجی کلید نود دست‌نخورده‌اند. تغییرات نمایش مکان در `_entry_place` دادهٔ پرچم/کشور را اصلاح می‌کند، نه انتخاب لینک یا محتوای اتصال را.

### شفافیت دربارهٔ تست‌ها

- نسخهٔ مبنا پیش از تغییر، دو تست ناسازگار با پس‌زمینهٔ واقعی صفحهٔ اشتراک داشت. این تست‌ها اکنون نوع صحیح تصویر و **هش همان تصویر اولیه** را کنترل می‌کنند؛ برای سبز کردن تست، تصویر یا هویت بصری جایگزین نشده است.
- یک تست مربوط به شبکه/همگام‌سازی در بعضی اجرای‌های مبنا ناپایدار بود. منطق routing برای رفع آن تغییر نکرده است؛ اجرای کامل نهایی موفق است.
- در اجرای تست‌ها یک هشدار مربوط به لغو اتصال async در محیط Python/httpx مشاهده شد. این هشدار پنهان یا با تغییر منطق سرویس خاموش نشده است.
- بررسی‌های مرورگری روی موتورهای مرورگر در میزبان Linux انجام شدند؛ شبیه‌سازی iPhone/Pixel جای آزمایش دستگاه واقعی، Windows یا macOS واقعی را نمی‌گیرد.
- **Docker build واقعی، دیپلوی Railway/VPS و عبور ترافیک واقعی Xray در این محیط تأیید نشده‌اند.** پیش از انتشار روی سرویس اصلی، نسخهٔ آزمایشی را با یک کلاینت واقعی و نودهای خودتان بررسی کنید.

</div>

---

## English summary

This maintenance pass is limited to translations, node-location metadata, flags, responsive layout, the joined login cards, reference-checked cleanup and documentation. **No GitHub push or production deployment was performed.**

- **Deleted:** nine obsolete/unreferenced files listed above. No file or directory was renamed.
- **Translations:** 732 paired shared messages and 51 subscription-page messages; working language controls, RTL/LTR, localized dates, labels, dialogs, errors and accessibility text. User-entered values and connection payloads are not translated.
- **Location:** the old Cloudflare PoP-to-country inference was not evidence of the node’s location. Updated nodes report an own-egress GeoIP estimate; the panel does not substitute its own country or a CDN DNS location. Failed lookup stays unknown/manual, and optional geodata cannot consume the full node-discovery timeout. Stale-domain form responses are discarded.
- **Flags:** local SVGs for 250 country/territory codes plus a neutral unknown flag. Valid country metadata overrides a stale/empty flag.
- **Responsive:** fluid adjoining login panels; stacked layouts on smaller screens; dashboard navigation/cards/forms/table rows reflow; subscription usage, client lists and config rows remain readable rather than being scaled down.
- **Documentation:** complete mirrored English/Persian guides, a bilingual environment reference and third-party notices. Actual limitations are documented instead of claiming billing, full RBAC or universal protocol/client support.
- **Verification:** 298 passing pytest cases; 84 browser viewport/language cases across Chromium, Firefox and WebKit (252 principal page checks), plus interaction and device-emulation checks. All 77 route declarations/signatures match the base. Database/authentication modules, routing, link generation and proxy configuration files remain unchanged.

GeoIP remains approximate and both main and nodes need updating for the corrected self-report. Browser emulation and mock/API tests are not a substitute for a real client/traffic test on the target host. See [the full manifest](change-manifest.txt) for every changed, added and deleted path.
