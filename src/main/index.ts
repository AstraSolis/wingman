// 主进程入口

import { app } from 'electron';
import * as i18n from './i18n';
import * as windowManager from './windowManager';
import * as shortcutManager from './shortcutManager';
import * as trayManager from './trayManager';
import * as ipcHandlers from './ipcHandlers';
import * as configManager from './configManager';
import { initLogger, createLogger } from './logger';

app.whenReady().then(() => {
  initLogger();
  const logger = createLogger('App');
  configManager.init();
  i18n.init(configManager.get('locale'));
  windowManager.createWindow();
  shortcutManager.init();
  trayManager.createTray();
  ipcHandlers.setup();
  logger.info(i18n.t('app.started'));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!windowManager.getWindow()) {
    windowManager.createWindow();
  }
});

app.on('before-quit', () => {
  configManager.flush();
});
