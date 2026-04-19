import { useState, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { useSettingsPanel } from '../hooks/useSettings';
import type { TFunction } from '../hooks/useI18n';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}

const chevron = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const closeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// 侧边栏分类图标
const NavIcons: Record<string, ReactElement> = {
  general: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  data: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
};

function Dropdown({ value, options, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const current = options.find((o) => o.value === value);
  return (
    <div className="custom-dropdown" ref={ref}>
      <div className="dropdown-selected" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}>
        <span>{current?.label}</span>
        {chevron}
      </div>
      {open && (
        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
          {options.map((o) => (
            <div key={o.value} className="dropdown-item" onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SettingsModalProps {
  onClose: () => void;
  locale: string;
  onLocaleChange: (locale: string) => Promise<void>;
  showOSD: (msg: string) => void;
  t: TFunction;
}

export default function SettingsModal({ onClose, locale, onLocaleChange, showOSD, t }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState('general');

  const {
    autoStart,
    startupPage,
    customUrl,
    closeStrategy,
    rememberBounds,
    langOptions,
    startupOptions,
    closeOptions,
    handleLocaleChange,
    handleAutoStartChange,
    handleStartupPageChange,
    handleCustomUrlChange,
    handleCloseStrategyChange,
    handleRememberBoundsChange,
    handleClearHistory
  } = useSettingsPanel(locale, onLocaleChange, showOSD, t);

  const sections = [
    { key: 'general', label: t('settings.generalGroup') },
    { key: 'data', label: t('settings.dataGroup') }
  ];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content settings-modal-light">
        <div className="settings-header">
          <h2>{t('toolbar.settingsTitle')}</h2>
          <button className="close-btn-light" onClick={onClose}>{closeIcon}</button>
        </div>
        <div className="settings-layout">
          {/* 左侧分类导航 */}
          <nav className="settings-sidebar">
            {sections.map((s) => (
              <button
                key={s.key}
                className={`settings-nav-item${activeSection === s.key ? ' active' : ''}`}
                onClick={() => setActiveSection(s.key)}
              >
                <span className="settings-nav-icon">{NavIcons[s.key]}</span>
                <span className="settings-nav-label">{s.label}</span>
              </button>
            ))}
          </nav>

          {/* 右侧内容区 */}
          <div className="settings-body-light">
            {activeSection === 'general' && (
              <div className="settings-section">
                <div className="settings-group">
                  <div className="setting-item-light">
                    <div className="setting-item-info">
                      <span className="setting-item-label">{t('settings.language')}</span>
                    </div>
                    <Dropdown value={locale} options={langOptions} onChange={handleLocaleChange} />
                  </div>
                  <div className="setting-item-light">
                    <div className="setting-item-info">
                      <span className="setting-item-label">{t('settings.autoStart')}</span>
                    </div>
                    <label className="switch-light">
                      <input type="checkbox" checked={autoStart} onChange={(e) => handleAutoStartChange(e.target.checked)} />
                      <span className="slider-light round" />
                    </label>
                  </div>
                  <div className="setting-item-light">
                    <div className="setting-item-info">
                      <span className="setting-item-label">{t('settings.startupPage')}</span>
                    </div>
                    <Dropdown value={startupPage} options={startupOptions} onChange={handleStartupPageChange} />
                  </div>
                  {startupPage === 'customUrl' && (
                    <div className="setting-item-light custom-url-item">
                      <div className="custom-url-wrapper">
                        <label>{t('settings.customStartupUrl')}</label>
                        <input
                          type="text"
                          className="custom-url-input"
                          value={customUrl}
                          placeholder={t('settings.customUrlPlaceholder')}
                          onChange={(e) => handleCustomUrlChange(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  <div className="setting-item-light">
                    <div className="setting-item-info">
                      <span className="setting-item-label">{t('settings.closeStrategy')}</span>
                    </div>
                    <Dropdown value={closeStrategy} options={closeOptions} onChange={handleCloseStrategyChange} />
                  </div>
                  <div className="setting-item-light border-none">
                    <div className="setting-item-info">
                      <span className="setting-item-label">{t('settings.rememberWindowBounds')}</span>
                    </div>
                    <label className="switch-light">
                      <input type="checkbox" checked={rememberBounds} onChange={(e) => handleRememberBoundsChange(e.target.checked)} />
                      <span className="slider-light round" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="settings-section">
                <div className="settings-group">
                  <div className="setting-item-light border-none">
                    <div className="setting-item-info">
                      <span className="setting-item-label">{t('settings.clearHistory')}</span>
                      <span className="setting-item-desc">{t('settings.clearHistoryDesc')}</span>
                    </div>
                    <button className="settings-btn-light danger" onClick={handleClearHistory}>
                      {t('settings.clearBtn')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
