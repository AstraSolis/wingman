import { useState, useCallback } from 'react';

export function useNavigation(loadUrl) {
  const [view, setView] = useState('home');
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');

  const navigate = useCallback(
    (rawUrl) => {
      const url = loadUrl(rawUrl);
      if (!url) return;
      setCurrentUrl(url);
      setView('webview');
    },
    [loadUrl]
  );

  const goHome = useCallback(() => {
    setView('home');
    setCurrentUrl('');
    setCurrentTitle('');
  }, []);

  const handleNavigate = useCallback((url, title) => {
    setCurrentUrl(url);
    if (title) {
      setCurrentTitle(title);
    }
    window.wingman.userData.saveLastUrl(url);
    window.wingman.userData.addHistory({ title: title || url, url });
  }, []);

  const handleTitleChange = useCallback((title) => {
    setCurrentTitle(title);
  }, []);

  return {
    view,
    currentUrl,
    currentTitle,
    navigate,
    goHome,
    handleNavigate,
    handleTitleChange
  };
}
