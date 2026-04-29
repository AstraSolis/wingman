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
