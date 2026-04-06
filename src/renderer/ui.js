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
 * 时钟管理
 */
function initClock() {
  const clockEl = document.getElementById('homeClock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
  };

  updateClock();
  setInterval(updateClock, 1000); // 防过度消耗可以改成 60000ms 但为了随时保证准度，1秒更直观
}

/**
 * 管理视图切换
 */
function switchView(viewName) {
  const homeView = document.getElementById('homeView');
  const webviewContainer = document.getElementById('webviewContainer');
  if (viewName === 'home') {
    homeView.classList.remove('hidden');
    webviewContainer.classList.add('hidden');
  } else {
    homeView.classList.add('hidden');
    webviewContainer.classList.remove('hidden');
  }
}

/**
 * 模态框管理
 */
function showModal(title, items, type, onSelect, onDelete) {
  const modal = document.getElementById('listModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalList = document.getElementById('modalList');
  
  modalTitle.textContent = title;
  modalList.innerHTML = '';

  if (!items || items.length === 0) {
    const emptyEl = document.createElement('div');
    emptyEl.className = 'empty-state';
    emptyEl.textContent = t('home.emptyList');
    if (emptyEl.textContent === 'home.emptyList') emptyEl.textContent = '暂无记录';
    modalList.appendChild(emptyEl);
  } else {
    items.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'list-item';
      
      const content = document.createElement('div');
      content.className = 'list-item-content';
      
      const titleEl = document.createElement('div');
      titleEl.className = 'list-item-title';
      titleEl.textContent = item.title || 'Unknown Title';
      
      const urlEl = document.createElement('div');
      urlEl.className = 'list-item-url';
      urlEl.textContent = item.url;
      
      content.appendChild(titleEl);
      content.appendChild(urlEl);
      el.appendChild(content);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'list-item-actions';
      
      if (type === 'favorites') {
        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn';
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          onDelete(item, index);
        };
        actions.appendChild(delBtn);
        el.appendChild(actions);
      }

      el.addEventListener('click', () => {
        onSelect(item);
        hideModal();
      });

      modalList.appendChild(el);
    });
  }

  modal.classList.remove('hidden');
}

function hideModal() {
  document.getElementById('listModal').classList.add('hidden');
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
    clickThroughBtn, hideBtn, retryBtn, webview,
    homeBtn, addFavBtn, homeUrlInput, homeGoBtn,
    showFavBtn, showHistoryBtn, closeModalBtn
  } = elements;

  // 绑定关闭模态框
  closeModalBtn.addEventListener('click', hideModal);

  // 点击遮罩关闭模态框
  document.getElementById('listModal').addEventListener('click', (e) => {
    if (e.target.id === 'listModal') {
      hideModal();
    }
  });

  // 主页按钮
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      switchView('home');
      urlInput.value = '';
    });
  }

  // 首页输入栏
  if (homeUrlInput) {
    homeUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        window.WebviewHandler.loadUrl(webview, homeUrlInput.value);
      }
    });

    homeGoBtn.addEventListener('click', () => {
      window.WebviewHandler.loadUrl(webview, homeUrlInput.value);
    });
  }

  // 收藏与历史相关事件会在 renderer 中单独注入逻辑，也可在这里暴露基础点击
  
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
  applyTranslations,
  switchView,
  showModal,
  hideModal,
  initClock
};
