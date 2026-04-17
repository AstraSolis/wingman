// 国际化模块 (主进程)
// 加载语言包，提供翻译函数，支持动态切换语言

const path = require('path');
const fs = require('fs');
const { DEFAULT_LOCALE, SUPPORTED_LOCALES } = require('../common/constants');
const { createTranslator } = require('../common/i18nUtils');
const configManager = require('./configManager');

const localesDir = path.join(__dirname, '..', 'locales');

let currentLocale = DEFAULT_LOCALE;
let translations = {};
let fallbackTranslations = {};

// 通过工厂创建 t() 函数，引用模块级变量
const t = createTranslator(
  () => translations,
  () => fallbackTranslations
);

/**
 * 加载指定语言的翻译数据
 * @param {string} locale - 语言代码 (如 'zh-CN')
 * @returns {object} 翻译数据
 */
function loadLocaleFile(locale) {
  const filePath = path.join(localesDir, `${locale}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`[i18n] Failed to load locale: ${locale}`, err.message);
    return {};
  }
}

/**
 * 初始化 i18n 模块
 * @param {string} [locale] - 初始语言代码，默认使用 DEFAULT_LOCALE
 */
function init(locale) {
  currentLocale = locale || DEFAULT_LOCALE;

  // 加载回退语言（中文）
  fallbackTranslations = loadLocaleFile('zh-CN');

  // 加载当前语言
  if (currentLocale === 'zh-CN') {
    translations = fallbackTranslations;
  } else {
    translations = loadLocaleFile(currentLocale);
  }
}

/**
 * 切换语言
 * @param {string} locale - 语言代码
 */
function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.error(`[i18n] Unsupported locale: ${locale}`);
    return;
  }
  currentLocale = locale;

  // 持久化保存
  configManager.set('locale', currentLocale);

  if (locale === 'zh-CN') {
    translations = fallbackTranslations;
  } else {
    translations = loadLocaleFile(locale);
  }
}

/**
 * 获取当前语言代码
 */
function getLocale() {
  return currentLocale;
}

/**
 * 获取当前语言的全部翻译数据（供渲染进程使用）
 */
function getAllTranslations() {
  return {
    locale: currentLocale,
    translations: translations,
    fallback: fallbackTranslations
  };
}

module.exports = {
  init,
  t,
  setLocale,
  getLocale,
  getAllTranslations
};
