// i18n 工具函数（主进程与渲染进程共用）

type TranslationRecord = Record<string, unknown>;

export function getNestedValue(obj: TranslationRecord, key: string): string | undefined {
  const result = key.split('.').reduce<unknown>((current, part) => {
    if (current != null && typeof current === 'object') {
      return (current as TranslationRecord)[part];
    }
    return undefined;
  }, obj);
  return typeof result === 'string' ? result : undefined;
}

export type Translator = (key: string, params?: Record<string, string>) => string;

export function createTranslator(
  getTranslations: () => TranslationRecord,
  getFallback: () => TranslationRecord
): Translator {
  return function t(key: string, params?: Record<string, string>): string {
    let text = getNestedValue(getTranslations(), key);

    if (text === undefined) {
      text = getNestedValue(getFallback(), key);
    }

    if (text === undefined) {
      return key;
    }

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), paramValue);
      }
    }

    return text;
  };
}
