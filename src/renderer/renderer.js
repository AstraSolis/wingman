// 渲染进程入口
// 初始化 i18n、UI 和 Webview，协调各模块

document.addEventListener('DOMContentLoaded', async () => {
  // 获取 DOM 元素引用
  const elements = {
    urlInput: document.getElementById('urlInput'),
    loadBtn: document.getElementById('loadBtn'),
    opacitySlider: document.getElementById('opacitySlider'),
    opacityValue: document.getElementById('opacityValue'),
    clickThroughBtn: document.getElementById('clickThroughBtn'),
    hideBtn: document.getElementById('hideBtn'),
    retryBtn: document.getElementById('retryBtn'),
    webview: document.getElementById('guideWebview'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    errorOverlay: document.getElementById('errorOverlay'),
    errorMessage: document.getElementById('errorMessage')
  };

  // 初始化 i18n 翻译
  try {
    const i18nData = await window.wingman.getI18nData();
    if (i18nData) {
      window.UI.setTranslations(i18nData);
    }
  } catch (err) {
    console.error('[i18n] Failed to initialize:', err);
  }

  // 初始化 Webview 事件处理
  window.WebviewHandler.initWebview(elements.webview, {
    loadingIndicator: elements.loadingIndicator,
    errorOverlay: elements.errorOverlay,
    errorMessage: elements.errorMessage,
    urlInput: elements.urlInput
  });

  // 初始化 UI 交互
  window.UI.initUI(elements);

  // 获取初始状态并同步 UI
  try {
    const state = await window.wingman.getInitialState();
    if (state) {
      // 同步透明度
      const percent = Math.round(state.opacity * 100);
      elements.opacitySlider.value = percent;
      elements.opacityValue.textContent = `${percent}%`;

      // 同步穿透状态
      if (state.isClickThrough) {
        elements.clickThroughBtn.classList.add('active');
      }

      // 同步上次访问的 URL
      if (state.lastUrl) {
        elements.urlInput.value = state.lastUrl;
        window.WebviewHandler.loadUrl(elements.webview, state.lastUrl);
      } else {
        // 如果没有保存记录，则取默认配置
        elements.urlInput.value = elements.webview.src || 'https://www.bilibili.com';
      }
    }
  } catch (err) {
    console.error(window.UI.t('renderer.getStateFailed'), err);
  }

  console.log(window.UI.t('renderer.initialized'));
});
