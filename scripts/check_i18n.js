/* Validate the shipped translations without a browser or npm dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('static/js/i18n.js');
const block = source.match(/const messages = (\{[\s\S]*?\n  \});/);
assert.ok(block, 'Shared message catalogue is missing');
const messages = vm.runInNewContext('(' + block[1] + ')');
for (const [key, pair] of Object.entries(messages)) {
  assert.equal(pair.length, 2, key);
  assert.equal(typeof pair[0], 'string', key + ': Persian');
  assert.equal(typeof pair[1], 'string', key + ': English');
  assert.ok(!/[\u0600-\u06ff]/.test(pair[1]), key + ': Persian in English UI text');
  const variables = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
  assert.equal(variables(pair[0]), variables(pair[1]), key + ': mismatched placeholders');
}
const sharedFiles = ['templates/login.html', 'templates/dashboard.html', 'templates/status.html', 'static/js/titan-bridge.js'];
for (const file of sharedFiles) {
  const text = read(file);
  for (const match of text.matchAll(/data-i18n(?:-ph|-aria|-tip|-title|-alt)?="([a-zA-Z_][\w-]*)"|\b(?:tr|uiText|I18N\.t)\(['"]([\w-]+)['"]/g)) {
    const key = match[1] || match[2];
    assert.ok(messages[key], file + ': missing ' + key);
  }
}
const subscription = read('templates/subscription.html');
const subBlock = subscription.match(/const I18N = (\{[\s\S]*?\n\});/);
assert.ok(subBlock, 'Subscription catalogue is missing');
const sub = JSON.parse(subBlock[1]);
assert.deepEqual(Object.keys(sub.fa).sort(), Object.keys(sub.en).sort());
for (const [key, text] of Object.entries(sub.en)) {
  assert.ok(!/[\u0600-\u06ff]/.test(text), 'subscription: ' + key);
}
for (const match of subscription.matchAll(/data-i18n(?:-aria|-alt)?="([\w]+)"|\btr\(['"](\w+)['"]/g)) {
  const key = match[1] || match[2];
  assert.ok(key in sub.en && key in sub.fa, 'Subscription: missing ' + key);
}
const context = {
  localStorage: {getItem: () => 'en', setItem() {}},
  document: {querySelectorAll: () => [], documentElement: {}, dispatchEvent() {}},
  Event: class {},
};
vm.runInNewContext(source + ';globalThis.i18n=I18N;', context);
assert.equal(context.document.documentElement.dir, 'ltr');
assert.equal(context.i18n.t('welcome_user', {name:'Example'}), 'Welcome, Example');
context.i18n.setLang('fa');
assert.equal(context.document.documentElement.dir, 'rtl');
assert.equal(context.i18n.t('welcome_user', {name:'Example'}), 'خوش آمدید، Example');
context.i18n.setLang('en');
assert.equal(context.i18n.locale, 'en-GB');
console.log(`Translation checks passed: ${Object.keys(messages).length} shared keys, ${Object.keys(sub.en).length} subscription keys.`);
