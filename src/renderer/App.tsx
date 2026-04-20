import { useState } from 'react';
import { useI18n } from './hooks/useI18n';
import { useWingman } from './hooks/useWingman';
import { useOSD } from './hooks/useOSD';
import { useNavigation } from './hooks/useNavigation';
import { useWindowState } from './hooks/useWindowState';
import { useModals } from './hooks/useModals';
import { useStartupPage } from './hooks/useStartupPage';
import { useUserData, useNavigationEvents } from './hooks/useUserData';
import { BootStateProvider } from './hooks/useBootState';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import Toolbar from './components/Toolbar';
import HomeView from './components/HomeView';
import WebviewContainer from './components/WebviewContainer';
import SettingsModal from './components/SettingsModal';
import ListModal from './components/ListModal';
import OSD from './components/OSD';

function AppContent() {
  const { locale, t, setLocale, ready } = useI18n();
  const { loadUrl } = useWingman();
  const { osdMessage, showOSD } = useOSD();

  const { view, targetUrl, currentUrl, currentTitle, navigate, goHome, handleNavigate, handleTitleChange } =
    useNavigation(loadUrl);

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const handleReload = () => setReloadTrigger(n => n + 1);

  const { opacity, isClickThrough, handleOpacityChange, handleClickThrough, handleClose } =
    useWindowState(showOSD, t);

  const { showSettings, listModal, openSettings, closeSettings, openListModal, closeListModal } =
    useModals();

  const { openFavorites, openHistory, handleAddFav } = useUserData(showOSD, navigate, t);

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
        onNavigate={navigate}
        onReload={handleReload}
        onOpacityChange={handleOpacityChange}
        onClickThrough={handleClickThrough}
        onHome={goHome}
        onSettings={openSettings}
        onClose={handleClose}
        onAddFav={handleAddFav}
        t={t}
      />

      {view === 'home' && (
        <HomeView
          onNavigate={navigate}
          onFavorites={() => openListModal(openFavorites)}
          onHistory={() => openListModal(openHistory)}
          t={t}
        />
      )}

      {view === 'webview' && (
        <WebviewContainer
          url={targetUrl}
          visible={true}
          reloadTrigger={reloadTrigger}
          onNavigate={handleNavigate}
          onTitleChange={handleTitleChange}
          t={t}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={closeSettings}
          locale={locale}
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
          onClose={closeListModal}
          t={t}
        />
      )}

      <OSD message={osdMessage} />
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
