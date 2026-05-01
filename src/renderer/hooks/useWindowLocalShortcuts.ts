// 窗口本地快捷键处理 hook
// 监听 renderer 层 keydown 事件，与配置的本地快捷键匹配后触发对应动作
// 标签页相关动作同时通过 IPC relay（globalShortcut 注册）触发，以便 webview 内也可使用

import { useEffect, useCallback, useRef } from 'react';
import type { Tab } from './useTabsPool';
import { buildAccelerator } from '../utils/shortcut';
import { TAB_RELAY_ACTIONS } from '../../common/constants';
import type { LOCAL_SHORTCUTS } from '../../common/constants';

// 允许在 input/textarea 内触发的快捷键动作
const ALLOWED_IN_INPUT = new Set(['FOCUS_ADDRESS_BAR']);

export interface LocalShortcutHandlers {
  localShortcuts: WingmanLocalShortcuts | null;
  tabs: Tab[];
  activeTabId: string | null;
  onReload: () => void;
  onGoHome: () => void;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onSwitchTab: (id: string) => void;
  onToggleFav: (url: string, title: string) => void;
  onFocusAddressBar: () => void;
  onCopyUrl: () => void;
  onOpenFavorites: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onMediaAction: (action: string) => void;
  currentUrl: string;
  currentTitle: string;
}

export function useWindowLocalShortcuts({
  localShortcuts,
  tabs,
  activeTabId,
  onReload,
  onGoHome,
  onNewTab,
  onCloseTab,
  onSwitchTab,
  onToggleFav,
  onFocusAddressBar,
  onCopyUrl,
  onOpenFavorites,
  onOpenHistory,
  onOpenSettings,
  onMediaAction,
  currentUrl,
  currentTitle,
}: LocalShortcutHandlers) {
  // 用 ref 持有高频更新的值，避免 fireAction 因这些值变化而频繁重建
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;
  const currentUrlRef = useRef(currentUrl);
  currentUrlRef.current = currentUrl;
  const currentTitleRef = useRef(currentTitle);
  currentTitleRef.current = currentTitle;

  // 根据 action 字符串触发对应操作（供 keydown 和 IPC relay 共用）
  const fireAction = useCallback((action: string) => {
    const tabs = tabsRef.current;
    const activeTabId = activeTabIdRef.current;
    const currentUrl = currentUrlRef.current;
    const currentTitle = currentTitleRef.current;
    switch (action) {
      case 'RELOAD_PAGE':
        onReload();
        break;
      case 'GO_HOME':
        onGoHome();
        break;
      case 'FOCUS_ADDRESS_BAR':
        onFocusAddressBar();
        break;
      case 'COPY_URL':
        onCopyUrl();
        break;
      case 'TOGGLE_FAVORITE':
        if (currentUrl) onToggleFav(currentUrl, currentTitle);
        break;
      case 'NEW_TAB':
        onNewTab();
        break;
      case 'CLOSE_TAB':
        if (activeTabId) onCloseTab(activeTabId);
        break;
      case 'NEXT_TAB': {
        if (tabs.length === 0) break;
        if (!activeTabId) {
          // 当前在主页，切换到第一个标签
          onSwitchTab(tabs[0].id);
        } else {
          const idx = tabs.findIndex(t => t.id === activeTabId);
          if (idx === -1) break;
          if (idx === tabs.length - 1) {
            // 最后一个标签，回到主页
            onGoHome();
          } else {
            onSwitchTab(tabs[idx + 1].id);
          }
        }
        break;
      }
      case 'PREV_TAB': {
        if (tabs.length === 0) break;
        if (!activeTabId) {
          // 当前在主页，切换到最后一个标签
          onSwitchTab(tabs[tabs.length - 1].id);
        } else {
          const idx = tabs.findIndex(t => t.id === activeTabId);
          if (idx === -1) break;
          if (idx === 0) {
            // 第一个标签，回到主页
            onGoHome();
          } else {
            onSwitchTab(tabs[idx - 1].id);
          }
        }
        break;
      }
      case 'OPEN_FAVORITES':
        onOpenFavorites();
        break;
      case 'OPEN_HISTORY':
        onOpenHistory();
        break;
      case 'OPEN_SETTINGS':
        onOpenSettings();
        break;
      case 'MEDIA_PLAY_PAUSE':
      case 'MEDIA_NEXT_TRACK':
      case 'MEDIA_PREV_TRACK':
      case 'MEDIA_MUTE':
      case 'MEDIA_SEEK_FORWARD':
      case 'MEDIA_SEEK_BACKWARD':
      case 'MEDIA_VOLUME_UP':
      case 'MEDIA_VOLUME_DOWN':
        onMediaAction(action);
        break;
    }
  }, [
    // tabs/activeTabId/currentUrl/currentTitle 通过 ref 读取，不放入依赖数组，
    // 避免每次导航/切换标签都重建 fireAction 并重新订阅 IPC relay
    onReload, onGoHome, onNewTab, onCloseTab, onSwitchTab,
    onToggleFav, onFocusAddressBar, onCopyUrl,
    onOpenFavorites, onOpenHistory, onOpenSettings, onMediaAction,
  ]);

  // IPC relay：标签页快捷键从主进程发来（globalShortcut 注册，webview 内也能触发）
  useEffect(() => {
    const cleanup = window.wingman.localShortcuts.onShortcutFired(fireAction);
    return cleanup;
  }, [fireAction]);

  // renderer keydown：其余快捷键在窗口聚焦时触发
  useEffect(() => {
    if (!localShortcuts) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const acc = buildAccelerator(e);
      if (!acc) return;

      const shortcutEntries = Object.entries(localShortcuts) as [keyof WingmanLocalShortcuts, string][];
      for (const [action, shortcut] of shortcutEntries) {
        if (shortcut !== acc) continue;
        if (isTyping && !ALLOWED_IN_INPUT.has(action)) continue;
        // 标签页动作由 IPC relay 处理，跳过以避免窗口聚焦时双重触发
        if (TAB_RELAY_ACTIONS.has(action as keyof typeof LOCAL_SHORTCUTS)) continue;

        e.preventDefault();
        e.stopPropagation();
        fireAction(action);
        break;
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [localShortcuts, fireAction]);
}
