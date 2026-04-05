// UI 交互模块
// 绑定按钮事件、滑块交互、OSD 提示、i18n DOM 翻译

let osdTimer = null;
let currentTranslations = {};
let fallbackTranslations = {};

// 使用共享工具创建渲染进程的翻译函数
const t = window.I18nUtils.createTranslator(
  () => currentTranslations,
  () => fallbackTranslations
);

/**
 * 应用翻译到所有带 data-i18n 属性的 DOM 元素
 */
function applyTranslations() {
  // data-i18n: 设置 textContent
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text !== key) {
      el.textContent = text;
    }
  });

  // data-i18n-placeholder: 设置 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = t(key);
    if (text !== key) {
      el.placeholder = text;
    }
  });

  // data-i18n-title: 设置 title
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    const text = t(key);
    if (text !== key) {
      el.title = text;
    }
  });
}

/**
 * 设置翻译数据
 * @param {object} i18nData - 包含 translations 和 fallback 的对象
 */
function setTranslations(i18nData) {
  currentTranslations = i18nData.translations || {};
  fallbackTranslations = i18nData.fallback || {};
  applyTranslations();
}

/**
 * 显示 OSD 临时提示
 * @param {string} message - 提示文本
 * @param {number} duration - 显示时长（毫秒）
 */
function showOSD(message, duration = 2000) {
  const osd = document.getElementById('osd');
  if (!osd) return;

  // 清除之前的定时器和动画
  if (osdTimer) {
    clearTimeout(osdTimer);
    osd.classList.remove('fade-out');
  }

  osd.textContent = message;
  osd.classList.remove('hidden', 'fade-out');

  osdTimer = setTimeout(() => {
    osd.classList.add('fade-out');
    // 动画结束后隐藏
    setTimeout(() => {
      osd.classList.add('hidden');
      osd.classList.remove('fade-out');
    }, 300);
  }, duration);
}

/**
 * 初始化 UI 事件绑定
 * @param {object} elements - DOM 元素引用
 */
function initUI(elements) {
  const {
    urlInput, loadBtn, opacitySlider, opacityValue,
    clickThroughBtn, hideBtn, retryBtn, webview
  } = elements;

  // 地址栏：回车加载
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      window.WebviewHandler.loadUrl(webview, urlInput.value);
    }
  });

  // 加载按钮
  loadBtn.addEventListener('click', () => {
    window.WebviewHandler.loadUrl(webview, urlInput.value);
  });

  // 透明度滑块
  opacitySlider.addEventListener('input', () => {
    const value = opacitySlider.value / 100;
    opacityValue.textContent = `${opacitySlider.value}%`;
    window.wingman.setOpacity(value);
  });

  // 穿透切换按钮
  clickThroughBtn.addEventListener('click', () => {
    window.wingman.toggleClickThrough();
  });

  // 隐藏窗口按钮
  hideBtn.addEventListener('click', () => {
    window.wingman.hideWindow();
  });

  // 重试按钮
  retryBtn.addEventListener('click', () => {
    window.WebviewHandler.reload(webview);
    document.getElementById('errorOverlay').classList.add('hidden');
  });

  // 监听主进程的透明度更新（快捷键触发时同步 UI）
  window.wingman.onOpacityUpdated((opacity) => {
    const percent = Math.round(opacity * 100);
    opacitySlider.value = percent;
    opacityValue.textContent = `${percent}%`;
    showOSD(t('osd.opacity', { value: percent }));
  });

  // 监听主进程的穿透状态更新
  window.wingman.onClickThroughUpdated((isEnabled) => {
    if (isEnabled) {
      clickThroughBtn.classList.add('active');
    } else {
      clickThroughBtn.classList.remove('active');
    }
    showOSD(isEnabled ? t('osd.clickThroughOn') : t('osd.clickThroughOff'));
  });

  // 监听来自主进程的 URL 导航
  window.wingman.onNavigateUrl((url) => {
    window.WebviewHandler.loadUrl(webview, url);
  });
}

// 导出
window.UI = {
  initUI,
  showOSD,
  t,
  setTranslations,
  applyTranslations
};
