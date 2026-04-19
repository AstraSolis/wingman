// 预加载脚本
// 通过 contextBridge 安全暴露 API 给渲染进程

const { contextBridge, ipcRenderer } = require('electron');

// 窗口控制相关
const windowAPI = {
  setOpacity: (opacity) => ipcRenderer.send('set-opacity', opacity),
  toggleClickThrough: () => ipcRenderer.send('toggle-click-through'),
  hide: () => ipcRenderer.send('hide-window'),
  close: () => ipcRenderer.send('close-window'),
  getInitialState: () => ipcRenderer.invoke('get-initial-state'),
  onOpacityUpdated: (callback) => {
    ipcRenderer.removeAllListeners('opacity-updated');
    ipcRenderer.on('opacity-updated', (_event, opacity) => callback(opacity));
  },
  onClickThroughUpdated: (callback) => {
    ipcRenderer.removeAllListeners('click-through-updated');
    ipcRenderer.on('click-through-updated', (_event, isEnabled) => callback(isEnabled));
  }
};

// 设置管理相关
const settingsAPI = {
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setAutoStart: (enable) => ipcRenderer.invoke('set-auto-start', enable),
  getStartupConfig: () => ipcRenderer.invoke('get-startup-config'),
  setStartupPage: (pageType) => ipcRenderer.invoke('set-startup-page', pageType),
  setCustomStartupUrl: (url) => ipcRenderer.invoke('set-custom-startup-url', url),
  setCloseStrategy: (strategy) => ipcRenderer.invoke('set-close-strategy', strategy),
  setRememberWindowBounds: (remember) => ipcRenderer.invoke('set-remember-window-bounds', remember)
};

// 用户数据相关
const userDataAPI = {
  get: () => ipcRenderer.invoke('get-user-data'),
  saveFavorite: (item) => ipcRenderer.invoke('save-favorite', item),
  removeFavorite: (url) => ipcRenderer.invoke('remove-favorite', url),
  addHistory: (item) => ipcRenderer.send('add-history', item),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  saveLastUrl: (url) => ipcRenderer.send('save-last-url', url)
};

// 导航相关
const navigationAPI = {
  loadUrl: (url) => ipcRenderer.send('load-url', url),
  onNavigateUrl: (callback) => {
    ipcRenderer.removeAllListeners('navigate-url');
    ipcRenderer.on('navigate-url', (_event, url) => callback(url));
  }
};

// i18n 相关
const i18nAPI = {
  getData: () => ipcRenderer.invoke('get-i18n-data'),
  setLocale: (locale) => ipcRenderer.invoke('set-locale', locale)
};

contextBridge.exposeInMainWorld('wingman', {
  window: windowAPI,
  settings: settingsAPI,
  userData: userDataAPI,
  navigation: navigationAPI,
  i18n: i18nAPI,

  // 向后兼容:保留旧的扁平接口,逐步迁移后可移除
  setOpacity: windowAPI.setOpacity,
  toggleClickThrough: windowAPI.toggleClickThrough,
  hideWindow: windowAPI.hide,
  closeWindow: windowAPI.close,
  getInitialState: windowAPI.getInitialState,
  onOpacityUpdated: windowAPI.onOpacityUpdated,
  onClickThroughUpdated: windowAPI.onClickThroughUpdated,
  loadUrl: navigationAPI.loadUrl,
  onNavigateUrl: navigationAPI.onNavigateUrl,
  getAutoStart: settingsAPI.getAutoStart,
  setAutoStart: settingsAPI.setAutoStart,
  getStartupConfig: settingsAPI.getStartupConfig,
  setStartupPage: settingsAPI.setStartupPage,
  setCustomStartupUrl: settingsAPI.setCustomStartupUrl,
  setCloseStrategy: settingsAPI.setCloseStrategy,
  setRememberWindowBounds: settingsAPI.setRememberWindowBounds,
  getUserData: userDataAPI.get,
  saveFavorite: userDataAPI.saveFavorite,
  removeFavorite: userDataAPI.removeFavorite,
  addHistory: userDataAPI.addHistory,
  clearHistory: userDataAPI.clearHistory,
  saveLastUrl: userDataAPI.saveLastUrl,
  getI18nData: i18nAPI.getData,
  setLocale: i18nAPI.setLocale
});
