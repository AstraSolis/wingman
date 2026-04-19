import { useEffect } from 'react';
import type { TFunction } from './useI18n';

export function useDocumentTitle(title: string, t: TFunction, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    document.title = title ? `${t('app.name')} - ${title}` : t('app.name');
  }, [ready, title, t]);
}
