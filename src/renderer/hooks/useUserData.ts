import { useCallback, useEffect } from 'react';
import type { TFunction } from './useI18n';
import type { OpenFavoritesLoader } from './useModals';

export function useUserData(
  showOSD: (msg: string) => void,
  navigate: (url: string) => void,
  t: TFunction
) {
  const openFavorites = useCallback<OpenFavoritesLoader>(async () => {
    const data = await window.wingman.userData.get();
    return {
      title: t('modal.favorites'),
      items: data.favorites,
      type: 'favorites',
      onSelect: (item) => navigate(item.url),
      onDelete: async (item) => {
        const favorites = await window.wingman.userData.removeFavorite(item.url);
        return favorites;
      }
    };
  }, [navigate, t]);

  const openHistory = useCallback<OpenFavoritesLoader>(async () => {
    const data = await window.wingman.userData.get();
    return {
      title: t('modal.history'),
      items: data.history,
      type: 'history',
      onSelect: (item) => navigate(item.url)
    };
  }, [navigate, t]);

  const handleAddFav = useCallback(
    async (url: string, title: string) => {
      if (!url || url === 'about:blank') return;
      const data = await window.wingman.userData.get();
      const isFav = data.favorites.some((favorite) => favorite.url === url);
      if (isFav) {
        await window.wingman.userData.removeFavorite(url);
        showOSD(t('home.favRemoved'));
        return;
      }
      await window.wingman.userData.saveFavorite({ title, url });
      showOSD(t('home.favAdded'));
    },
    [showOSD, t]
  );

  return { openFavorites, openHistory, handleAddFav };
}

export function useNavigationEvents(navigate: (url: string) => void) {
  useEffect(() => {
    return window.wingman.navigation.onNavigateUrl((url) => navigate(url));
  }, [navigate]);
}
