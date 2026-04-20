// 共享配置常量（主进程与渲染进程共用）

export const DEFAULT_LOCALE = 'zh-CN';
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const;

export const DEFAULT_URL = '';

export const DEFAULT_OPACITY = 0.85;
export const MIN_OPACITY = 0.3;
export const MAX_OPACITY = 1.0;
export const OPACITY_STEP = 0.05;

export const DEFAULT_WIDTH = 800;
export const DEFAULT_HEIGHT = 600;

export const SHORTCUTS = {
  TOGGLE_CLICK_THROUGH: 'CommandOrControl+Shift+T',
  INCREASE_OPACITY: 'CommandOrControl+Shift+Up',
  DECREASE_OPACITY: 'CommandOrControl+Shift+Down',
  TOGGLE_WINDOW: 'CommandOrControl+Shift+H'
} as const;

export const STARTUP_PAGE_TYPES = {
  HOME: 'home',
  LAST_PAGE: 'lastPage',
  FAVORITES: 'favorites',
  CUSTOM_URL: 'customUrl'
} as const;

export const CLOSE_STRATEGIES = {
  QUIT: 'quit',
  MINIMIZE: 'minimize'
} as const;

export const IPC_CHANNELS = {
  SET_OPACITY: 'set-opacity',
  TOGGLE_CLICK_THROUGH: 'toggle-click-through',
  LOAD_URL: 'load-url',
  HIDE_WINDOW: 'hide-window',
  CLOSE_WINDOW: 'close-window',
  OPACITY_UPDATED: 'opacity-updated',
  CLICK_THROUGH_UPDATED: 'click-through-updated',
  GET_INITIAL_STATE: 'get-initial-state',
  GET_I18N_DATA: 'get-i18n-data',
  SET_LOCALE: 'set-locale',
  NAVIGATE_URL: 'navigate-url',
  GET_AUTO_START: 'get-auto-start',
  SET_AUTO_START: 'set-auto-start',
  SAVE_LAST_URL: 'save-last-url',
  GET_USER_DATA: 'get-user-data',
  SAVE_FAVORITE: 'save-favorite',
  REMOVE_FAVORITE: 'remove-favorite',
  ADD_HISTORY: 'add-history',
  CLEAR_HISTORY: 'clear-history',
  GET_STARTUP_CONFIG: 'get-startup-config',
  SET_STARTUP_PAGE: 'set-startup-page',
  SET_CUSTOM_STARTUP_URL: 'set-custom-startup-url',
  SET_CLOSE_STRATEGY: 'set-close-strategy',
  SET_REMEMBER_WINDOW_BOUNDS: 'set-remember-window-bounds',
  GET_DOCK_ITEMS: 'get-dock-items',
  ADD_DOCK_ITEM: 'add-dock-item',
  REMOVE_DOCK_ITEM: 'remove-dock-item',
  REORDER_DOCK_ITEMS: 'reorder-dock-items'
} as const;
