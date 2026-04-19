import { useCallback, useEffect } from 'react';

export function useUserData(showOSD, navigate, t) {
  const openFavorites = useCallback(async () => {
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

  const openHistory = useCallback(async () => {
    const data = await window.wingman.userData.get();
    return {
      title: t('modal.history'),
      items: data.history,
      type: 'history',
      onSelect: (item) => navigate(item.url)
    };
  }, [navigate, t]);

  const handleAddFav = useCallback(
    async (url, title) => {
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

  return {
    openFavorites,
    openHistory,
    handleAddFav
  };
}

export function useNavigationEvents(navigate) {
  useEffect(() => {
    window.wingman.navigation.onNavigateUrl((url) => navigate(url));
  }, [navigate]);
}
