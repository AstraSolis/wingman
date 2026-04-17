import { useState, useEffect } from 'react';

const SVG = {
  home: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  star: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  go: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="5 12 12 5 19 12" />
      <line x1="12" y1="19" x2="12" y2="5" />
    </svg>
  ),
  cursor: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  settings: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  close: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  opacity: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
};

export default function Toolbar({
  opacity,
  isClickThrough,
  currentWebviewUrl,
  currentTitle,
  onNavigate,
  onOpacityChange,
  onClickThrough,
  onHome,
  onSettings,
  onClose,
  onAddFav,
  t
}) {
  // null = 未编辑，webview 导航后重置为 null 以同步地址栏
  const [inputVal, setInputVal] = useState(null);

  useEffect(() => {
    setInputVal(null);
  }, [currentWebviewUrl]);

  const displayUrl = inputVal ?? currentWebviewUrl ?? '';

  const handleNavigate = () => {
    if (displayUrl) {
      onNavigate(displayUrl);
      setInputVal(null);
    }
  };

  return (
    <div className="toolbar">
      <div className="url-bar">
        <button className="icon-btn" title={t('toolbar.homeTitle')} onClick={onHome}>
          {SVG.home}
        </button>
        <input
          type="text"
          value={displayUrl}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate()}
          placeholder={t('toolbar.urlPlaceholder')}
          spellCheck={false}
        />
        <button
          title={t('toolbar.addFavTitle')}
          onClick={() => onAddFav(currentWebviewUrl, currentTitle)}
        >
          {SVG.star}
        </button>
        <button title={t('toolbar.loadBtn')} onClick={handleNavigate}>
          {SVG.go}
        </button>
      </div>
      <div className="controls">
        <div className="opacity-control" title={t('toolbar.opacityTitle')}>
          {SVG.opacity}
          <input
            type="range"
            min="30"
            max="100"
            step="5"
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
          />
          <span className="opacity-value">{opacity}%</span>
        </div>
        <button
          className={`icon-btn${isClickThrough ? ' active' : ''}`}
          title={t('toolbar.clickThroughTitle')}
          onClick={onClickThrough}
        >
          {SVG.cursor}
        </button>
        <button className="icon-btn" title={t('toolbar.settingsTitle')} onClick={onSettings}>
          {SVG.settings}
        </button>
        <button className="icon-btn" title={t('toolbar.closeTitle')} onClick={onClose}>
          {SVG.close}
        </button>
      </div>
    </div>
  );
}
