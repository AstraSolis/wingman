import { useState, useEffect, useRef } from 'react';
import { useSettingsPanel } from '../hooks/useSettings.js';

const chevron = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#666"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const closeIcon = (
  <svg
    width="18"
    height="18"
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
);

function Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const current = options.find((o) => o.value === value);
  return (
    <div className="custom-dropdown" ref={ref}>
      <div
        className="dropdown-selected"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span>{current?.label}</span>
        {chevron}
      </div>
      {open && (
        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
          {options.map((o) => (
            <div
              key={o.value}
              className="dropdown-item"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsModal({ onClose, locale, onLocaleChange, showOSD, t }) {
  const {
    autoStart,
    startupPage,
    customUrl,
    closeStrategy,
    rememberBounds,
    langOptions,
    startupOptions,
    closeOptions,
    search,
    setSearch,
    isVisible,
    handleLocaleChange,
    handleAutoStartChange,
    handleStartupPageChange,
    handleCustomUrlChange,
    handleCloseStrategyChange,
    handleRememberBoundsChange,
    handleClearHistory
  } = useSettingsPanel(locale, onLocaleChange, showOSD, t);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content settings-modal-light">
        <div className="settings-header">
          <h2>{t('toolbar.settingsTitle')}</h2>
          <button className="close-btn-light" onClick={onClose}>
            {closeIcon}
          </button>
        </div>
        <div className="settings-search">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('settings.searchPlaceholder')}
          />
        </div>
        <div className="modal-body settings-body-light">
          <div className="settings-group-title">{t('settings.generalGroup')}</div>
          <div className="settings-group">
            {isVisible('language') && (
              <div className="setting-item-light">
                <label>{t('settings.language')}</label>
                <Dropdown value={locale} options={langOptions} onChange={handleLocaleChange} />
              </div>
            )}
            {isVisible('autoStart') && (
              <div className="setting-item-light">
                <label>{t('settings.autoStart')}</label>
                <label className="switch-light">
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={(e) => handleAutoStartChange(e.target.checked)}
                  />
                  <span className="slider-light round" />
                </label>
              </div>
            )}
            {isVisible('startupPage') && (
              <div className="setting-item-light">
                <label>{t('settings.startupPage')}</label>
                <Dropdown
                  value={startupPage}
                  options={startupOptions}
                  onChange={handleStartupPageChange}
                />
              </div>
            )}
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
            {isVisible('closeStrategy') && (
              <div className="setting-item-light">
                <label>{t('settings.closeStrategy')}</label>
                <Dropdown
                  value={closeStrategy}
                  options={closeOptions}
                  onChange={handleCloseStrategyChange}
                />
              </div>
            )}
            {isVisible('rememberBounds') && (
              <div className="setting-item-light border-none">
                <label>{t('settings.rememberWindowBounds')}</label>
                <label className="switch-light">
                  <input
                    type="checkbox"
                    checked={rememberBounds}
                    onChange={(e) => handleRememberBoundsChange(e.target.checked)}
                  />
                  <span className="slider-light round" />
                </label>
              </div>
            )}
          </div>
          <div className="settings-group-title">{t('settings.dataGroup')}</div>
          <div className="settings-group">
            {isVisible('clearHistory') && (
              <div className="setting-item-light border-none">
                <label>{t('settings.clearHistory')}</label>
                <button className="settings-btn-light danger" onClick={handleClearHistory}>
                  {t('settings.clearBtn')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
