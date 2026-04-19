// 全局快捷键管理模块

import { globalShortcut, app } from 'electron';
import { SHORTCUTS } from '../common/constants';
import * as windowManager from './windowManager';
import * as i18n from './i18n';

function registerAll(): void {
  const toggleThrough = globalShortcut.register(SHORTCUTS.TOGGLE_CLICK_THROUGH, () => {
    windowManager.toggleIgnoreMouse();
  });
  if (!toggleThrough) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.TOGGLE_CLICK_THROUGH }));
  }

  const increaseOp = globalShortcut.register(SHORTCUTS.INCREASE_OPACITY, () => {
    windowManager.increaseOpacity();
  });
  if (!increaseOp) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.INCREASE_OPACITY }));
  }

  const decreaseOp = globalShortcut.register(SHORTCUTS.DECREASE_OPACITY, () => {
    windowManager.decreaseOpacity();
  });
  if (!decreaseOp) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.DECREASE_OPACITY }));
  }

  const toggleWin = globalShortcut.register(SHORTCUTS.TOGGLE_WINDOW, () => {
    windowManager.toggleWindow();
  });
  if (!toggleWin) {
    console.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.TOGGLE_WINDOW }));
  }

  console.log(i18n.t('shortcut.allRegistered'));
}

function unregisterAll(): void {
  globalShortcut.unregisterAll();
  console.log(i18n.t('shortcut.allUnregistered'));
}

export function init(): void {
  registerAll();
  app.on('will-quit', unregisterAll);
}
