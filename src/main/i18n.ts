// 国际化模块（主进程）

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../common/constants';
import { createTranslator, type Translator } from '../common/i18nUtils';
import * as configManager from './configManager';
import zhCN from '../locales/zh-CN.json';
import enUS from '../locales/en-US.json';
import { createLogger } from './logger';

const logger = createLogger('i18n');

type TranslationRecord = Record<string, unknown>;

const localeMap: Record<string, TranslationRecord> = {
  'zh-CN': zhCN as TranslationRecord,
  'en-US': enUS as TranslationRecord
};

let currentLocale = DEFAULT_LOCALE;
let translations: TranslationRecord = {};
let fallbackTranslations: TranslationRecord = {};

export const t: Translator = createTranslator(
  () => translations,
  () => fallbackTranslations
);

export function init(locale?: string): void {
  currentLocale = locale || DEFAULT_LOCALE;
  fallbackTranslations = localeMap['zh-CN'];

  if (currentLocale === 'zh-CN') {
    translations = fallbackTranslations;
  } else {
    translations = localeMap[currentLocale] ?? {};
  }
}

export function setLocale(locale: string): void {
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    logger.error(`Unsupported locale: ${locale}`);
    return;
  }
  currentLocale = locale;
  configManager.set('locale', currentLocale);

  if (locale === 'zh-CN') {
    translations = fallbackTranslations;
  } else {
    translations = localeMap[locale] ?? {};
  }
}

export function getLocale(): string {
  return currentLocale;
}

export interface I18nData {
  locale: string;
  translations: TranslationRecord;
  fallback: TranslationRecord;
}

export function getAllTranslations(): I18nData {
  return {
    locale: currentLocale,
    translations,
    fallback: fallbackTranslations
  };
}
