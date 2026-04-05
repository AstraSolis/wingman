// 全局快捷键管理模块
// 注册和管理所有全局快捷键

const { globalShortcut, app } = require('electron');
const { SHORTCUTS } = require('../common/constants');
const windowManager = require('./windowManager');
const i18n = require('./i18n');

/**
 * 注册所有全局快捷键
 */
function registerAll() {
  // 切换点击穿透
  const toggleThrough = globalShortcut.register(SHORTCUTS.TOGGLE_CLICK_THROUGH, () => {
    windowManager.toggleIgnoreMouse();
  });
  if (!toggleThrough) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.TOGGLE_CLICK_THROUGH }));
  }

  // 增加透明度（更不透明）
  const increaseOp = globalShortcut.register(SHORTCUTS.INCREASE_OPACITY, () => {
    windowManager.increaseOpacity();
  });
  if (!increaseOp) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.INCREASE_OPACITY }));
  }

  // 减少透明度（更透明）
  const decreaseOp = globalShortcut.register(SHORTCUTS.DECREASE_OPACITY, () => {
    windowManager.decreaseOpacity();
  });
  if (!decreaseOp) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.DECREASE_OPACITY }));
  }

  // 隐藏/显示窗口
  const toggleWin = globalShortcut.register(SHORTCUTS.TOGGLE_WINDOW, () => {
    windowManager.toggleWindow();
  });
  if (!toggleWin) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.TOGGLE_WINDOW }));
  }

  console.log(i18n.t('shortcut.allRegistered'));
}

/**
 * 注销所有全局快捷键
 * 在 app.will-quit 时调用
 */
function unregisterAll() {
  globalShortcut.unregisterAll();
  console.log(i18n.t('shortcut.allUnregistered'));
}

/**
 * 初始化快捷键管理（注册快捷键 + 绑定退出事件）
 */
function init() {
  registerAll();
  app.on('will-quit', unregisterAll);
}

module.exports = {
  init,
  registerAll,
  unregisterAll
};
