// 共享配置常量
// 主进程和渲染进程共同使用的配置项

module.exports = {
  // i18n 配置
  DEFAULT_LOCALE: 'zh-CN',
  SUPPORTED_LOCALES: ['zh-CN', 'en-US'],

  // 默认攻略网站
  DEFAULT_URL: 'https://www.bilibili.com',

  // 透明度配置
  DEFAULT_OPACITY: 0.85,
  MIN_OPACITY: 0.3,
  MAX_OPACITY: 1.0,
  OPACITY_STEP: 0.05,

  // 窗口配置
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,

  // 全局快捷键定义
  SHORTCUTS: {
    TOGGLE_CLICK_THROUGH: 'Ctrl+Shift+T',
    INCREASE_OPACITY: 'Ctrl+Shift+Up',
    DECREASE_OPACITY: 'Ctrl+Shift+Down',
    TOGGLE_WINDOW: 'Ctrl+Shift+H'
  },

  // IPC 通道名称
  IPC_CHANNELS: {
    SET_OPACITY: 'set-opacity',
    TOGGLE_CLICK_THROUGH: 'toggle-click-through',
    LOAD_URL: 'load-url',
    HIDE_WINDOW: 'hide-window',
    OPACITY_UPDATED: 'opacity-updated',
    CLICK_THROUGH_UPDATED: 'click-through-updated',
    GET_INITIAL_STATE: 'get-initial-state',
    GET_I18N_DATA: 'get-i18n-data',
    SET_LOCALE: 'set-locale',
    NAVIGATE_URL: 'navigate-url'
  }
};
