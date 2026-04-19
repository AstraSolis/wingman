import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useBootState } from './useBootState';
import type { TFunction } from './useI18n';

function useDebouncedSave(callback: (value: string) => unknown, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callback(value), delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debouncedSave;
}

export function useSettingsPanel(
  locale: string,
  onLocaleChange: (locale: string) => Promise<void>,
  showOSD: (msg: string) => void,
  t: TFunction
) {
  const bootState = useBootState();
  const [autoStart, setAutoStart] = useState(false);
  const [startupPage, setStartupPage] = useState('lastPage');
  const [customUrl, setCustomUrl] = useState('');
  const [closeStrategy, setCloseStrategy] = useState('minimize');
  const [rememberBounds, setRememberBounds] = useState(true);

  useEffect(() => {
    if (!bootState) return;
    const startupConfig = bootState.startupConfig;
    setAutoStart(bootState.autoStart ?? false);
    setStartupPage(startupConfig?.startupPage || 'lastPage');
    setCustomUrl(startupConfig?.customStartupUrl || '');
    setCloseStrategy(startupConfig?.closeStrategy || 'minimize');
    setRememberBounds(startupConfig?.rememberWindowBounds ?? true);
  }, [bootState]);

  const debouncedSaveCustomUrl = useDebouncedSave((url) =>
    window.wingman.settings.setCustomStartupUrl(url)
  );

  const langOptions = useMemo(
    () => [
      { value: 'zh-CN', label: t('settings.languageZhCN') },
      { value: 'en-US', label: t('settings.languageEnUS') }
    ],
    [t]
  );

  const startupOptions = useMemo(
    () => [
      { value: 'home', label: t('settings.startupPageHome') },
      { value: 'lastPage', label: t('settings.startupPageLast') },
      { value: 'favorites', label: t('settings.startupPageFavorites') },
      { value: 'customUrl', label: t('settings.startupPageCustom') }
    ],
    [t]
  );

  const closeOptions = useMemo(
    () => [
      { value: 'minimize', label: t('settings.closeStrategyMinimize') },
      { value: 'quit', label: t('settings.closeStrategyQuit') }
    ],
    [t]
  );

  const handleLocaleChange = useCallback(
    async (value: string) => {
      await onLocaleChange(value);
    },
    [onLocaleChange]
  );

  const handleAutoStartChange = useCallback(async (checked: boolean) => {
    setAutoStart(checked);
    await window.wingman.settings.setAutoStart(checked);
  }, []);

  const handleStartupPageChange = useCallback(async (value: string) => {
    setStartupPage(value);
    await window.wingman.settings.setStartupPage(value);
  }, []);

  const handleCustomUrlChange = useCallback(
    (value: string) => {
      setCustomUrl(value);
      debouncedSaveCustomUrl(value);
    },
    [debouncedSaveCustomUrl]
  );

  const handleCloseStrategyChange = useCallback(async (value: string) => {
    setCloseStrategy(value);
    await window.wingman.settings.setCloseStrategy(value);
  }, []);

  const handleRememberBoundsChange = useCallback(async (checked: boolean) => {
    setRememberBounds(checked);
    await window.wingman.settings.setRememberWindowBounds(checked);
  }, []);

  const handleClearHistory = useCallback(async () => {
    await window.wingman.userData.clearHistory();
    showOSD(t('settings.historyCleared'));
  }, [showOSD, t]);

  return {
    locale,
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
  };
}
