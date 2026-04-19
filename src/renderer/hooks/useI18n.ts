import { useState, useEffect, useCallback } from 'react';
import { getNestedValue } from '../../common/i18nUtils';

type TranslationRecord = Record<string, unknown>;

export type TFunction = (key: string, vars?: Record<string, string>) => string;

export function useI18n() {
  const [locale, setCurrentLocale] = useState('zh-CN');
  const [translations, setTranslations] = useState<TranslationRecord | null>(null);
  const [fallback, setFallback] = useState<TranslationRecord>({});

  const t = useCallback<TFunction>(
    (key, vars) => {
      const data =
        getNestedValue(translations ?? {}, key) ?? getNestedValue(fallback, key) ?? key;
      if (!vars) return data;
      return data.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
    },
    [translations, fallback]
  );

  const applyI18nData = (i18nData: WingmanI18nData) => {
    if (!i18nData) return;
    setCurrentLocale(i18nData.locale || 'zh-CN');
    setTranslations((i18nData.translations as TranslationRecord) || {});
    setFallback((i18nData.fallback as TranslationRecord) || {});
  };

  useEffect(() => {
    window.wingman.i18n.getData().then(applyI18nData);
  }, []);

  const setLocale = useCallback(async (newLocale: string) => {
    const i18nData = await window.wingman.i18n.setLocale(newLocale);
    applyI18nData(i18nData);
  }, []);

  return { locale, t, setLocale, ready: translations !== null };
}
