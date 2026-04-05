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

  // 页面导航成功，更新地址栏
  webview.addEventListener('did-navigate', (event) => {
    urlInput.value = event.url;
  });

  // 页面内导航（如 SPA 路由切换）
  webview.addEventListener('did-navigate-in-page', (event) => {
    if (event.isMainFrame) {
      urlInput.value = event.url;
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
 * 加载指定 URL
 * @param {HTMLElement} webview - webview DOM 元素
 * @param {string} url - 要加载的 URL
 */
function loadUrl(webview, url) {
  if (!url) return;

  // 自动补全协议
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
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
