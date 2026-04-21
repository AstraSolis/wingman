// 窗口管理模块

import { BrowserWindow, screen } from 'electron';
import { join } from 'path';
import {
  DEFAULT_OPACITY,
  MIN_OPACITY,
  MAX_OPACITY,
  OPACITY_STEP,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  IPC_CHANNELS
} from '../common/constants';
import * as configManager from './configManager';

const FORWARD_CLICK_THROUGH_PLATFORMS = new Set(['win32', 'darwin']);

let mainWindow: BrowserWindow | null = null;
let currentOpacity = DEFAULT_OPACITY;
let isClickThrough = false;
let activeGuestContents: Electron.WebContents | null = null;

export function getGuestWebContents(): Electron.WebContents | null {
  return activeGuestContents;
}

function shouldForwardClickThrough(): boolean {
  return FORWARD_CLICK_THROUGH_PLATFORMS.has(process.platform);
}

function setClickThrough(enabled: boolean): void {
  if (!mainWindow) return;
  const options = shouldForwardClickThrough() ? { forward: true } : undefined;
  mainWindow.setIgnoreMouseEvents(enabled, options);
}

export function createWindow(): BrowserWindow {
  currentOpacity = configManager.get('opacity') ?? DEFAULT_OPACITY;
  isClickThrough = configManager.get('isClickThrough') ?? false;

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const rememberBounds = configManager.get('rememberWindowBounds');
  const savedBounds = configManager.get('windowBounds');

  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: Math.round((screenWidth - DEFAULT_WIDTH) / 2),
    y: Math.round((screenHeight - DEFAULT_HEIGHT) / 2),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: process.platform !== 'darwin',
    resizable: true,
    opacity: currentOpacity,
    hasShadow: process.platform === 'darwin',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  };

  if (rememberBounds && savedBounds) {
    windowOptions.x = savedBounds.x;
    windowOptions.y = savedBounds.y;
    windowOptions.width = savedBounds.width;
    windowOptions.height = savedBounds.height;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // 屏蔽 Windows 无框窗口在标题栏区域右键弹出的系统菜单
  mainWindow.on('system-context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.webContents.on('did-attach-webview', (_event, guestContents) => {
    guestContents.setWindowOpenHandler(({ url }) => {
      if (!url || !/^https?:\/\//i.test(url)) {
        return { action: 'deny' };
      }
      mainWindow?.webContents.send(IPC_CHANNELS.NAVIGATE_URL, url);
      return { action: 'deny' };
    });

    guestContents.on('context-menu', (_e, params) => {
      if (!mainWindow) return;
      mainWindow.webContents.send(IPC_CHANNELS.WEBVIEW_CONTEXT_MENU, {
        x: params.x,
        y: params.y,
        selectionText: params.selectionText ?? '',
        linkURL: params.linkURL ?? '',
        isEditable: params.isEditable,
        canCopy: params.editFlags.canCopy,
        canCut: params.editFlags.canCut,
        canPaste: params.editFlags.canPaste,
        currentURL: guestContents.getURL(),
        currentTitle: guestContents.getTitle()
      });
    });

    activeGuestContents = guestContents;
    guestContents.on('destroyed', () => {
      if (activeGuestContents === guestContents) activeGuestContents = null;
    });
  });

  if (process.env.NODE_ENV === 'development' && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  if (isClickThrough) {
    setClickThrough(true);
  }

  // 监听窗口移动和缩放事件，保存位置
  let boundsTimeout: ReturnType<typeof setTimeout> | null = null;
  const saveBounds = () => {
    if (boundsTimeout) clearTimeout(boundsTimeout);
    boundsTimeout = setTimeout(() => {
      if (!mainWindow) return;
      if (configManager.get('rememberWindowBounds')) {
        const bounds = mainWindow.getBounds();
        configManager.set('windowBounds', bounds);
      }
    }, 500);
  };

  mainWindow.on('move', saveBounds);
  mainWindow.on('resize', saveBounds);
  mainWindow.on('closed', () => {
    if (boundsTimeout) clearTimeout(boundsTimeout);
    mainWindow = null;
  });

  return mainWindow;
}

export function getWindow(): BrowserWindow | null {
  return mainWindow;
}

export function setWindowOpacity(opacity: number): void {
  if (!mainWindow) return;
  currentOpacity = Math.max(MIN_OPACITY, Math.min(MAX_OPACITY, opacity));
  mainWindow.setOpacity(currentOpacity);
  configManager.set('opacity', currentOpacity);
  mainWindow.webContents.send(IPC_CHANNELS.OPACITY_UPDATED, currentOpacity);
}

export function increaseOpacity(): void {
  setWindowOpacity(currentOpacity + OPACITY_STEP);
}

export function decreaseOpacity(): void {
  setWindowOpacity(currentOpacity - OPACITY_STEP);
}

export function getCurrentOpacity(): number {
  return currentOpacity;
}

export function toggleIgnoreMouse(): boolean {
  if (!mainWindow) return isClickThrough;
  isClickThrough = !isClickThrough;
  setClickThrough(isClickThrough);
  configManager.set('isClickThrough', isClickThrough);
  mainWindow.webContents.send(IPC_CHANNELS.CLICK_THROUGH_UPDATED, isClickThrough);
  return isClickThrough;
}

export function isClickThroughEnabled(): boolean {
  return isClickThrough;
}

export function hideWindow(): void {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
  }
}

export function showWindow(): void {
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
  }
}

export function toggleWindow(): void {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    hideWindow();
  } else {
    showWindow();
  }
}
