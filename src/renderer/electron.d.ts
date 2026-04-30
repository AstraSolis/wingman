// window.wingman 全局类型声明（无 import/export，作为全局脚本）

interface ElectronWebviewElement extends HTMLElement {
  src: string;
  reload(): void;
  getTitle(): string;
  getWebContentsId(): number;
  executeJavaScript(code: string): Promise<unknown>;
}

interface WingmanWindowState {
  opacity: number;
  isClickThrough: boolean;
  lastUrl: string;
}

interface WingmanStartupConfig {
  startupPage: string;
  customStartupUrl: string;
  closeStrategy: string;
  rememberWindowBounds: boolean;
}

interface WingmanI18nData {
  locale: string;
  translations: Record<string, unknown>;
  fallback: Record<string, unknown>;
}

interface WingmanUserDataItem {
  title: string;
  url: string;
  timestamp?: number;
}

interface WingmanUserData {
  favorites: WingmanUserDataItem[];
  history: WingmanUserDataItem[];
}

interface WingmanDockItem {
  id: string;
  title: string;
  url: string;
}

interface WingmanDockAPI {
  getItems: () => Promise<WingmanDockItem[]>;
  addItem: (item: { title: string; url: string }) => Promise<WingmanDockItem[]>;
  removeItem: (id: string) => Promise<WingmanDockItem[]>;
  reorderItems: (orderedIds: string[]) => Promise<WingmanDockItem[]>;
  updateItem: (item: { id: string; title: string; url: string }) => Promise<WingmanDockItem[]>;
}

interface WingmanWebviewContextParams {
  x: number;
  y: number;
  selectionText: string;
  linkURL: string;
  isEditable: boolean;
  canCopy: boolean;
  canCut: boolean;
  canPaste: boolean;
  currentURL: string;
  currentTitle: string;
  webContentsId: number;
}

interface WingmanWebviewAPI {
  onContextMenu: (callback: (params: WingmanWebviewContextParams) => void) => () => void;
  execAction: (action: 'cut' | 'copy' | 'paste', webContentsId?: number) => void;
  setBackgroundThrottle: (webContentsId: number, throttle: boolean) => void;
}

interface WingmanWindowAPI {
  setOpacity: (opacity: number) => void;
  toggleClickThrough: () => void;
  hide: () => void;
  close: () => void;
  getInitialState: () => Promise<WingmanWindowState>;
  onOpacityUpdated: (callback: (opacity: number) => void) => () => void;
  onClickThroughUpdated: (callback: (isEnabled: boolean) => void) => () => void;
}

interface WingmanSettingsAPI {
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enable: boolean) => Promise<boolean>;
  getStartupConfig: () => Promise<WingmanStartupConfig>;
  setStartupPage: (pageType: string) => Promise<string>;
  setCustomStartupUrl: (url: string) => Promise<string>;
  setCloseStrategy: (strategy: string) => Promise<string>;
  setRememberWindowBounds: (remember: boolean) => Promise<boolean>;
}

interface WingmanShortcuts {
  TOGGLE_CLICK_THROUGH: string;
  INCREASE_OPACITY: string;
  DECREASE_OPACITY: string;
  TOGGLE_WINDOW: string;
}

interface WingmanShortcutsAPI {
  getAll: () => Promise<WingmanShortcuts>;
  set: (action: string, accelerator: string) => Promise<WingmanShortcuts>;
  reset: (action: string) => Promise<WingmanShortcuts>;
}

interface WingmanLocalShortcuts {
  RELOAD_PAGE: string;
  GO_HOME: string;
  FOCUS_ADDRESS_BAR: string;
  COPY_URL: string;
  TOGGLE_FAVORITE: string;
  NEW_TAB: string;
  CLOSE_TAB: string;
  NEXT_TAB: string;
  PREV_TAB: string;
  OPEN_FAVORITES: string;
  OPEN_HISTORY: string;
  OPEN_SETTINGS: string;
}

interface WingmanLocalShortcutsAPI {
  getAll: () => Promise<WingmanLocalShortcuts>;
  set: (action: string, accelerator: string) => Promise<WingmanLocalShortcuts>;
  reset: (action: string) => Promise<WingmanLocalShortcuts>;
  onShortcutFired: (callback: (action: string) => void) => () => void;
}

interface WingmanUserDataAPI {
  get: () => Promise<WingmanUserData>;
  saveFavorite: (item: WingmanUserDataItem) => Promise<WingmanUserDataItem[]>;
  removeFavorite: (url: string) => Promise<WingmanUserDataItem[]>;
  addHistory: (item: WingmanUserDataItem) => void;
  clearHistory: () => Promise<WingmanUserDataItem[]>;
  saveLastUrl: (url: string) => void;
}

interface WingmanNavigationAPI {
  loadUrl: (url: string) => void;
  onNavigateUrl: (callback: (url: string) => void) => () => void;
}

interface WingmanI18nAPI {
  getData: () => Promise<WingmanI18nData>;
  setLocale: (locale: string) => Promise<WingmanI18nData>;
}

interface WingmanAPI {
  window: WingmanWindowAPI;
  settings: WingmanSettingsAPI;
  shortcuts: WingmanShortcutsAPI;
  localShortcuts: WingmanLocalShortcutsAPI;
  userData: WingmanUserDataAPI;
  navigation: WingmanNavigationAPI;
  i18n: WingmanI18nAPI;
  dock: WingmanDockAPI;
  webview: WingmanWebviewAPI;
  /** 将日志转发至主进程落文件 */
  log: (
    level: 'error' | 'warn' | 'info' | 'debug',
    scope: string,
    message: string,
    ...args: unknown[]
  ) => void;
  // 向后兼容扁平接口
  setOpacity: (opacity: number) => void;
  toggleClickThrough: () => void;
  hideWindow: () => void;
  closeWindow: () => void;
  getInitialState: () => Promise<WingmanWindowState>;
  onOpacityUpdated: (callback: (opacity: number) => void) => () => void;
  onClickThroughUpdated: (callback: (isEnabled: boolean) => void) => () => void;
  loadUrl: (url: string) => void;
  onNavigateUrl: (callback: (url: string) => void) => () => void;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enable: boolean) => Promise<boolean>;
  getStartupConfig: () => Promise<WingmanStartupConfig>;
  setStartupPage: (pageType: string) => Promise<string>;
  setCustomStartupUrl: (url: string) => Promise<string>;
  setCloseStrategy: (strategy: string) => Promise<string>;
  setRememberWindowBounds: (remember: boolean) => Promise<boolean>;
  getUserData: () => Promise<WingmanUserData>;
  saveFavorite: (item: WingmanUserDataItem) => Promise<WingmanUserDataItem[]>;
  removeFavorite: (url: string) => Promise<WingmanUserDataItem[]>;
  addHistory: (item: WingmanUserDataItem) => void;
  clearHistory: () => Promise<WingmanUserDataItem[]>;
  saveLastUrl: (url: string) => void;
  getI18nData: () => Promise<WingmanI18nData>;
  setLocale: (locale: string) => Promise<WingmanI18nData>;
}

interface Window {
  wingman: WingmanAPI;
}

declare namespace JSX {
  interface IntrinsicElements {
    webview: {
      ref?: import('react').Ref<ElectronWebviewElement>;
      src?: string;
      allowpopups?: boolean;
      style?: import('react').CSSProperties;
      className?: string;
    };
  }
}
