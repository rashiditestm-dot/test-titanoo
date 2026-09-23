# Third-party notices · مجوزهای وابستگی‌های ثالث

[Home](../README.md) · [English guide](en/README.md) · [راهنمای فارسی](fa/README.md)

## Country flags

- Source: [flag-icons](https://github.com/lipis/flag-icons), npm release **7.5.0**.
- Location: `static/img/flags/`.
- Included: the 4:3 flags for ISO 3166-1 country/territory codes, plus the commonly used Kosovo code `XK`.
- License: **MIT**; the unmodified upstream license is included at [`static/img/flags/LICENSE`](../static/img/flags/LICENSE).
- `unknown.svg` is a small neutral fallback created for this maintenance pass. It deliberately does not represent a country.

The subscription template keeps its three existing embedded flag illustrations for US/DE/NL. Other flags are served locally; the application does not depend on a third-party flag CDN or an OS emoji font for those images.

## Country display names

[`countries.json`](../static/data/countries.json) contains country codes, English/Persian display names and normalization aliases. The code/name facts were assembled using ISO country data (`pycountry`) and Unicode CLDR display names via Babel, with short, human-readable aliases retained.

Unicode data terms are included in [`UNICODE-LICENSE.txt`](../static/data/UNICODE-LICENSE.txt). The runtime reads the checked-in JSON and does not require `pycountry` or Babel to be installed. When adding a code, also maintain its SVG and the valid-code set in `country-flags.js`.

## Vazirmatn

The repository already included the local Vazirmatn font files. Their upstream **SIL Open Font License 1.1** is now included at [`static/fonts/OFL.txt`](../static/fonts/OFL.txt).

Upstream: [Vazirmatn](https://github.com/rastikerdar/vazirmatn).

## Existing project artwork and source

Active backgrounds, brand artwork and gallery keys were retained. The original standalone [logo asset](../static/img/logo.png) is also retained. This document does not assign a new license to the project’s source or existing artwork. No project-wide root `LICENSE` file was present in the reviewed snapshot.

---

<div dir="rtl">

## خلاصهٔ فارسی

- پرچم‌های محلی از نسخهٔ **۷.۵.۰ پروژهٔ flag-icons** هستند و مجوز MIT اصلی آن‌ها کنار فایل‌ها قرار دارد. پرچم خنثیِ مکان نامشخص، کشور واقعی را نمایش نمی‌دهد.
- جدول کشورها شامل کد، نام فارسی و انگلیسی و نام‌های جایگزین برای شناسایی داده‌های قبلی است. نام‌ها با استفاده از داده‌های کشور و Unicode CLDR تهیه شده‌اند. شرایط Unicode در فایل مرتبط آمده است؛ نصب Babel یا pycountry برای اجرای برنامه لازم نیست.
- فایل‌های فونت Vazirmatn از قبل در مخزن وجود داشتند و متن مجوز OFL آن‌ها افزوده شده است.
- تصاویر فعال، پس‌زمینه‌ها و شناسه‌های گالری حفظ شده‌اند. مجوز تازه‌ای برای کد یا تصاویر اصلی پروژه تعیین نشده است و وجود یک مجوز سراسری مانند MIT برای خود پروژه فرض نمی‌شود.

</div>
