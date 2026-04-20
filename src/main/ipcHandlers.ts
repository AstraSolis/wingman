// IPC 消息处理模块

import { app, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../common/constants';
import * as windowManager from './windowManager';
import * as i18n from './i18n';
import * as trayManager from './trayManager';
import * as configManager from './configManager';
import type { UserDataItem, DockItem } from './configManager';

const AUTO_START_SUPPORTED_PLATFORMS = new Set(['win32', 'darwin']);

function isAutoStartSupported(): boolean {
  return AUTO_START_SUPPORTED_PLATFORMS.has(process.platform);
}

function getAutoStartState(): boolean {
  if (!isAutoStartSupported()) return false;
  return app.getLoginItemSettings().openAtLogin;
}

export function setup(): void {
  ipcMain.on(IPC_CHANNELS.SET_OPACITY, (_event, opacity: number) => {
    windowManager.setWindowOpacity(opacity);
  });

  ipcMain.on(IPC_CHANNELS.TOGGLE_CLICK_THROUGH, () => {
    windowManager.toggleIgnoreMouse();
  });

  ipcMain.on(IPC_CHANNELS.HIDE_WINDOW, () => {
    windowManager.hideWindow();
  });

  ipcMain.on(IPC_CHANNELS.LOAD_URL, (_event, url: string) => {
    const win = windowManager.getWindow();
    if (win) {
      win.webContents.send(IPC_CHANNELS.NAVIGATE_URL, url);
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_INITIAL_STATE, () => {
    return {
      opacity: windowManager.getCurrentOpacity(),
      isClickThrough: windowManager.isClickThroughEnabled(),
      lastUrl: configManager.get('lastUrl')
    };
  });

  ipcMain.handle(IPC_CHANNELS.GET_I18N_DATA, () => {
    return i18n.getAllTranslations();
  });

  ipcMain.handle(IPC_CHANNELS.SET_LOCALE, (_event, locale: string) => {
    i18n.setLocale(locale);
    trayManager.updateContextMenu();
    return i18n.getAllTranslations();
  });

  ipcMain.handle(IPC_CHANNELS.GET_AUTO_START, () => {
    return getAutoStartState();
  });

  ipcMain.handle(IPC_CHANNELS.SET_AUTO_START, (_event, enable: boolean) => {
    if (!isAutoStartSupported()) return false;
    app.setLoginItemSettings({ openAtLogin: enable, path: process.execPath });
    return getAutoStartState();
  });

  ipcMain.on(IPC_CHANNELS.SAVE_LAST_URL, (_event, url: string) => {
    configManager.set('lastUrl', url);
  });

  ipcMain.handle(IPC_CHANNELS.GET_USER_DATA, () => {
    return {
      favorites: configManager.get('favorites'),
      history: configManager.get('history')
    };
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_FAVORITE, (_event, item: UserDataItem) => {
    const favorites = [...configManager.get('favorites')];
    const exists = favorites.some((f) => f.url === item.url);
    if (!exists) {
      favorites.push(item);
      configManager.set('favorites', favorites);
    }
    return favorites;
  });

  ipcMain.handle(IPC_CHANNELS.REMOVE_FAVORITE, (_event, url: string) => {
    const favorites = configManager.get('favorites').filter((f) => f.url !== url);
    configManager.set('favorites', favorites);
    return favorites;
  });

  ipcMain.on(IPC_CHANNELS.ADD_HISTORY, (_event, item: UserDataItem) => {
    let history = [...configManager.get('history')];
    history = history.filter((h) => h.url !== item.url);
    history.unshift({ ...item, timestamp: Date.now() });
    if (history.length > 100) {
      history = history.slice(0, 100);
    }
    configManager.set('history', history);
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () => {
    configManager.set('history', []);
    return [];
  });

  ipcMain.handle(IPC_CHANNELS.GET_STARTUP_CONFIG, () => {
    return {
      startupPage: configManager.get('startupPage'),
      customStartupUrl: configManager.get('customStartupUrl'),
      closeStrategy: configManager.get('closeStrategy'),
      rememberWindowBounds: configManager.get('rememberWindowBounds')
    };
  });

  ipcMain.handle(IPC_CHANNELS.SET_STARTUP_PAGE, (_event, pageType: string) => {
    configManager.set('startupPage', pageType);
    return pageType;
  });

  ipcMain.handle(IPC_CHANNELS.SET_CUSTOM_STARTUP_URL, (_event, url: string) => {
    configManager.set('customStartupUrl', url);
    return url;
  });

  ipcMain.handle(IPC_CHANNELS.SET_CLOSE_STRATEGY, (_event, strategy: string) => {
    configManager.set('closeStrategy', strategy);
    return strategy;
  });

  ipcMain.handle(IPC_CHANNELS.SET_REMEMBER_WINDOW_BOUNDS, (_event, remember: boolean) => {
    configManager.set('rememberWindowBounds', remember);
    return remember;
  });

  ipcMain.handle(IPC_CHANNELS.GET_DOCK_ITEMS, () => {
    return configManager.get('dockItems');
  });

  ipcMain.handle(
    IPC_CHANNELS.ADD_DOCK_ITEM,
    (_event, item: { title: string; url: string }) => {
      const items = [...configManager.get('dockItems')];
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      items.push({ id, title: item.title, url: item.url });
      configManager.set('dockItems', items);
      return items;
    }
  );

  ipcMain.handle(IPC_CHANNELS.REMOVE_DOCK_ITEM, (_event, id: string) => {
    const items = configManager.get('dockItems').filter((item: DockItem) => item.id !== id);
    configManager.set('dockItems', items);
    return items;
  });

  ipcMain.handle(IPC_CHANNELS.REORDER_DOCK_ITEMS, (_event, orderedIds: string[]) => {
    const current = configManager.get('dockItems');
    const map = new Map(current.map((item: DockItem) => [item.id, item]));
    const reordered = orderedIds
      .map((id) => map.get(id))
      .filter((item): item is DockItem => item !== undefined);
    configManager.set('dockItems', reordered);
    return reordered;
  });

  ipcMain.on(IPC_CHANNELS.CLOSE_WINDOW, () => {
    const strategy = configManager.get('closeStrategy');
    if (strategy === 'quit') {
      app.quit();
    } else {
      windowManager.hideWindow();
    }
  });

  console.log(i18n.t('ipc.ready'));
}
