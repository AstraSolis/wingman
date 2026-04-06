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
    closeModalBtn: document.getElementById('closeModalBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    languageSelect: document.getElementById('languageSelect'),
    autoStartCheckbox: document.getElementById('autoStartCheckbox'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn')
  };

  // 初始化 i18n 翻译
  try {
    const i18nData = await window.wingman.getI18nData();
    if (i18nData) {
      window.UI.setTranslations(i18nData);
      // 设置页面标题
      document.title = window.UI.t('app.title');
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
        window.UI.showOSD(window.UI.t('home.favRemoved'));
      } else {
        await window.wingman.saveFavorite({ title: currentTitle, url: currentUrl });
        window.UI.showOSD(window.UI.t('home.favAdded'));
      }
      refreshFavButtonStatus();
    } catch (err) {
      console.warn('Action failed:', err);
    }
  });

  const openFavorites = async () => {
    try {
      const data = await window.wingman.getUserData();
      window.UI.showModal(window.UI.t('modal.favorites'), data.favorites, 'favorites',
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
      window.UI.showModal(window.UI.t('modal.history'), data.history, 'history',
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

  // 设置面板逻辑
  const languageSelected = document.getElementById('languageSelected');
  const languageSelectedText = document.getElementById('languageSelectedText');
  const languageMenu = document.getElementById('languageMenu');

  elements.settingsBtn.addEventListener('click', async () => {
    try {
      const i18nData = await window.wingman.getI18nData();
      const currentLocale = i18nData.locale || 'zh-CN';
      // 更新自定义下拉框显示
      const selItem = document.querySelector(`.dropdown-item[data-value="${currentLocale}"]`);
      if (selItem && languageSelectedText) {
        languageSelectedText.textContent = window.UI.t(`settings.language${currentLocale === 'zh-CN' ? 'ZhCN' : 'EnUS'}`);
      }
      elements.autoStartCheckbox.checked = await window.wingman.getAutoStart();
      elements.settingsModal.classList.remove('hidden');
    } catch (err) {}
  });

  const hideSettings = () => elements.settingsModal.classList.add('hidden');
  elements.closeSettingsBtn.addEventListener('click', hideSettings);
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') hideSettings();
  });

  // 自定义下拉菜单交互逻辑
  if (languageSelected && languageMenu) {
    languageSelected.addEventListener('click', (e) => {
      e.stopPropagation();
      languageMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      if (!languageMenu.classList.contains('hidden')) {
        languageMenu.classList.add('hidden');
      }
    });

    languageMenu.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const val = item.getAttribute('data-value');
        languageSelectedText.textContent = window.UI.t(`settings.language${val === 'zh-CN' ? 'ZhCN' : 'EnUS'}`);
        languageMenu.classList.add('hidden');
        try {
          const newI18n = await window.wingman.setLocale(val);
          window.UI.setTranslations(newI18n);
          // 更新下拉菜单显示
          languageSelectedText.textContent = window.UI.t(`settings.language${val === 'zh-CN' ? 'ZhCN' : 'EnUS'}`);
        } catch (err) {}
      });
    });
  }

  elements.autoStartCheckbox.addEventListener('change', async (e) => {
    try {
      await window.wingman.setAutoStart(e.target.checked);
    } catch (err) {}
  });

  elements.clearHistoryBtn.addEventListener('click', async () => {
    try {
      await window.wingman.clearHistory();
      window.UI.showOSD(window.UI.t('settings.historyCleared'));
    } catch (err) {}
  });

  // 设置面板搜索逻辑
  const settingsSearchInput = document.getElementById('settingsSearchInput');
  if (settingsSearchInput) {
    settingsSearchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().trim();
      const groups = document.querySelectorAll('.settings-group');
      const groupTitles = document.querySelectorAll('.settings-group-title');

      groups.forEach((group, index) => {
        let hasVisibleItem = false;
        const items = group.querySelectorAll('.setting-item-light');

        items.forEach(item => {
          const label = item.querySelector('label');
          const text = label ? label.textContent.toLowerCase() : '';
          
          if (text.includes(keyword)) {
            item.style.display = 'flex';
            hasVisibleItem = true;
          } else {
            item.style.display = 'none';
          }
        });

        // 控制整个组及其标题的显示隐藏
        if (hasVisibleItem) {
          group.style.display = 'block';
          if (groupTitles[index]) groupTitles[index].style.display = 'block';
        } else {
          group.style.display = 'none';
          if (groupTitles[index]) groupTitles[index].style.display = 'none';
        }
      });
    });
    
    // 每次打开面板时清空搜索内容
    elements.settingsBtn.addEventListener('click', () => {
      settingsSearchInput.value = '';
      settingsSearchInput.dispatchEvent(new Event('input'));
    });
  }

  console.log(window.UI.t('renderer.initialized'));
});
