import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from './hooks/useI18n.js';
import { useWingman } from './hooks/useWingman.js';
import Toolbar from './components/Toolbar.jsx';
import HomeView from './components/HomeView.jsx';
import WebviewContainer from './components/WebviewContainer.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import ListModal from './components/ListModal.jsx';
import OSD from './components/OSD.jsx';

export default function App() {
  const { t, setLocale, ready } = useI18n();
  const { loadUrl } = useWingman();

  const [view, setView] = useState('home');
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [opacity, setOpacity] = useState(85);
  const [isClickThrough, setIsClickThrough] = useState(false);
  const [osdMessage, setOsdMessage] = useState(null); // { text, id }
  const [showSettings, setShowSettings] = useState(false);
  const [listModal, setListModal] = useState(null);

  const showOSD = useCallback((msg) => setOsdMessage({ text: msg, id: Date.now() }), []);

  const navigate = useCallback(
    (rawUrl) => {
      const url = loadUrl(rawUrl);
      if (!url) return;
      setCurrentUrl(url);
      setView('webview');
    },
    [loadUrl]
  );

  const openFavorites = useCallback(async () => {
    const data = await window.wingman.getUserData();
    setListModal({
      title: t('modal.favorites'),
      items: data.favorites,
      type: 'favorites',
      onSelect: (item) => {
        navigate(item.url);
        setListModal(null);
      },
      onDelete: async (item) => {
        await window.wingman.removeFavorite(item.url);
        const updated = await window.wingman.getUserData();
        setListModal((m) => ({ ...m, items: updated.favorites }));
      }
    });
  }, [t, navigate]);

  const openHistory = useCallback(async () => {
    const data = await window.wingman.getUserData();
    setListModal({
      title: t('modal.history'),
      items: data.history,
      type: 'history',
      onSelect: (item) => {
        navigate(item.url);
        setListModal(null);
      }
    });
  }, [t, navigate]);

  const initialized = useRef(false);

  // 初始化：同步透明度、穿透状态、启动页面（只跑一次）
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    (async () => {
      try {
        const [state, startupConfig] = await Promise.all([
          window.wingman.getInitialState(),
          window.wingman.getStartupConfig()
        ]);
        if (state) {
          setOpacity(Math.round(state.opacity * 100));
          setIsClickThrough(state.isClickThrough ?? false);
        }
        const page = startupConfig?.startupPage || 'lastPage';
        if (page === 'lastPage' && state?.lastUrl) {
          navigate(state.lastUrl);
        } else if (page === 'customUrl' && startupConfig?.customStartupUrl) {
          navigate(startupConfig.customStartupUrl);
        } else if (page === 'favorites') {
          openFavorites();
        }
      } catch {
        setView('home');
      }
    })();
  }, [navigate, openFavorites]);

  // 监听主进程推送的透明度、穿透、导航事件
  useEffect(() => {
    window.wingman.onOpacityUpdated((val) => {
      const pct = Math.round(val * 100);
      setOpacity(pct);
      showOSD(t('osd.opacity', { value: pct }));
    });
    window.wingman.onClickThroughUpdated((enabled) => {
      setIsClickThrough(enabled);
      showOSD(enabled ? t('osd.clickThroughOn') : t('osd.clickThroughOff'));
    });
    window.wingman.onNavigateUrl((url) => navigate(url));
  }, [t, navigate, showOSD]);

  const handleAddFav = useCallback(
    async (url, title) => {
      if (!url || url === 'about:blank') return;
      const data = await window.wingman.getUserData();
      const isFav = data.favorites.some((f) => f.url === url);
      if (isFav) {
        await window.wingman.removeFavorite(url);
        showOSD(t('home.favRemoved'));
      } else {
        await window.wingman.saveFavorite({ title, url });
        showOSD(t('home.favAdded'));
      }
    },
    [t, showOSD]
  );

  const handleUrlChange = useCallback((url) => setCurrentUrl(url), []);
  const handleTitleChange = useCallback(
    (title) => {
      setCurrentTitle(title);
      document.title = `${t('app.name')} - ${title}`;
    },
    [t]
  );

  const handleOpacityChange = useCallback((val) => {
    setOpacity(val);
    window.wingman.setOpacity(val / 100);
  }, []);

  const handleClickThrough = useCallback(() => window.wingman.toggleClickThrough(), []);
  const handleHome = useCallback(() => {
    setView('home');
    setCurrentUrl('');
    setCurrentTitle('');
  }, []);
  const handleSettings = useCallback(() => setShowSettings(true), []);
  const handleClose = useCallback(() => window.wingman.closeWindow(), []);

  // i18n 未就绪前不渲染，避免显示翻译键
  if (!ready) return null;

  return (
    <>
      <Toolbar
        opacity={opacity}
        isClickThrough={isClickThrough}
        currentWebviewUrl={currentUrl}
        currentTitle={currentTitle}
        onNavigate={navigate}
        onOpacityChange={handleOpacityChange}
        onClickThrough={handleClickThrough}
        onHome={handleHome}
        onSettings={handleSettings}
        onClose={handleClose}
        onAddFav={handleAddFav}
        t={t}
      />

      {view === 'home' && (
        <HomeView onNavigate={navigate} onFavorites={openFavorites} onHistory={openHistory} t={t} />
      )}

      <WebviewContainer
        url={currentUrl}
        visible={view === 'webview'}
        onUrlChange={handleUrlChange}
        onTitleChange={handleTitleChange}
        t={t}
      />

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onLocaleChange={setLocale}
          showOSD={showOSD}
          t={t}
        />
      )}

      {listModal && (
        <ListModal
          title={listModal.title}
          items={listModal.items}
          type={listModal.type}
          onSelect={listModal.onSelect}
          onDelete={listModal.onDelete}
          onClose={() => setListModal(null)}
          t={t}
        />
      )}

      <OSD message={osdMessage} />
    </>
  );
}
