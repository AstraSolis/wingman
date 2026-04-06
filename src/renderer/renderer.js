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
    errorMessage: document.getElementById('errorMessage'),
    homeBtn: document.getElementById('homeBtn'),
    addFavBtn: document.getElementById('addFavBtn'),
    homeUrlInput: document.getElementById('homeUrlInput'),
    homeGoBtn: document.getElementById('homeGoBtn'),
    showFavBtn: document.getElementById('showFavBtn'),
    showHistoryBtn: document.getElementById('showHistoryBtn'),
    closeModalBtn: document.getElementById('closeModalBtn')
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
  // 启动时钟
  if (window.UI.initClock) window.UI.initClock();

  // 加载 Bing 每日壁纸
  const fetchWallpaper = () => {
    const bgEl = document.getElementById('homeBg');
    if (bgEl) {
      // 避免缓存问题加上按天的时间戳或者直接加载
      bgEl.style.backgroundImage = `url('https://api.dujin.org/bing/1920.php')`;
    }
  };
  fetchWallpaper();

  // 绑定收藏夹与历史逻辑
  const refreshFavButtonStatus = async () => {
    try {
      if (!elements.webview.src || elements.webview.src === 'about:blank') {
        elements.addFavBtn.style.color = '';
        return;
      }
      const data = await window.wingman.getUserData();
      const isFav = data.favorites.some(f => f.url === elements.webview.src);
      if (isFav) {
        elements.addFavBtn.style.color = 'var(--warning)'; // 亮黄色或者其他颜色
      } else {
        elements.addFavBtn.style.color = '';
      }
    } catch (err) {
      console.warn('Failed to refresh fav button:', err);
    }
  };

  elements.addFavBtn.addEventListener('click', async () => {
    try {
      const currentUrl = elements.webview.src;
      const currentTitle = elements.webview.getTitle();
      if (!currentUrl || currentUrl === 'about:blank') return;
      
      const data = await window.wingman.getUserData();
      const isFav = data.favorites.some(f => f.url === currentUrl);
      
      if (isFav) {
        await window.wingman.removeFavorite(currentUrl);
        window.UI.showOSD(window.UI.t('home.favRemoved') || '已取消收藏');
      } else {
        await window.wingman.saveFavorite({ title: currentTitle, url: currentUrl });
        window.UI.showOSD(window.UI.t('home.favAdded') || '已加入收藏');
      }
      refreshFavButtonStatus();
    } catch (err) {
      console.warn('Action failed:', err);
    }
  });

  const openFavorites = async () => {
    try {
      const data = await window.wingman.getUserData();
      window.UI.showModal('收藏夹', data.favorites, 'favorites', 
        (item) => { // 选中
          window.WebviewHandler.loadUrl(elements.webview, item.url);
        }, 
        async (item, index) => { // 删除
          await window.wingman.removeFavorite(item.url);
          openFavorites(); // 刷新列表
        }
      );
    } catch (err) {}
  };
  
  const openHistory = async () => {
    try {
      const data = await window.wingman.getUserData();
      window.UI.showModal('历史记录', data.history, 'history',
        (item) => {
          window.WebviewHandler.loadUrl(elements.webview, item.url);
        }
      );
    } catch (err) {}
  };

  elements.showFavBtn.addEventListener('click', openFavorites);
  elements.showHistoryBtn.addEventListener('click', openHistory);

  // 监听导航事件刷新收藏按钮状态
  elements.webview.addEventListener('did-navigate', refreshFavButtonStatus);
  elements.webview.addEventListener('did-navigate-in-page', refreshFavButtonStatus);

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
      if (state.lastUrl && state.lastUrl !== '') {
        elements.urlInput.value = state.lastUrl;
        window.WebviewHandler.loadUrl(elements.webview, state.lastUrl);
      } else {
        // 如果没有保存记录或者记录为空，展示首页
        window.UI.switchView('home');
      }
    }
  } catch (err) {
    console.error(window.UI.t('renderer.getStateFailed'), err);
    window.UI.switchView('home');
  }

  console.log(window.UI.t('renderer.initialized'));
});
