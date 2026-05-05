import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { TFunction } from './useI18n';
import { SEARCH_ENGINES, DEFAULT_SEARCH_ENGINE, DEFAULT_CUSTOM_SEARCH_URL } from '../../common/constants';

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
  t: TFunction,
  onSearchEngineChange?: (engine: string, customUrl: string) => void
) {
  const [autoStart, setAutoStart] = useState(false);
  const [startupPage, setStartupPage] = useState('lastPage');
  const [customUrl, setCustomUrl] = useState('');
  const [closeStrategy, setCloseStrategy] = useState('minimize');
  const [rememberBounds, setRememberBounds] = useState(true);
  const [searchEngine, setSearchEngine] = useState<string>(DEFAULT_SEARCH_ENGINE);
  const [customSearchUrl, setCustomSearchUrl] = useState(DEFAULT_CUSTOM_SEARCH_URL);

  useEffect(() => {
    Promise.all([
      window.wingman.settings.getStartupConfig(),
      window.wingman.settings.getAutoStart()
    ]).then(([startupConfig, autoStartVal]) => {
      setAutoStart(autoStartVal ?? false);
      setStartupPage(startupConfig?.startupPage || 'lastPage');
      setCustomUrl(startupConfig?.customStartupUrl || '');
      setCloseStrategy(startupConfig?.closeStrategy || 'minimize');
      setRememberBounds(startupConfig?.rememberWindowBounds ?? true);
      setSearchEngine(startupConfig?.searchEngine || DEFAULT_SEARCH_ENGINE);
      setCustomSearchUrl(startupConfig?.customSearchUrl || DEFAULT_CUSTOM_SEARCH_URL);
    });
  }, []);

  const debouncedSaveCustomUrl = useDebouncedSave((url) =>
    window.wingman.settings.setCustomStartupUrl(url)
  );

  const debouncedSaveCustomSearchUrl = useDebouncedSave((url) =>
    window.wingman.settings.setCustomSearchUrl(url)
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

  const searchEngineOptions = useMemo(
    () => [
      { value: SEARCH_ENGINES.BING, label: t('settings.searchEngineBing') },
      { value: SEARCH_ENGINES.GOOGLE, label: t('settings.searchEngineGoogle') },
      { value: SEARCH_ENGINES.BAIDU, label: t('settings.searchEngineBaidu') },
      { value: SEARCH_ENGINES.CUSTOM, label: t('settings.searchEngineCustom') }
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

  const handleSearchEngineChange = useCallback(async (value: string) => {
    setSearchEngine(value);
    await window.wingman.settings.setSearchEngine(value);
    onSearchEngineChange?.(value, customSearchUrl);
  }, [customSearchUrl, onSearchEngineChange]);

  const handleCustomSearchUrlChange = useCallback(
    (value: string) => {
      setCustomSearchUrl(value);
      debouncedSaveCustomSearchUrl(value);
      if (searchEngine === SEARCH_ENGINES.CUSTOM) {
        onSearchEngineChange?.(searchEngine, value);
      }
    },
    [debouncedSaveCustomSearchUrl, searchEngine, onSearchEngineChange]
  );

  return {
    locale,
    autoStart,
    startupPage,
    customUrl,
    closeStrategy,
    rememberBounds,
    searchEngine,
    customSearchUrl,
    langOptions,
    startupOptions,
    closeOptions,
    searchEngineOptions,
    handleLocaleChange,
    handleAutoStartChange,
    handleStartupPageChange,
    handleCustomUrlChange,
    handleCloseStrategyChange,
    handleRememberBoundsChange,
    handleClearHistory,
    handleSearchEngineChange,
    handleCustomSearchUrlChange
  };
}
