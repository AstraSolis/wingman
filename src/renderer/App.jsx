import { useI18n } from './hooks/useI18n.js';
import { useWingman } from './hooks/useWingman.js';
import { useOSD } from './hooks/useOSD.js';
import { useNavigation } from './hooks/useNavigation.js';
import { useWindowState } from './hooks/useWindowState.js';
import { useModals } from './hooks/useModals.js';
import { useStartupPage } from './hooks/useStartupPage.js';
import { useUserData, useNavigationEvents } from './hooks/useUserData.js';
import { BootStateProvider } from './hooks/useBootState.js';
import { useDocumentTitle } from './hooks/useDocumentTitle.js';
import Toolbar from './components/Toolbar.jsx';
import HomeView from './components/HomeView.jsx';
import WebviewContainer from './components/WebviewContainer.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import ListModal from './components/ListModal.jsx';
import OSD from './components/OSD.jsx';

function AppContent() {
  const { locale, t, setLocale, ready } = useI18n();
  const { loadUrl } = useWingman();
  const { osdMessage, showOSD } = useOSD();

  const { view, currentUrl, currentTitle, navigate, goHome, handleNavigate, handleTitleChange } =
    useNavigation(loadUrl);

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

      <WebviewContainer
        url={currentUrl}
        visible={view === 'webview'}
        onNavigate={handleNavigate}
        onTitleChange={handleTitleChange}
        t={t}
      />

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
