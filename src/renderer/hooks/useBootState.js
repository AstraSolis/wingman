import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';

const BootStateContext = createContext(null);

export function BootStateProvider({ children }) {
  const [bootState, setBootState] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [windowState, startupConfig, autoStart] = await Promise.all([
          window.wingman.window.getInitialState(),
          window.wingman.settings.getStartupConfig(),
          window.wingman.settings.getAutoStart()
        ]);
        setBootState({
          windowState: windowState || null,
          startupConfig: startupConfig || null,
          autoStart: autoStart ?? false
        });
      } catch {
        setBootState({
          windowState: null,
          startupConfig: null,
          autoStart: false
        });
      }
    })();
  }, []);

  const value = useMemo(() => bootState, [bootState]);

  return createElement(BootStateContext.Provider, { value }, children);
}

export function useBootState() {
  return useContext(BootStateContext);
}
