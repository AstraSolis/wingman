import { useEffect } from 'react';

export function useDocumentTitle(title, t, ready) {
  useEffect(() => {
    if (!ready) return;
    document.title = title ? `${t('app.name')} - ${title}` : t('app.name');
  }, [ready, title, t]);
}
