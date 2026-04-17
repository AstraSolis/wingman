import { useState, useEffect, useCallback } from 'react';

// 从嵌套对象中按点号路径取值，如 "toolbar.settingsTitle"
function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => o?.[k], obj);
}

export function useI18n() {
  const [translations, setTranslations] = useState(null);
  const [fallback, setFallback] = useState({});

  const t = useCallback(
    (key, vars) => {
      const data = getNestedValue(translations ?? {}, key) ?? getNestedValue(fallback, key) ?? key;
      if (!vars) return data;
      return data.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
    },
    [translations, fallback]
  );

  const applyI18nData = (i18nData) => {
    if (!i18nData) return;
    setTranslations(i18nData.translations || {});
    setFallback(i18nData.fallback || {});
  };

  useEffect(() => {
    window.wingman.getI18nData().then(applyI18nData);
  }, []);

  const setLocale = useCallback(async (locale) => {
    const i18nData = await window.wingman.setLocale(locale);
    applyI18nData(i18nData);
  }, []);

  return { t, setLocale, ready: translations !== null };
}
