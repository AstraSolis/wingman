import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import type { TFunction } from '../hooks/useI18n';
import type { Tab } from '../hooks/useTabsPool';

interface ToolbarProps {
  opacity: number;
  isClickThrough: boolean;
  currentWebviewUrl: string;
  currentTitle: string;
  tabs: Tab[];
  activeTabId: string | null;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onOpacityChange: (val: number) => void;
  onClickThrough: () => void;
  onHome: () => void;
  onSettings: () => void;
  onClose: () => void;
  onAddFav: (url: string, title: string) => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  focusAddressBarTrigger: number;
  t: TFunction;
}

const SVG: Record<string, ReactElement> = {
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
  reload: (
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
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
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
  tabs: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  tabClose: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
  tabs,
  activeTabId,
  onNavigate,
  onReload,
  onOpacityChange,
  onClickThrough,
  onHome,
  onSettings,
  onClose,
  onAddFav,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  focusAddressBarTrigger,
  t
}: ToolbarProps) {
  const [inputVal, setInputVal] = useState<string | null>(null);
  const [tabsOpen, setTabsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputVal(null);
  }, [currentWebviewUrl]);

  useEffect(() => {
    if (focusAddressBarTrigger > 0) {
      inputRef.current?.select();
      inputRef.current?.focus();
    }
  }, [focusAddressBarTrigger]);

  useEffect(() => {
    if (!tabsOpen) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setTabsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tabsOpen]);

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
          ref={inputRef}
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
        <button title={t('toolbar.reloadBtn')} onClick={onReload}>
          {SVG.reload}
        </button>
        <div className="tabs-dropdown-wrapper" ref={dropdownRef}>
          <button
            className={`icon-btn tabs-btn${tabsOpen ? ' active' : ''}`}
            title={t('toolbar.tabsTitle')}
            onClick={() => setTabsOpen(v => !v)}
          >
            {SVG.tabs}
            {tabs.length > 0 && (
              <span className="tab-count-badge">{tabs.length}</span>
            )}
          </button>
          {tabsOpen && (
            <div className="tabs-dropdown-panel">
              <div className="tabs-list">
                {tabs.length === 0 ? (
                  <div className="tabs-empty">{t('toolbar.noTabs')}</div>
                ) : (
                  tabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`tab-item${tab.id === activeTabId ? ' active' : ''}`}
                      onClick={() => { onSwitchTab(tab.id); setTabsOpen(false); }}
                    >
                      <span className="tab-title">
                        {tab.title && tab.title !== tab.url ? tab.title : (tab.currentUrl || tab.url || t('toolbar.newTab'))}
                      </span>
                      <button
                        className="tab-close-btn"
                        title="关闭"
                        onClick={e => { e.stopPropagation(); onCloseTab(tab.id); }}
                      >
                        {SVG.tabClose}
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="tabs-footer">
                <button
                  className="tabs-new-btn"
                  onClick={() => { onNewTab(); setTabsOpen(false); }}
                >
                  {`+ ${t('toolbar.newTab')}`}
                </button>
              </div>
            </div>
          )}
        </div>
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
