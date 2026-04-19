import { useEffect, useRef } from 'react';
import { useBootState } from './useBootState';

export function useStartupPage(
  navigate: (url: string) => void,
  openFavoritesModal: () => void
) {
  const bootState = useBootState();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !bootState) return;
    initialized.current = true;

    const state = bootState.windowState;
    const startupConfig = bootState.startupConfig;
    const page = startupConfig?.startupPage || 'lastPage';

    if (page === 'lastPage' && state?.lastUrl) {
      navigate(state.lastUrl);
    } else if (page === 'customUrl' && startupConfig?.customStartupUrl) {
      navigate(startupConfig.customStartupUrl);
    } else if (page === 'favorites') {
      openFavoritesModal();
    }
  }, [bootState, navigate, openFavoritesModal]);
}
