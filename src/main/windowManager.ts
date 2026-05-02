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

// 伪全屏 CSS：将带有标记属性的元素充满 webview 视口
const PSEUDO_FS_CSS = `
[data-wingman-pseudo-fs]{
  position:fixed!important;inset:0!important;
  width:100%!important;height:100%!important;
  z-index:2147483647!important;
  background:#000!important;
  transform:none!important;margin:0!important;
  border:none!important;max-width:none!important;max-height:none!important;
}
[data-wingman-pseudo-fs] video,
[data-wingman-pseudo-fs] iframe{
  width:100%!important;height:100%!important;
  max-width:none!important;max-height:none!important;
  object-fit:contain!important;
}
`;

// 伪全屏 JS：覆盖 requestFullscreen 防止 OS 全屏
// enter 时将元素移到 body 直属子级，突破嵌套 stacking context（父级 transform/opacity 会隔离 z-index）
// leave 时用保存的 parentNode/nextSibling 精确恢复 DOM 位置
const PSEUDO_FS_JS = `(function(){
if(window.__wingmanPsFs)return;window.__wingmanPsFs=true;
var el=null,elParent=null,elNext=null,prevHtmlOverflow='',prevBodyOverflow='';
function fire(e){
  try{document.dispatchEvent(new Event('fullscreenchange'));}catch(x){}
  try{e.dispatchEvent(new Event('fullscreenchange',{bubbles:true}));}catch(x){}
  try{document.dispatchEvent(new Event('webkitfullscreenchange'));}catch(x){}
}
function enter(e){
  if(el)leave();el=e;
  elParent=e.parentNode;elNext=e.nextSibling;
  prevHtmlOverflow=document.documentElement.style.overflow;
  prevBodyOverflow=document.body.style.overflow;
  document.documentElement.style.overflow='hidden';
  document.body.style.overflow='hidden';
  document.body.appendChild(e);
  e.setAttribute('data-wingman-pseudo-fs','');
  try{Object.defineProperty(document,'fullscreenElement',{get:function(){return el;},configurable:true});}catch(x){}
  try{Object.defineProperty(document,'webkitFullscreenElement',{get:function(){return el;},configurable:true});}catch(x){}
  fire(e);
}
function leave(){
  if(!el)return;var p=el;var pp=elParent;var pn=elNext;
  el=null;elParent=null;elNext=null;
  document.documentElement.style.overflow=prevHtmlOverflow;
  document.body.style.overflow=prevBodyOverflow;
  p.removeAttribute('data-wingman-pseudo-fs');
  try{
    if(pp){
      if(pn&&pn.parentNode===pp){pp.insertBefore(p,pn);}
      else{pp.appendChild(p);}
    }
  }catch(x){}
  try{Object.defineProperty(document,'fullscreenElement',{get:function(){return null;},configurable:true});}catch(x){}
  try{Object.defineProperty(document,'webkitFullscreenElement',{get:function(){return null;},configurable:true});}catch(x){}
  fire(p);
}
HTMLElement.prototype.requestFullscreen=function(){enter(this);return Promise.resolve();};
if(HTMLElement.prototype.webkitRequestFullscreen!==undefined)HTMLElement.prototype.webkitRequestFullscreen=function(){enter(this);return Promise.resolve();};
if(HTMLElement.prototype.webkitRequestFullScreen!==undefined)HTMLElement.prototype.webkitRequestFullScreen=function(){enter(this);};
Document.prototype.exitFullscreen=function(){leave();return Promise.resolve();};
if(Document.prototype.webkitExitFullscreen!==undefined)Document.prototype.webkitExitFullscreen=function(){leave();};
try{Object.defineProperty(document,'fullscreenEnabled',{get:function(){return true;},configurable:true});}catch(x){}
try{Object.defineProperty(document,'webkitFullscreenEnabled',{get:function(){return true;},configurable:true});}catch(x){}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&el){e.stopImmediatePropagation();leave();}},true);
})();`;

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

  if (rememberBounds && savedBounds && savedBounds.width > 0 && savedBounds.height > 0) {
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

    // dom-ready 时注入伪全屏逻辑，拦截 requestFullscreen 防止 OS 全屏
    guestContents.on('dom-ready', () => {
      guestContents.insertCSS(PSEUDO_FS_CSS).catch(() => {});
      guestContents.executeJavaScript(PSEUDO_FS_JS).catch(() => {});
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
        currentTitle: guestContents.getTitle(),
        webContentsId: guestContents.id
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
