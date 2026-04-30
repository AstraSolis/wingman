import { useState, useEffect, useCallback } from 'react';

export interface ShortcutsState {
  TOGGLE_CLICK_THROUGH: string;
  INCREASE_OPACITY: string;
  DECREASE_OPACITY: string;
  TOGGLE_WINDOW: string;
}

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutsState | null>(null);

  useEffect(() => {
    window.wingman.shortcuts.getAll().then(setShortcuts).catch(() => {});
  }, []);

  const handleSetShortcut = useCallback(async (action: string, accelerator: string) => {
    const updated = await window.wingman.shortcuts.set(action, accelerator);
    setShortcuts(updated);
    return updated;
  }, []);

  const handleResetShortcut = useCallback(async (action: string) => {
    const updated = await window.wingman.shortcuts.reset(action);
    setShortcuts(updated);
    return updated;
  }, []);

  return { shortcuts, handleSetShortcut, handleResetShortcut };
}

export type LocalShortcutsState = WingmanLocalShortcuts;

export function useLocalShortcutsConfig() {
  const [localShortcuts, setLocalShortcuts] = useState<LocalShortcutsState | null>(null);

  useEffect(() => {
    window.wingman.localShortcuts.getAll().then(setLocalShortcuts).catch(() => {});
  }, []);

  const handleSetLocalShortcut = useCallback(async (action: string, accelerator: string) => {
    const updated = await window.wingman.localShortcuts.set(action, accelerator);
    setLocalShortcuts(updated);
    return updated;
  }, []);

  const handleResetLocalShortcut = useCallback(async (action: string) => {
    const updated = await window.wingman.localShortcuts.reset(action);
    setLocalShortcuts(updated);
    return updated;
  }, []);

  return { localShortcuts, handleSetLocalShortcut, handleResetLocalShortcut };
}
