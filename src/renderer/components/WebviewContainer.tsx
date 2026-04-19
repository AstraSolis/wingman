import { useRef, useEffect, useState } from 'react';
import type { TFunction } from '../hooks/useI18n';

interface WebviewContainerProps {
  url: string;
  visible: boolean;
  onNavigate: (url: string, title?: string) => void;
  onTitleChange: (title: string) => void;
  t: TFunction;
}

export default function WebviewContainer({
  url,
  visible,
  onNavigate,
  onTitleChange,
  t
}: WebviewContainerProps) {
  const webviewRef = useRef<ElectronWebviewElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const onStart = () => {
      setLoading(true);
      setError(null);
    };
    const onStop = () => setLoading(false);
    const handleNavigate = (event: Event & { url: string }) => {
      onNavigate(event.url, wv.getTitle() || event.url);
    };
    const onNavigateInPage = (event: Event & { url: string; isMainFrame: boolean }) => {
      if (event.isMainFrame) handleNavigate(event);
    };
    const onFail = (e: Event & { errorCode: number; errorDescription: string }) => {
      if (e.errorCode === -3) return;
      setLoading(false);
      setError(`${e.errorDescription} (${e.errorCode})`);
    };
    const onTitle = (e: Event & { title: string }) => onTitleChange(e.title);

    wv.addEventListener('did-start-loading', onStart);
    wv.addEventListener('did-stop-loading', onStop);
    wv.addEventListener('did-navigate', handleNavigate as EventListener);
    wv.addEventListener('did-navigate-in-page', onNavigateInPage as EventListener);
    wv.addEventListener('did-fail-load', onFail as EventListener);
    wv.addEventListener('page-title-updated', onTitle as EventListener);

    return () => {
      wv.removeEventListener('did-start-loading', onStart);
      wv.removeEventListener('did-stop-loading', onStop);
      wv.removeEventListener('did-navigate', handleNavigate as EventListener);
      wv.removeEventListener('did-navigate-in-page', onNavigateInPage as EventListener);
      wv.removeEventListener('did-fail-load', onFail as EventListener);
      wv.removeEventListener('page-title-updated', onTitle as EventListener);
    };
  }, [onNavigate, onTitleChange]);

  useEffect(() => {
    const wv = webviewRef.current;
    if (wv && url && wv.src !== url) wv.src = url;
  }, [url]);

  return (
    <div className="webview-container" style={{ display: visible ? undefined : 'none' }}>
      <webview ref={webviewRef} style={{ width: '100%', height: '100%' }} allowpopups={true} />
      {loading && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
          <span>{t('webview.loading')}</span>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => {
                setError(null);
                webviewRef.current?.reload();
              }}
            >
              {t('webview.retry')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
