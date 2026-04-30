import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactElement } from 'react';
import { useSettingsPanel } from '../hooks/useSettings';
import { useShortcuts, useLocalShortcutsConfig } from '../hooks/useShortcuts';
import { buildAccelerator } from '../utils/shortcut';
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
  ),
  shortcuts: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M18 12h.01M10 12h4M6 16h12" />
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

interface ShortcutRecorderProps {
  value: string;
  onSave: (accelerator: string) => void;
  onReset: () => void;
  t: TFunction;
}

function ShortcutRecorder({ value, onSave, onReset, t }: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);

  const stopRecording = useCallback(() => setRecording(false), []);

  useEffect(() => {
    if (!recording) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        stopRecording();
        return;
      }

      const acc = buildAccelerator(e);
      if (acc) {
        onSave(acc);
        stopRecording();
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [recording, onSave, stopRecording]);

  return (
    <div className="shortcut-recorder">
      <span className={`shortcut-tag${recording ? ' recording' : ''}`}>
        {recording ? t('settings.shortcutRecording') : value}
      </span>
      <button
        className={`shortcut-btn${recording ? ' cancel' : ''}`}
        onClick={() => setRecording((r) => !r)}
      >
        {recording ? t('settings.shortcutCancel') : t('settings.shortcutRecord')}
      </button>
      {!recording && (
        <button className="shortcut-btn reset" onClick={onReset}>
          {t('settings.shortcutReset')}
        </button>
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

  const { shortcuts, handleSetShortcut, handleResetShortcut } = useShortcuts();
  const { localShortcuts, handleSetLocalShortcut, handleResetLocalShortcut } = useLocalShortcutsConfig();

  const sections = [
    { key: 'general', label: t('settings.generalGroup') },
    { key: 'shortcuts', label: t('settings.shortcutsGroup') },
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

            {activeSection === 'shortcuts' && (
              <div className="settings-section">
                <div className="shortcuts-section-header">
                  <span className="shortcuts-section-header-badge global">{t('settings.shortcutsBadgeGlobal')}</span>
                  <span className="shortcuts-section-header-label">{t('settings.shortcutsGlobalTitle')}</span>
                  <span className="shortcuts-section-header-line" />
                </div>
                <p className="shortcuts-desc">{t('settings.shortcutsGlobalDesc')}</p>
                {shortcuts && [
                  {
                    groupKey: 'window',
                    label: t('settings.shortcutGroupWindow'),
                    items: [
                      { action: 'TOGGLE_WINDOW', label: t('settings.shortcutToggleWindow') },
                      { action: 'TOGGLE_CLICK_THROUGH', label: t('settings.shortcutToggleThrough') }
                    ]
                  },
                  {
                    groupKey: 'opacity',
                    label: t('settings.shortcutGroupOpacity'),
                    items: [
                      { action: 'INCREASE_OPACITY', label: t('settings.shortcutIncreaseOpacity') },
                      { action: 'DECREASE_OPACITY', label: t('settings.shortcutDecreaseOpacity') }
                    ]
                  }
                ].map(({ groupKey, label, items }) => (
                  <div key={groupKey} className="shortcuts-group-block">
                    <div className="shortcuts-group-title">{label}</div>
                    <div className="settings-group">
                      {items.map(({ action, label: itemLabel }, idx) => (
                        <div
                          key={action}
                          className={`setting-item-light${idx === items.length - 1 ? ' border-none' : ''}`}
                        >
                          <span className="setting-item-label">{itemLabel}</span>
                          <ShortcutRecorder
                            value={shortcuts[action as keyof typeof shortcuts]}
                            onSave={(acc) => handleSetShortcut(action, acc)}
                            onReset={() => handleResetShortcut(action)}
                            t={t}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="shortcuts-section-header shortcuts-section-header-second">
                  <span className="shortcuts-section-header-badge local">{t('settings.shortcutsBadgeLocal')}</span>
                  <span className="shortcuts-section-header-label">{t('settings.shortcutsLocalTitle')}</span>
                  <span className="shortcuts-section-header-line" />
                </div>
                <p className="shortcuts-desc shortcuts-local-desc">{t('settings.shortcutsLocalDesc')}</p>
                {localShortcuts && [
                  {
                    groupKey: 'navigation',
                    label: t('settings.shortcutGroupNavigation'),
                    items: [
                      { action: 'RELOAD_PAGE', label: t('settings.shortcutReloadPage') },
                      { action: 'GO_HOME', label: t('settings.shortcutGoHome') },
                      { action: 'FOCUS_ADDRESS_BAR', label: t('settings.shortcutFocusAddressBar') },
                      { action: 'COPY_URL', label: t('settings.shortcutCopyUrl') },
                      { action: 'TOGGLE_FAVORITE', label: t('settings.shortcutToggleFavorite') }
                    ]
                  },
                  {
                    groupKey: 'tabs',
                    label: t('settings.shortcutGroupTabs'),
                    items: [
                      { action: 'NEW_TAB', label: t('settings.shortcutNewTab') },
                      { action: 'CLOSE_TAB', label: t('settings.shortcutCloseTab') },
                      { action: 'NEXT_TAB', label: t('settings.shortcutNextTab') },
                      { action: 'PREV_TAB', label: t('settings.shortcutPrevTab') }
                    ]
                  },
                  {
                    groupKey: 'panels',
                    label: t('settings.shortcutGroupPanels'),
                    items: [
                      { action: 'OPEN_FAVORITES', label: t('settings.shortcutOpenFavorites') },
                      { action: 'OPEN_HISTORY', label: t('settings.shortcutOpenHistory') },
                      { action: 'OPEN_SETTINGS', label: t('settings.shortcutOpenSettings') }
                    ]
                  }
                ].map(({ groupKey, label, items }) => (
                  <div key={groupKey} className="shortcuts-group-block">
                    <div className="shortcuts-group-title">{label}</div>
                    <div className="settings-group">
                      {items.map(({ action, label: itemLabel }, idx) => (
                        <div
                          key={action}
                          className={`setting-item-light${idx === items.length - 1 ? ' border-none' : ''}`}
                        >
                          <span className="setting-item-label">{itemLabel}</span>
                          <ShortcutRecorder
                            value={localShortcuts[action as keyof typeof localShortcuts]}
                            onSave={(acc) => handleSetLocalShortcut(action, acc)}
                            onReset={() => handleResetLocalShortcut(action)}
                            t={t}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
