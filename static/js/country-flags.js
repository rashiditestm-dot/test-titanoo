/* Self-hosted SVG flags work even on systems without country-flag emoji. */
const TiTaNFlags = (() => {
  const codes = new Set("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(' '));
  let countries = {};
  const ready = fetch('/static/data/countries.json').then(r => r.ok ? r.json() : {}).then(data => {
    countries = Object.fromEntries(Object.entries(data).filter(([cc, names]) => codes.has(cc) && names && typeof names === "object"));
  }).catch(() => {});
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function code(value) {
    const node = typeof value === 'object' && value ? value : {country_code: value};
    let cc = String(node.country_code || '').trim().toUpperCase();
    if (cc === 'UK') cc = 'GB';
    if (codes.has(cc)) return cc;
    const country = String(node.country || '').trim().toLowerCase();
    for (const [key, names] of country ? Object.entries(countries) : []) {
      if ([names.en, names.fa, ...(names.aliases || [])].some(name => String(name || '').toLowerCase() === country)) return key;
    }
    const letters = Array.from(String(node.flag || ''));
    if (letters.length === 2 && letters.every(c => c.codePointAt(0) >= 0x1F1E6 && c.codePointAt(0) <= 0x1F1FF)) {
      cc = letters.map(c => String.fromCharCode(c.codePointAt(0) - 0x1F1E6 + 65)).join('');
      if (codes.has(cc)) return cc;
    }
    return '';
  }
  function countryName(value, lang) {
    const cc = code(value);
    if (!cc) return lang === 'en' ? 'Unknown location' : 'مکان نامشخص';
    if (countries[cc]) return countries[cc][lang === 'en' ? 'en' : 'fa'];
    try { return new Intl.DisplayNames([lang], {type:'region'}).of(cc); } catch (_) { return cc; }
  }
  function src(value) { return '/static/img/flags/' + (code(value).toLowerCase() || 'unknown') + '.svg'; }
  function html(value, lang) {
    const title = countryName(value, lang);
    return `<img class="country-flag" data-country="${code(value)}" src="${src(value)}" alt="${escape(title)}" title="${escape(title)}" width="24" height="18" loading="lazy">`;
  }
  function emoji(value) {
    const cc = code(value);
    return cc ? Array.from(cc).map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('') : '🏳️';
  }
  // A neutral flag is preferable to a broken image or an invented country.
  document.addEventListener('error', event => {
    const image = event.target;
    if (image && image.classList && image.classList.contains('country-flag') && !image.src.endsWith('/unknown.svg')) image.src = src('');
  }, true);
  document.addEventListener('titan:lang',()=>{
    const lang=document.documentElement.lang;
    document.querySelectorAll('.country-flag[data-country]').forEach(image=>{
      image.alt=countryName(image.dataset.country,lang); image.title=image.alt;
    });
    document.querySelectorAll('[data-country-name]').forEach(el=>el.textContent=countryName(el.dataset.countryName,lang));
  });
  return {ready, code, countryName, src, html, emoji};
})();
