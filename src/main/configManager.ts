// 配置管理模块

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { app } from 'electron';
import {
  DEFAULT_LOCALE,
  DEFAULT_OPACITY,
  DEFAULT_URL,
  STARTUP_PAGE_TYPES,
  CLOSE_STRATEGIES
} from '../common/constants';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UserDataItem {
  title: string;
  url: string;
  timestamp?: number;
}

export interface DockItem {
  id: string;
  title: string;
  url: string;
}

export interface AppConfig {
  locale: string;
  opacity: number;
  isClickThrough: boolean;
  lastUrl: string;
  favorites: UserDataItem[];
  history: UserDataItem[];
  dockItems: DockItem[];
  startupPage: string;
  customStartupUrl: string;
  closeStrategy: string;
  rememberWindowBounds: boolean;
  windowBounds: WindowBounds | null;
}

const DEFAULT_CONFIG: AppConfig = {
  locale: DEFAULT_LOCALE,
  opacity: DEFAULT_OPACITY,
  isClickThrough: false,
  lastUrl: DEFAULT_URL,
  favorites: [],
  history: [],
  dockItems: [],
  startupPage: STARTUP_PAGE_TYPES.LAST_PAGE,
  customStartupUrl: '',
  closeStrategy: CLOSE_STRATEGIES.MINIMIZE,
  rememberWindowBounds: true,
  windowBounds: null
};

let configPath = '';
let currentConfig: AppConfig = { ...DEFAULT_CONFIG };
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function flush(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  try {
    const tempPath = configPath + '.tmp';
    writeFileSync(tempPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
    renameSync(tempPath, configPath);
  } catch (error) {
    console.error('[ConfigManager] Failed to save config:', error);
  }
}

function debounceSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    flush();
  }, 1000);
}

export function init(): void {
  const userDataPath = app.getPath('userData');
  configPath = join(userDataPath, 'config.json');

  try {
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(data) as Partial<AppConfig>;
      currentConfig = { ...DEFAULT_CONFIG, ...parsedConfig };
    } else {
      currentConfig = { ...DEFAULT_CONFIG };
      debounceSave();
    }
  } catch (error) {
    console.error('[ConfigManager] Failed to read config, using defaults.', error);
    currentConfig = { ...DEFAULT_CONFIG };
  }
}

export function get<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return currentConfig[key];
}

export function set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
  if (typeof value === 'object' || currentConfig[key] !== value) {
    currentConfig[key] = value;
    debounceSave();
  }
}

export function getAll(): AppConfig {
  return { ...currentConfig };
}
