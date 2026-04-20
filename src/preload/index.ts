// 预加载脚本 — 通过 contextBridge 安全暴露 API 给渲染进程

import { contextBridge, ipcRenderer } from 'electron';
import type { UserDataItem } from '../main/configManager';

const windowAPI = {
  setOpacity: (opacity: number) => ipcRenderer.send('set-opacity', opacity),
  toggleClickThrough: () => ipcRenderer.send('toggle-click-through'),
  hide: () => ipcRenderer.send('hide-window'),
  close: () => ipcRenderer.send('close-window'),
  getInitialState: () => ipcRenderer.invoke('get-initial-state'),
  onOpacityUpdated: (callback: (opacity: number) => void): (() => void) => {
    ipcRenderer.removeAllListeners('opacity-updated');
    ipcRenderer.on('opacity-updated', (_event, opacity) => callback(opacity as number));
    return () => ipcRenderer.removeAllListeners('opacity-updated');
  },
  onClickThroughUpdated: (callback: (isEnabled: boolean) => void): (() => void) => {
    ipcRenderer.removeAllListeners('click-through-updated');
    ipcRenderer.on('click-through-updated', (_event, isEnabled) => callback(isEnabled as boolean));
    return () => ipcRenderer.removeAllListeners('click-through-updated');
  }
};

const settingsAPI = {
  getAutoStart: () => ipcRenderer.invoke('get-auto-start'),
  setAutoStart: (enable: boolean) => ipcRenderer.invoke('set-auto-start', enable),
  getStartupConfig: () => ipcRenderer.invoke('get-startup-config'),
  setStartupPage: (pageType: string) => ipcRenderer.invoke('set-startup-page', pageType),
  setCustomStartupUrl: (url: string) => ipcRenderer.invoke('set-custom-startup-url', url),
  setCloseStrategy: (strategy: string) => ipcRenderer.invoke('set-close-strategy', strategy),
  setRememberWindowBounds: (remember: boolean) =>
    ipcRenderer.invoke('set-remember-window-bounds', remember)
};

const userDataAPI = {
  get: () => ipcRenderer.invoke('get-user-data'),
  saveFavorite: (item: UserDataItem) => ipcRenderer.invoke('save-favorite', item),
  removeFavorite: (url: string) => ipcRenderer.invoke('remove-favorite', url),
  addHistory: (item: UserDataItem) => ipcRenderer.send('add-history', item),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  saveLastUrl: (url: string) => ipcRenderer.send('save-last-url', url)
};

const navigationAPI = {
  loadUrl: (url: string) => ipcRenderer.send('load-url', url),
  onNavigateUrl: (callback: (url: string) => void): (() => void) => {
    ipcRenderer.removeAllListeners('navigate-url');
    ipcRenderer.on('navigate-url', (_event, url) => callback(url as string));
    return () => ipcRenderer.removeAllListeners('navigate-url');
  }
};

const i18nAPI = {
  getData: () => ipcRenderer.invoke('get-i18n-data'),
  setLocale: (locale: string) => ipcRenderer.invoke('set-locale', locale)
};

const dockAPI = {
  getItems: () => ipcRenderer.invoke('get-dock-items'),
  addItem: (item: { title: string; url: string }) => ipcRenderer.invoke('add-dock-item', item),
  removeItem: (id: string) => ipcRenderer.invoke('remove-dock-item', id),
  reorderItems: (orderedIds: string[]) => ipcRenderer.invoke('reorder-dock-items', orderedIds)
};

contextBridge.exposeInMainWorld('wingman', {
  window: windowAPI,
  settings: settingsAPI,
  userData: userDataAPI,
  navigation: navigationAPI,
  i18n: i18nAPI,
  dock: dockAPI,

  // 向后兼容：保留旧的扁平接口，逐步迁移后可移除
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
