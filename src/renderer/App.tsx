import { useI18n } from './hooks/useI18n';
import { useWingman } from './hooks/useWingman';
import { useOSD } from './hooks/useOSD';
import { useTabsPool } from './hooks/useTabsPool';
import { useWindowState } from './hooks/useWindowState';
import { useModals } from './hooks/useModals';
import { useStartupPage } from './hooks/useStartupPage';
import { useUserData, useNavigationEvents } from './hooks/useUserData';
import { BootStateProvider, useBootState } from './hooks/useBootState';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useLocalShortcutsConfig } from './hooks/useShortcuts';
import { useWindowLocalShortcuts } from './hooks/useWindowLocalShortcuts';
import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_SEARCH_ENGINE, DEFAULT_CUSTOM_SEARCH_URL } from '../common/constants';
import Toolbar from './components/Toolbar';
import HomeView from './components/HomeView';
import WebviewPoolContainer from './components/WebviewPoolContainer';
import SettingsModal from './components/SettingsModal';
import ListModal from './components/ListModal';
import OSD from './components/OSD';

function AppContent() {
  const { locale, t, setLocale, ready } = useI18n();
  const bootState = useBootState();
  const [searchEngine, setSearchEngine] = useState<string>(DEFAULT_SEARCH_ENGINE);
  const [customSearchUrl, setCustomSearchUrl] = useState(DEFAULT_CUSTOM_SEARCH_URL);

  useEffect(() => {
    if (bootState?.startupConfig) {
      setSearchEngine(bootState.startupConfig.searchEngine || DEFAULT_SEARCH_ENGINE);
      setCustomSearchUrl(bootState.startupConfig.customSearchUrl || DEFAULT_CUSTOM_SEARCH_URL);
    }
  }, [bootState]);

  const handleSearchEngineChange = useCallback((engine: string, customUrl: string) => {
    setSearchEngine(engine);
    setCustomSearchUrl(customUrl);
  }, []);

  const { loadUrl } = useWingman(searchEngine, customSearchUrl);
  const { osdMessage, showOSD } = useOSD();

  const {
    tabs,
    activeTabId,
    warmIds,
    view,
    navigate,
    openInBackground,
    closeTab,
    switchTab,
    goHome,
    reloadActiveTab,
    handleTabNavigate,
    handleTabTitleChange,
    currentUrl,
    currentTitle
  } = useTabsPool(loadUrl);

  const { opacity, isClickThrough, handleOpacityChange, handleClickThrough, handleClose } =
    useWindowState(showOSD, t);

  const { showSettings, listModal, openSettings, closeSettings, openListModal, closeListModal } =
    useModals();

  const { openFavorites, openHistory, handleAddFav } = useUserData(showOSD, navigate, t);

  const { localShortcuts } = useLocalShortcutsConfig();

  const [focusAddressBarTrigger, setFocusAddressBarTrigger] = useState(0);
  const [mediaTrigger, setMediaTrigger] = useState<{ action: string; seq: number } | null>(null);

  const handleMediaAction = useCallback((action: string) => {
    setMediaTrigger({ action, seq: Date.now() });
  }, []);

  const handleCopyUrl = useCallback(() => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl).then(() => showOSD(t('contextMenu.copied')));
  }, [currentUrl, showOSD, t]);

  const handleFocusAddressBar = useCallback(() => setFocusAddressBarTrigger(n => n + 1), []);

  const handleOpenFavoritesShortcut = useCallback(() => {
    openListModal(openFavorites);
  }, [openListModal, openFavorites]);

  const handleOpenHistoryShortcut = useCallback(() => {
    openListModal(openHistory);
  }, [openListModal, openHistory]);

  useWindowLocalShortcuts({
    localShortcuts,
    tabs,
    activeTabId,
    onReload: reloadActiveTab,
    onGoHome: goHome,
    onNewTab: goHome,
    onCloseTab: closeTab,
    onSwitchTab: switchTab,
    onToggleFav: handleAddFav,
    onFocusAddressBar: handleFocusAddressBar,
    onCopyUrl: handleCopyUrl,
    onOpenFavorites: handleOpenFavoritesShortcut,
    onOpenHistory: handleOpenHistoryShortcut,
    onOpenSettings: openSettings,
    onMediaAction: handleMediaAction,
    currentUrl,
    currentTitle,
  });

  useStartupPage(navigate, () => openListModal(openFavorites));
  useNavigationEvents(navigate);
  useDocumentTitle(currentTitle, t, ready);

  if (!ready) return null;

  return (
    <>
      <Toolbar
        opacity={opacity}
        isClickThrough={isClickThrough}
        currentWebviewUrl={currentUrl}
        currentTitle={currentTitle}
        tabs={tabs}
        activeTabId={activeTabId}
        onNavigate={navigate}
        onReload={reloadActiveTab}
        onOpacityChange={handleOpacityChange}
        onClickThrough={handleClickThrough}
        onHome={goHome}
        onSettings={openSettings}
        onClose={handleClose}
        onAddFav={handleAddFav}
        onSwitchTab={switchTab}
        onCloseTab={closeTab}
        onNewTab={goHome}
        focusAddressBarTrigger={focusAddressBarTrigger}
        t={t}
      />

      <div className="content-area">
        {view === 'home' && (
          <HomeView
            onNavigate={navigate}
            onFavorites={handleOpenFavoritesShortcut}
            onHistory={handleOpenHistoryShortcut}
            onSettings={openSettings}
            showOSD={showOSD}
            t={t}
          />
        )}

        <WebviewPoolContainer
          tabs={tabs}
          activeTabId={activeTabId}
          warmIds={warmIds}
          visible={view === 'webview'}
          mediaTrigger={mediaTrigger}
          onNavigate={handleTabNavigate}
          onTitleChange={handleTabTitleChange}
          onOpenInBackground={openInBackground}
          onAddFav={handleAddFav}
          showOSD={showOSD}
          t={t}
        />

        {showSettings && (
          <SettingsModal
            onClose={closeSettings}
            locale={locale}
            onLocaleChange={setLocale}
            onSearchEngineChange={handleSearchEngineChange}
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
            onClose={closeListModal}
            t={t}
          />
        )}

        <OSD message={osdMessage} />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BootStateProvider>
      <AppContent />
    </BootStateProvider>
  );
}
