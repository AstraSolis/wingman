// 系统托盘管理模块

import { Tray, Menu, app, nativeImage } from 'electron';
import { join } from 'path';
import * as windowManager from './windowManager';
import * as i18n from './i18n';

let tray: Tray | null = null;

export function createTray(): Tray {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'icon.png')
    : join(app.getAppPath(), 'src', 'assets', 'icon.png');

  let trayIcon = nativeImage.createFromPath(iconPath);
  trayIcon = trayIcon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip(i18n.t('tray.tooltip'));

  updateContextMenu();

  tray.on('click', () => {
    windowManager.toggleWindow();
  });

  return tray;
}

export function updateContextMenu(): void {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: i18n.t('tray.toggleWindow'),
      click: () => windowManager.toggleWindow()
    },
    { type: 'separator' },
    {
      label: i18n.t('tray.quit'),
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(i18n.t('tray.tooltip'));
}

export function getTray(): Tray | null {
  return tray;
}
