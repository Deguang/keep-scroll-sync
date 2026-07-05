#!/usr/bin/env node

/**
 * Build localized landing pages from template.html + i18n/*.json.
 * Usage: node docs/build-pages.js  (or: cd docs && node build-pages.js)
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = __dirname;
const I18N_DIR = path.join(DOCS_DIR, 'i18n');
const TEMPLATE_PATH = path.join(DOCS_DIR, 'template.html');

const LANGUAGES = ['en', 'zh', 'zh-TW', 'ja', 'ko', 'ru', 'hi'];

const OUTPUT_FILES = {
  'en': 'index.html',
  'zh': 'zh.html',
  'zh-TW': 'zh-TW.html',
  'ja': 'ja.html',
  'ko': 'ko.html',
  'ru': 'ru.html',
  'hi': 'hi.html'
};

// Deep get by dot path: getValue(obj, 'hero.title')
function getValue(obj, keyPath) {
  return keyPath.split('.').reduce((v, k) => (v == null ? v : v[k]), obj);
}

// {{key}} / {{key.nested}}
function processPlaceholders(template, data) {
  return template.replace(/\{\{([^#/}]+)\}\}/g, (match, key) => {
    const value = getValue(data, key.trim());
    if (value === undefined) {
      console.warn(`  Warning: missing key "${key.trim()}"`);
      return match;
    }
    return String(value);
  });
}

// {{#array}}...{{/array}}
function processArrays(template, data) {
  const arrayPattern = /\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  return template.replace(arrayPattern, (match, arrayPath, inner) => {
    const array = getValue(data, arrayPath.trim());
    if (!Array.isArray(array)) {
      console.warn(`  Warning: "${arrayPath}" is not an array`);
      return '';
    }
    return array.map(item =>
      inner.replace(/\{\{([^#/}]+)\}\}/g, (m, key) => {
        const value = item[key.trim()];
        return value !== undefined ? String(value) : m;
      })
    ).join('');
  });
}

function buildPage(lang) {
  const langData = JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${lang}.json`), 'utf8'));
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  html = processArrays(html, langData);
  html = processPlaceholders(html, langData);
  fs.writeFileSync(path.join(DOCS_DIR, OUTPUT_FILES[lang]), html, 'utf8');
  console.log(`  ✓ Built ${OUTPUT_FILES[lang]}`);
}

console.log('\n🔨 Building localized landing pages...\n');
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error('Template not found:', TEMPLATE_PATH);
  process.exit(1);
}
for (const lang of LANGUAGES) {
  if (!fs.existsSync(path.join(I18N_DIR, `${lang}.json`))) {
    console.warn(`  ⚠ Skipping ${lang}: i18n file not found`);
    continue;
  }
  try { buildPage(lang); }
  catch (e) { console.error(`  ❌ Error building ${lang}:`, e.message); }
}
console.log('\n✅ Build complete!\n');
