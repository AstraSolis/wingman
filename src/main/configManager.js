// 配置管理模块
// 负责使用原生 fs 实现简单、轻量且可靠的本地配置持久化存储

const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { DEFAULT_LOCALE, DEFAULT_OPACITY, DEFAULT_URL } = require('../common/constants');

// 默认配置
const DEFAULT_CONFIG = {
  locale: DEFAULT_LOCALE,
  opacity: DEFAULT_OPACITY,
  isClickThrough: false,
  lastUrl: DEFAULT_URL
};

let configPath = '';
let currentConfig = { ...DEFAULT_CONFIG };
let saveTimeout = null;

/**
 * 立即保存配置到磁盘（忽略防抖延迟）
 */
function flush() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  try {
    const tempPath = configPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
    fs.renameSync(tempPath, configPath);
  } catch (error) {
    console.error('[ConfigManager] Failed to save config:', error);
  }
}

/**
 * 节流保存配置到磁盘
 * 避免频繁触发写操作
 */
function debounceSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    flush();
  }, 1000); // 1秒 debounce
}

/**
 * 初始化配置管理器
 */
function init() {
  const userDataPath = app.getPath('userData');
  configPath = path.join(userDataPath, 'config.json');

  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(data);
      currentConfig = { ...DEFAULT_CONFIG, ...parsedConfig };
    } else {
      // 首次启动，没有配置文件
      currentConfig = { ...DEFAULT_CONFIG };
      debounceSave();
    }
  } catch (error) {
    console.error('[ConfigManager] Failed to read config, using defaults.', error);
    currentConfig = { ...DEFAULT_CONFIG };
  }
}

/**
 * 获取某个配置项
 * @param {string} key
 */
function get(key) {
  return currentConfig[key];
}

/**
 * 设置某个配置项并异步持久化
 * @param {string} key
 * @param {any} value
 */
function set(key, value) {
  if (currentConfig[key] !== value) {
    currentConfig[key] = value;
    debounceSave();
  }
}

/**
 * 获取完整配置
 */
function getAll() {
  return { ...currentConfig };
}

module.exports = {
  init,
  get,
  set,
  getAll,
  flush
};
