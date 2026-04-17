import { useState, useEffect, useRef } from 'react';

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

export default function SettingsModal({ onClose, onLocaleChange, showOSD, t }) {
  const [locale, setLocale] = useState('zh-CN');
  const [autoStart, setAutoStart] = useState(false);
  const [startupPage, setStartupPage] = useState('lastPage');
  const [customUrl, setCustomUrl] = useState('');
  const [closeStrategy, setCloseStrategy] = useState('minimize');
  const [rememberBounds, setRememberBounds] = useState(true);
  const [search, setSearch] = useState('');
  const urlTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const [i18n, autoS, config] = await Promise.all([
        window.wingman.getI18nData(),
        window.wingman.getAutoStart(),
        window.wingman.getStartupConfig()
      ]);
      setLocale(i18n?.locale || 'zh-CN');
      setAutoStart(autoS);
      setStartupPage(config?.startupPage || 'lastPage');
      setCustomUrl(config?.customStartupUrl || '');
      setCloseStrategy(config?.closeStrategy || 'minimize');
      setRememberBounds(config?.rememberWindowBounds ?? true);
    })();
    return () => {
      if (urlTimer.current) clearTimeout(urlTimer.current);
    };
  }, []);

  const langOptions = [
    { value: 'zh-CN', label: t('settings.languageZhCN') },
    { value: 'en-US', label: t('settings.languageEnUS') }
  ];
  const startupOptions = [
    { value: 'home', label: t('settings.startupPageHome') },
    { value: 'lastPage', label: t('settings.startupPageLast') },
    { value: 'favorites', label: t('settings.startupPageFavorites') },
    { value: 'customUrl', label: t('settings.startupPageCustom') }
  ];
  const closeOptions = [
    { value: 'minimize', label: t('settings.closeStrategyMinimize') },
    { value: 'quit', label: t('settings.closeStrategyQuit') }
  ];

  const allItems = [
    { label: t('settings.language'), key: 'language' },
    { label: t('settings.autoStart'), key: 'autoStart' },
    { label: t('settings.startupPage'), key: 'startupPage' },
    { label: t('settings.closeStrategy'), key: 'closeStrategy' },
    { label: t('settings.rememberWindowBounds'), key: 'rememberBounds' },
    { label: t('settings.clearHistory'), key: 'clearHistory' }
  ];

  const kw = search.toLowerCase();
  const visible = (key) =>
    !kw ||
    allItems
      .find((i) => i.key === key)
      ?.label.toLowerCase()
      .includes(kw);

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
            {visible('language') && (
              <div className="setting-item-light">
                <label>{t('settings.language')}</label>
                <Dropdown
                  value={locale}
                  options={langOptions}
                  onChange={async (val) => {
                    setLocale(val);
                    await onLocaleChange(val);
                  }}
                />
              </div>
            )}
            {visible('autoStart') && (
              <div className="setting-item-light">
                <label>{t('settings.autoStart')}</label>
                <label className="switch-light">
                  <input
                    type="checkbox"
                    checked={autoStart}
                    onChange={async (e) => {
                      setAutoStart(e.target.checked);
                      await window.wingman.setAutoStart(e.target.checked);
                    }}
                  />
                  <span className="slider-light round" />
                </label>
              </div>
            )}
            {visible('startupPage') && (
              <div className="setting-item-light">
                <label>{t('settings.startupPage')}</label>
                <Dropdown
                  value={startupPage}
                  options={startupOptions}
                  onChange={async (val) => {
                    setStartupPage(val);
                    await window.wingman.setStartupPage(val);
                  }}
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
                    onChange={(e) => {
                      setCustomUrl(e.target.value);
                      if (urlTimer.current) clearTimeout(urlTimer.current);
                      urlTimer.current = setTimeout(
                        () => window.wingman.setCustomStartupUrl(e.target.value),
                        500
                      );
                    }}
                  />
                </div>
              </div>
            )}
            {visible('closeStrategy') && (
              <div className="setting-item-light">
                <label>{t('settings.closeStrategy')}</label>
                <Dropdown
                  value={closeStrategy}
                  options={closeOptions}
                  onChange={async (val) => {
                    setCloseStrategy(val);
                    await window.wingman.setCloseStrategy(val);
                  }}
                />
              </div>
            )}
            {visible('rememberBounds') && (
              <div className="setting-item-light border-none">
                <label>{t('settings.rememberWindowBounds')}</label>
                <label className="switch-light">
                  <input
                    type="checkbox"
                    checked={rememberBounds}
                    onChange={async (e) => {
                      setRememberBounds(e.target.checked);
                      await window.wingman.setRememberWindowBounds(e.target.checked);
                    }}
                  />
                  <span className="slider-light round" />
                </label>
              </div>
            )}
          </div>
          <div className="settings-group-title">{t('settings.dataGroup')}</div>
          <div className="settings-group">
            {visible('clearHistory') && (
              <div className="setting-item-light border-none">
                <label>{t('settings.clearHistory')}</label>
                <button
                  className="settings-btn-light danger"
                  onClick={async () => {
                    await window.wingman.clearHistory();
                    showOSD(t('settings.historyCleared'));
                  }}
                >
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
