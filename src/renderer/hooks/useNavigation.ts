import { useState, useCallback } from 'react';

export function useNavigation(loadUrl: (url: string) => string | null) {
  const [view, setView] = useState<'home' | 'webview'>('home');
  // targetUrl：用户主动触发的导航目标，驱动 webview 加载
  // currentUrl：webview 实际地址（含内部链接跳转），用于工具栏/历史显示
  const [targetUrl, setTargetUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');

  const navigate = useCallback(
    (rawUrl: string) => {
      const url = loadUrl(rawUrl);
      if (!url) return;
      setTargetUrl(url);
      setCurrentUrl(url);
      setView('webview');
    },
    [loadUrl]
  );

  const goHome = useCallback(() => {
    setView('home');
    setTargetUrl('');
    setCurrentUrl('');
    setCurrentTitle('');
  }, []);

  const handleNavigate = useCallback((url: string, title?: string) => {
    // 只更新 currentUrl，不改 targetUrl，避免触发 webview 重新加载
    setCurrentUrl(url);
    if (title) setCurrentTitle(title);
    window.wingman.userData.saveLastUrl(url);
    window.wingman.userData.addHistory({ title: title || url, url });
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    setCurrentTitle(title);
  }, []);

  return {
    view,
    targetUrl,
    currentUrl,
    currentTitle,
    navigate,
    goHome,
    handleNavigate,
    handleTitleChange
  };
}
