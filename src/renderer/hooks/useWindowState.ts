import { useState, useEffect, useCallback } from 'react';
import { useBootState } from './useBootState';
import type { TFunction } from './useI18n';

export function useWindowState(showOSD: (msg: string) => void, t: TFunction) {
  const bootState = useBootState();
  const [opacity, setOpacity] = useState(85);
  const [isClickThrough, setIsClickThrough] = useState(false);

  useEffect(() => {
    const state = bootState?.windowState;
    if (!state) return;
    setOpacity(Math.round(state.opacity * 100));
    setIsClickThrough(state.isClickThrough ?? false);
  }, [bootState]);

  useEffect(() => {
    const offOpacity = window.wingman.window.onOpacityUpdated((val) => {
      const pct = Math.round(val * 100);
      setOpacity(pct);
      showOSD(t('osd.opacity', { value: String(pct) }));
    });
    const offClickThrough = window.wingman.window.onClickThroughUpdated((enabled) => {
      setIsClickThrough(enabled);
      showOSD(enabled ? t('osd.clickThroughOn') : t('osd.clickThroughOff'));
    });
    return () => {
      offOpacity();
      offClickThrough();
    };
  }, [t, showOSD]);

  const handleOpacityChange = useCallback((val: number) => {
    setOpacity(val);
    window.wingman.window.setOpacity(val / 100);
  }, []);

  const handleClickThrough = useCallback(() => window.wingman.window.toggleClickThrough(), []);
  const handleClose = useCallback(() => window.wingman.window.close(), []);

  return {
    opacity,
    isClickThrough,
    handleOpacityChange,
    handleClickThrough,
    handleClose
  };
}
