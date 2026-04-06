// 预加载脚本
// 通过 contextBridge 安全暴露 API 给渲染进程

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wingman', {
  // 设置透明度
  setOpacity: (opacity) => {
    ipcRenderer.send('set-opacity', opacity);
  },

  // 切换点击穿透
  toggleClickThrough: () => {
    ipcRenderer.send('toggle-click-through');
  },

  // 加载 URL
  loadUrl: (url) => {
    ipcRenderer.send('load-url', url);
  },

  // 隐藏窗口
  hideWindow: () => {
    ipcRenderer.send('hide-window');
  },

  // 保存当前的 URL
  saveLastUrl: (url) => {
    ipcRenderer.send('save-last-url', url);
  },

  // 获取初始状态
  getInitialState: () => {
    return ipcRenderer.invoke('get-initial-state');
  },

  // 监听透明度更新（防止重复注册）
  onOpacityUpdated: (callback) => {
    ipcRenderer.removeAllListeners('opacity-updated');
    ipcRenderer.on('opacity-updated', (_event, opacity) => {
      callback(opacity);
    });
  },

  // 监听穿透状态更新（防止重复注册）
  onClickThroughUpdated: (callback) => {
    ipcRenderer.removeAllListeners('click-through-updated');
    ipcRenderer.on('click-through-updated', (_event, isEnabled) => {
      callback(isEnabled);
    });
  },

  // 监听 URL 导航（防止重复注册）
  onNavigateUrl: (callback) => {
    ipcRenderer.removeAllListeners('navigate-url');
    ipcRenderer.on('navigate-url', (_event, url) => {
      callback(url);
    });
  },

  // i18n: 获取翻译数据
  getI18nData: () => {
    return ipcRenderer.invoke('get-i18n-data');
  },

  // i18n: 切换语言
  setLocale: (locale) => {
    return ipcRenderer.invoke('set-locale', locale);
  },

  // 获取开机自启状态
  getAutoStart: () => {
    return ipcRenderer.invoke('get-auto-start');
  },

  // 设置开机自启状态
  setAutoStart: (enable) => {
    return ipcRenderer.invoke('set-auto-start', enable);
  },

  // 获取用户数据
  getUserData: () => {
    return ipcRenderer.invoke('get-user-data');
  },

  // 保存收藏
  saveFavorite: (item) => {
    return ipcRenderer.invoke('save-favorite', item);
  },

  // 移除收藏
  removeFavorite: (url) => {
    return ipcRenderer.invoke('remove-favorite', url);
  },

  // 添加历史记录
  addHistory: (item) => {
    ipcRenderer.send('add-history', item);
  },

  // 清除历史记录
  clearHistory: () => {
    return ipcRenderer.invoke('clear-history');
  },

  // 关闭窗口（根据策略）
  closeWindow: () => {
    ipcRenderer.send('close-window');
  },

  // 获取启动配置
  getStartupConfig: () => {
    return ipcRenderer.invoke('get-startup-config');
  },

  // 设置启动页面类型
  setStartupPage: (pageType) => {
    return ipcRenderer.invoke('set-startup-page', pageType);
  },

  // 设置自定义启动网址
  setCustomStartupUrl: (url) => {
    return ipcRenderer.invoke('set-custom-startup-url', url);
  },

  // 设置关闭窗口策略
  setCloseStrategy: (strategy) => {
    return ipcRenderer.invoke('set-close-strategy', strategy);
  },

  // 设置是否记忆窗口位置
  setRememberWindowBounds: (remember) => {
    return ipcRenderer.invoke('set-remember-window-bounds', remember);
  }
});
