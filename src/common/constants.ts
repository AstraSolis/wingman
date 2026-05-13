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

export const LOCAL_SHORTCUTS = {
  RELOAD_PAGE: 'CommandOrControl+R',
  GO_HOME: 'Alt+Home',
  FOCUS_ADDRESS_BAR: 'CommandOrControl+L',
  COPY_URL: 'CommandOrControl+Shift+C',
  TOGGLE_FAVORITE: 'CommandOrControl+D',
  NEW_TAB: 'CommandOrControl+T',
  CLOSE_TAB: 'CommandOrControl+W',
  NEXT_TAB: 'CommandOrControl+Tab',
  PREV_TAB: 'CommandOrControl+Shift+Tab',
  OPEN_FAVORITES: 'CommandOrControl+Shift+B',
  OPEN_HISTORY: 'CommandOrControl+H',
  OPEN_SETTINGS: 'CommandOrControl+,',
  MEDIA_PLAY_PAUSE: 'CommandOrControl+Alt+P',
  MEDIA_PREV_TRACK: 'CommandOrControl+Alt+Shift+Left',
  MEDIA_NEXT_TRACK: 'CommandOrControl+Alt+Shift+Right',
  MEDIA_SEEK_BACKWARD: 'CommandOrControl+Alt+Shift+Down',
  MEDIA_SEEK_FORWARD: 'CommandOrControl+Alt+Shift+Up',
  MEDIA_VOLUME_DOWN: 'CommandOrControl+Alt+[',
  MEDIA_VOLUME_UP: 'CommandOrControl+Alt+]',
  MEDIA_MUTE: 'CommandOrControl+Alt+M',
  FIND_IN_PAGE: 'CommandOrControl+F'
} as const;

// 通过 globalShortcut + IPC relay 触发的标签页动作，在 webview 内也能响应
// keydown handler 中须跳过这些动作，避免窗口有焦点时双重触发
export const TAB_RELAY_ACTIONS: ReadonlySet<keyof typeof LOCAL_SHORTCUTS> = new Set([
  'NEW_TAB', 'CLOSE_TAB', 'NEXT_TAB', 'PREV_TAB',
  'MEDIA_PLAY_PAUSE', 'MEDIA_NEXT_TRACK', 'MEDIA_PREV_TRACK', 'MEDIA_MUTE',
  'MEDIA_SEEK_FORWARD', 'MEDIA_SEEK_BACKWARD', 'MEDIA_VOLUME_UP', 'MEDIA_VOLUME_DOWN',
  'FIND_IN_PAGE'
]);

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

export const SEARCH_ENGINES = {
  BING: 'bing',
  GOOGLE: 'google',
  BAIDU: 'baidu',
  CUSTOM: 'custom'
} as const;

export const DEFAULT_SEARCH_ENGINE = SEARCH_ENGINES.BING;
export const DEFAULT_CUSTOM_SEARCH_URL = 'https://www.bing.com/search?q={query}';

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
  REORDER_DOCK_ITEMS: 'reorder-dock-items',
  UPDATE_DOCK_ITEM: 'update-dock-item',
  WEBVIEW_CONTEXT_MENU: 'webview-context-menu',
  WEBVIEW_EXEC_ACTION: 'webview-exec-action',
  WEBVIEW_SET_BACKGROUND_THROTTLE: 'webview-set-background-throttle',
  LOG_FROM_RENDERER: 'log-from-renderer',
  GET_SHORTCUTS: 'get-shortcuts',
  SET_SHORTCUT: 'set-shortcut',
  RESET_SHORTCUT: 'reset-shortcut',
  GET_LOCAL_SHORTCUTS: 'get-local-shortcuts',
  SET_LOCAL_SHORTCUT: 'set-local-shortcut',
  RESET_LOCAL_SHORTCUT: 'reset-local-shortcut',
  LOCAL_SHORTCUT_FIRED: 'local-shortcut-fired',
  SET_SEARCH_ENGINE: 'set-search-engine',
  SET_CUSTOM_SEARCH_URL: 'set-custom-search-url',
  OPEN_EXTERNAL: 'open-external',
  GET_APP_VERSION: 'get-app-version',
  GET_WINDOW_LIST: 'get-window-list',
  SET_BOUND_WINDOWS: 'set-bound-windows',
  GET_BOUND_WINDOWS: 'get-bound-windows',
  FIND_IN_PAGE: 'find-in-page',
  STOP_FIND_IN_PAGE: 'stop-find-in-page',
  FIND_IN_PAGE_RESULT: 'find-in-page-result'
} as const;
