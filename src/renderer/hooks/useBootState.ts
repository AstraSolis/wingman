import { createContext, createElement, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface BootState {
  windowState: WingmanWindowState | null;
  startupConfig: WingmanStartupConfig | null;
  autoStart: boolean;
}

const BootStateContext = createContext<BootState | null>(null);

interface BootStateProviderProps {
  children: ReactNode;
}

export function BootStateProvider({ children }: BootStateProviderProps) {
  const [bootState, setBootState] = useState<BootState | null>(null);

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

  return createElement(BootStateContext.Provider, { value: bootState }, children);
}

export function useBootState(): BootState | null {
  return useContext(BootStateContext);
}
