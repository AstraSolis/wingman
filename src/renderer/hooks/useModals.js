import { useState, useCallback } from 'react';

export function useModals() {
  const [showSettings, setShowSettings] = useState(false);
  const [listModal, setListModal] = useState(null);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeListModal = useCallback(() => setListModal(null), []);

  const openListModal = useCallback(async (loadModal) => {
    const modal = await loadModal();
    setListModal({
      ...modal,
      onSelect: (item) => {
        modal.onSelect(item);
        setListModal(null);
      },
      onDelete: modal.onDelete
        ? async (item) => {
            const items = await modal.onDelete(item);
            setListModal((current) => (current ? { ...current, items } : current));
          }
        : undefined
    });
  }, []);

  return {
    showSettings,
    listModal,
    openSettings,
    closeSettings,
    openListModal,
    closeListModal
  };
}
