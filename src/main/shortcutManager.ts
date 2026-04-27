// 全局快捷键管理模块

import { globalShortcut, app } from 'electron';
import { SHORTCUTS } from '../common/constants';
import * as windowManager from './windowManager';
import * as i18n from './i18n';
import { createLogger } from './logger';

const logger = createLogger('ShortcutManager');

function registerAll(): void {
  const toggleThrough = globalShortcut.register(SHORTCUTS.TOGGLE_CLICK_THROUGH, () => {
    windowManager.toggleIgnoreMouse();
  });
  if (!toggleThrough) {
    logger.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.TOGGLE_CLICK_THROUGH }));
  }

  const increaseOp = globalShortcut.register(SHORTCUTS.INCREASE_OPACITY, () => {
    windowManager.increaseOpacity();
  });
  if (!increaseOp) {
    logger.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.INCREASE_OPACITY }));
  }

  const decreaseOp = globalShortcut.register(SHORTCUTS.DECREASE_OPACITY, () => {
    windowManager.decreaseOpacity();
  });
  if (!decreaseOp) {
    logger.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.DECREASE_OPACITY }));
  }

  const toggleWin = globalShortcut.register(SHORTCUTS.TOGGLE_WINDOW, () => {
    windowManager.toggleWindow();
  });
  if (!toggleWin) {
    logger.error(i18n.t('shortcut.registerFailed', { key: SHORTCUTS.TOGGLE_WINDOW }));
  }

  logger.info(i18n.t('shortcut.allRegistered'));
}

function unregisterAll(): void {
  globalShortcut.unregisterAll();
  logger.info(i18n.t('shortcut.allUnregistered'));
}

export function init(): void {
  registerAll();
  app.on('will-quit', unregisterAll);
}
