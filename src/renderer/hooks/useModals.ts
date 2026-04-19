import { useState, useCallback } from 'react';

interface ListModalState {
  title: string;
  items: WingmanUserDataItem[];
  type: 'favorites' | 'history';
  onSelect: (item: WingmanUserDataItem) => void;
  onDelete?: (item: WingmanUserDataItem) => void;
}

export function useModals() {
  const [showSettings, setShowSettings] = useState(false);
  const [listModal, setListModal] = useState<ListModalState | null>(null);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeListModal = useCallback(() => setListModal(null), []);

  const openListModal = useCallback(
    async (loadModal: () => Promise<Omit<ListModalState, 'onDelete'> & {
      onDelete?: (item: WingmanUserDataItem) => Promise<WingmanUserDataItem[]>;
    }>) => {
      const modal = await loadModal();
      setListModal({
        ...modal,
        onSelect: (item) => {
          modal.onSelect(item);
          setListModal(null);
        },
        onDelete: modal.onDelete
          ? async (item: WingmanUserDataItem) => {
              const items = await modal.onDelete!(item);
              setListModal((current) => (current ? { ...current, items } : current));
            }
          : undefined
      });
    },
    []
  );

  return {
    showSettings,
    listModal,
    openSettings,
    closeSettings,
    openListModal,
    closeListModal
  };
}

export type { ListModalState };
export type OpenFavoritesLoader = () => Promise<Omit<ListModalState, 'onDelete'> & {
  onDelete?: (item: WingmanUserDataItem) => Promise<WingmanUserDataItem[]>;
}>;
