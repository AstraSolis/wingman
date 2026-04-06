// Webview 管理模块
// 管理 <webview> 元素的加载、事件和错误处理

/**
 * 初始化 webview 事件处理
 * @param {HTMLElement} webview - webview DOM 元素
 * @param {object} elements - 相关 DOM 元素引用
 */
function initWebview(webview, elements) {
  const { loadingIndicator, errorOverlay, errorMessage, urlInput } = elements;

  // 开始加载
  webview.addEventListener('did-start-loading', () => {
    loadingIndicator.classList.remove('hidden');
    errorOverlay.classList.add('hidden');
  });

  // 加载完成
  webview.addEventListener('did-stop-loading', () => {
    loadingIndicator.classList.add('hidden');
  });

  // 页面导航成功，更新地址栏并记录历史
  webview.addEventListener('did-navigate', (event) => {
    urlInput.value = event.url;
    if (window.wingman && window.wingman.saveLastUrl) {
      window.wingman.saveLastUrl(event.url);
    }
    if (window.wingman && window.wingman.addHistory) {
      const title = webview.getTitle() || event.url;
      window.wingman.addHistory({ title, url: event.url });
    }
  });

  // 页面内导航（如 SPA 路由切换）
  webview.addEventListener('did-navigate-in-page', (event) => {
    if (event.isMainFrame) {
      urlInput.value = event.url;
      if (window.wingman && window.wingman.saveLastUrl) {
        window.wingman.saveLastUrl(event.url);
      }
      if (window.wingman && window.wingman.addHistory) {
        const title = webview.getTitle() || event.url;
        window.wingman.addHistory({ title, url: event.url });
      }
    }
  });

  // 加载失败
  webview.addEventListener('did-fail-load', (event) => {
    // 忽略中断的加载（如用户导航到新页面）
    if (event.errorCode === -3) return;

    loadingIndicator.classList.add('hidden');
    errorOverlay.classList.remove('hidden');
    errorMessage.textContent = window.UI.t('webview.loadError', {
      description: event.errorDescription || 'Unknown',
      code: event.errorCode
    });
  });

  // 阻止新窗口弹出，在当前 webview 中打开
  webview.addEventListener('new-window', (event) => {
    event.preventDefault();
    webview.src = event.url;
  });

  // 标题变化
  webview.addEventListener('page-title-updated', (event) => {
    document.title = `Wingman - ${event.title}`;
  });
}

/**
 * 加载指定 URL，或使用 Bing 搜索
 * @param {HTMLElement} webview - webview DOM 元素
 * @param {string} url - 要加载的 URL 或 搜索词
 */
function loadUrl(webview, url) {
  if (!url) return;

  let query = url.trim();
  let normalizedUrl = query;

  // 简单的 URL 判断正则：看是否可能是一个网址 (包含 . 并且没有空格，或者以 http 开头)
  const isUrl = /^(https?:\/\/)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i.test(query) && !query.includes(' ');

  if (isUrl) {
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
  } else {
    // 否则认为是搜索词，使用 Bing 搜索引擎
    normalizedUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  }

  // 隐藏主页，显示 webview
  if (window.UI && window.UI.switchView) {
    window.UI.switchView('webview');
  }

  webview.src = normalizedUrl;
}

/**
 * 重新加载当前页面
 * @param {HTMLElement} webview - webview DOM 元素
 */
function reload(webview) {
  webview.reload();
}

// 导出模块方法
window.WebviewHandler = {
  initWebview,
  loadUrl,
  reload
};
