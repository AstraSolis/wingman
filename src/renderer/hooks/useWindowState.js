import { useState, useEffect, useCallback } from 'react';
import { useBootState } from './useBootState.js';

export function useWindowState(showOSD, t) {
  const bootState = useBootState();
  const [opacity, setOpacity] = useState(85);
  const [isClickThrough, setIsClickThrough] = useState(false);

  useEffect(() => {
    const state = bootState?.windowState;
    if (!state) return;
    setOpacity(Math.round(state.opacity * 100));
    setIsClickThrough(state.isClickThrough ?? false);
  }, [bootState]);

  // 监听主进程推送的透明度、穿透事件
  useEffect(() => {
    window.wingman.window.onOpacityUpdated((val) => {
      const pct = Math.round(val * 100);
      setOpacity(pct);
      showOSD(t('osd.opacity', { value: pct }));
    });
    window.wingman.window.onClickThroughUpdated((enabled) => {
      setIsClickThrough(enabled);
      showOSD(enabled ? t('osd.clickThroughOn') : t('osd.clickThroughOff'));
    });
  }, [t, showOSD]);

  const handleOpacityChange = useCallback((val) => {
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
