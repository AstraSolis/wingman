// 系统托盘管理模块
// 创建托盘图标和右键菜单

const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const windowManager = require('./windowManager');
const i18n = require('./i18n');

let tray = null;

/**
 * 创建系统托盘
 */
function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');

  // 创建 nativeImage 并调整大小适配托盘
  let trayIcon = nativeImage.createFromPath(iconPath);
  trayIcon = trayIcon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip(i18n.t('tray.tooltip'));

  updateContextMenu();

  // 左键单击托盘图标切换显示/隐藏
  tray.on('click', () => {
    windowManager.toggleWindow();
  });

  return tray;
}

/**
 * 更新托盘右键菜单（语言切换后需要重建）
 */
function updateContextMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: i18n.t('tray.toggleWindow'),
      click: () => {
        windowManager.toggleWindow();
      }
    },
    { type: 'separator' },
    {
      label: i18n.t('tray.quit'),
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(i18n.t('tray.tooltip'));
}

/**
 * 获取托盘实例
 */
function getTray() {
  return tray;
}

module.exports = {
  createTray,
  updateContextMenu,
  getTray
};
