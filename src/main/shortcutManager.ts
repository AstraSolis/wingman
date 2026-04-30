// 全局快捷键管理模块

import { globalShortcut, app } from 'electron';
import { SHORTCUTS, LOCAL_SHORTCUTS, IPC_CHANNELS } from '../common/constants';
import * as windowManager from './windowManager';
import * as configManager from './configManager';
import * as i18n from './i18n';
import { createLogger } from './logger';

const logger = createLogger('ShortcutManager');

type ShortcutAction = keyof typeof SHORTCUTS;

// 标签页相关操作通过 globalShortcut + IPC relay 到渲染进程，以便 webview 内也可触发
const TAB_GLOBAL_ACTIONS: ReadonlyArray<keyof typeof LOCAL_SHORTCUTS> = [
  'NEW_TAB', 'CLOSE_TAB', 'NEXT_TAB', 'PREV_TAB'
];

const ACTION_HANDLERS: Record<ShortcutAction, () => void> = {
  TOGGLE_CLICK_THROUGH: () => windowManager.toggleIgnoreMouse(),
  INCREASE_OPACITY: () => windowManager.increaseOpacity(),
  DECREASE_OPACITY: () => windowManager.decreaseOpacity(),
  TOGGLE_WINDOW: () => windowManager.toggleWindow()
};

function getEffectiveShortcut(action: ShortcutAction): string {
  const custom = configManager.get('customShortcuts');
  return custom[action] || SHORTCUTS[action];
}

function getEffectiveLocalShortcut(action: string): string {
  const custom = configManager.get('customLocalShortcuts');
  return custom[action] || (LOCAL_SHORTCUTS as Record<string, string>)[action];
}

function registerAll(): void {
  const actions = Object.keys(ACTION_HANDLERS) as ShortcutAction[];
  for (const action of actions) {
    const key = getEffectiveShortcut(action);
    const ok = globalShortcut.register(key, ACTION_HANDLERS[action]);
    if (!ok) {
      logger.error(i18n.t('shortcut.registerFailed', { key }));
    }
  }

  for (const action of TAB_GLOBAL_ACTIONS) {
    const key = getEffectiveLocalShortcut(action);
    const ok = globalShortcut.register(key, () => {
      const win = windowManager.getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.LOCAL_SHORTCUT_FIRED, action);
      }
    });
    if (!ok) {
      logger.error(i18n.t('shortcut.registerFailed', { key }));
    }
  }

  logger.info(i18n.t('shortcut.allRegistered'));
}

function unregisterAll(): void {
  globalShortcut.unregisterAll();
  logger.info(i18n.t('shortcut.allUnregistered'));
}

export function reload(): void {
  globalShortcut.unregisterAll();
  registerAll();
}

export function getEffectiveShortcuts(): Record<ShortcutAction, string> {
  return Object.fromEntries(
    (Object.keys(ACTION_HANDLERS) as ShortcutAction[]).map((action) => [action, getEffectiveShortcut(action)])
  ) as Record<ShortcutAction, string>;
}

export function init(): void {
  registerAll();
  app.on('will-quit', unregisterAll);
}
