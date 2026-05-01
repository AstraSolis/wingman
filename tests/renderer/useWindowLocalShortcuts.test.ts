// useWindowLocalShortcuts hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWindowLocalShortcuts } from '../../src/renderer/hooks/useWindowLocalShortcuts';
import type { LocalShortcutHandlers } from '../../src/renderer/hooks/useWindowLocalShortcuts';
import type { Tab } from '../../src/renderer/hooks/useTabsPool';

// 捕获 fireAction 回调（通过 onShortcutFired 注入）
let capturedFireAction: ((action: string) => void) | null = null;

beforeEach(() => {
  capturedFireAction = null;
  vi.clearAllMocks();

  Object.defineProperty(window, 'wingman', {
    value: {
      localShortcuts: {
        onShortcutFired: vi.fn((cb: (action: string) => void) => {
          capturedFireAction = cb;
          return () => {};
        })
      }
    },
    writable: true,
    configurable: true
  });
});

function makeTab(id: string, url = `https://${id}.com`): Tab {
  return { id, url, currentUrl: url, title: id, reloadTrigger: 0 };
}

function makeHandlers(overrides: Partial<LocalShortcutHandlers> = {}): LocalShortcutHandlers {
  return {
    localShortcuts: null,
    tabs: [],
    activeTabId: null,
    onReload: vi.fn(),
    onGoHome: vi.fn(),
    onNewTab: vi.fn(),
    onCloseTab: vi.fn(),
    onSwitchTab: vi.fn(),
    onToggleFav: vi.fn(),
    onFocusAddressBar: vi.fn(),
    onCopyUrl: vi.fn(),
    onOpenFavorites: vi.fn(),
    onOpenHistory: vi.fn(),
    onOpenSettings: vi.fn(),
    onMediaAction: vi.fn(),
    currentUrl: '',
    currentTitle: '',
    ...overrides
  };
}

// ───────────────────── 基本动作分支 ─────────────────────
describe('fireAction - 基本动作', () => {
  it('RELOAD_PAGE 应调用 onReload', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('RELOAD_PAGE');
    expect(h.onReload).toHaveBeenCalled();
  });

  it('GO_HOME 应调用 onGoHome', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('GO_HOME');
    expect(h.onGoHome).toHaveBeenCalled();
  });

  it('NEW_TAB 应调用 onNewTab', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('NEW_TAB');
    expect(h.onNewTab).toHaveBeenCalled();
  });

  it('CLOSE_TAB 有 activeTabId 时应调用 onCloseTab', () => {
    const h = makeHandlers({ activeTabId: 'tab1', tabs: [makeTab('tab1')] });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('CLOSE_TAB');
    expect(h.onCloseTab).toHaveBeenCalledWith('tab1');
  });

  it('CLOSE_TAB 无 activeTabId 时不应调用 onCloseTab', () => {
    const h = makeHandlers({ activeTabId: null });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('CLOSE_TAB');
    expect(h.onCloseTab).not.toHaveBeenCalled();
  });

  it('TOGGLE_FAVORITE 有 currentUrl 时应调用 onToggleFav', () => {
    const h = makeHandlers({ currentUrl: 'https://example.com', currentTitle: '示例' });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('TOGGLE_FAVORITE');
    expect(h.onToggleFav).toHaveBeenCalledWith('https://example.com', '示例');
  });

  it('TOGGLE_FAVORITE 无 currentUrl 时不应调用 onToggleFav', () => {
    const h = makeHandlers({ currentUrl: '' });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('TOGGLE_FAVORITE');
    expect(h.onToggleFav).not.toHaveBeenCalled();
  });

  it('FOCUS_ADDRESS_BAR 应调用 onFocusAddressBar', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('FOCUS_ADDRESS_BAR');
    expect(h.onFocusAddressBar).toHaveBeenCalled();
  });

  it('COPY_URL 应调用 onCopyUrl', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('COPY_URL');
    expect(h.onCopyUrl).toHaveBeenCalled();
  });

  it('OPEN_FAVORITES 应调用 onOpenFavorites', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('OPEN_FAVORITES');
    expect(h.onOpenFavorites).toHaveBeenCalled();
  });

  it('OPEN_HISTORY 应调用 onOpenHistory', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('OPEN_HISTORY');
    expect(h.onOpenHistory).toHaveBeenCalled();
  });

  it('OPEN_SETTINGS 应调用 onOpenSettings', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('OPEN_SETTINGS');
    expect(h.onOpenSettings).toHaveBeenCalled();
  });

  it('媒体动作应调用 onMediaAction 并传入动作名', () => {
    const h = makeHandlers();
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('MEDIA_PLAY_PAUSE');
    expect(h.onMediaAction).toHaveBeenCalledWith('MEDIA_PLAY_PAUSE');

    capturedFireAction!('MEDIA_MUTE');
    expect(h.onMediaAction).toHaveBeenCalledWith('MEDIA_MUTE');
  });
});

// ───────────────────── NEXT_TAB 环形逻辑 ─────────────────────
describe('fireAction - NEXT_TAB 环形逻辑', () => {
  it('在主页（无 activeTabId），有标签时切换到第一个标签', () => {
    const tabs = [makeTab('a'), makeTab('b')];
    const h = makeHandlers({ tabs, activeTabId: null });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('NEXT_TAB');
    expect(h.onSwitchTab).toHaveBeenCalledWith('a');
  });

  it('在中间标签时切换到下一个', () => {
    const tabs = [makeTab('a'), makeTab('b'), makeTab('c')];
    const h = makeHandlers({ tabs, activeTabId: 'b' });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('NEXT_TAB');
    expect(h.onSwitchTab).toHaveBeenCalledWith('c');
  });

  it('在最后一个标签时应回到主页', () => {
    const tabs = [makeTab('a'), makeTab('b')];
    const h = makeHandlers({ tabs, activeTabId: 'b' });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('NEXT_TAB');
    expect(h.onGoHome).toHaveBeenCalled();
    expect(h.onSwitchTab).not.toHaveBeenCalled();
  });

  it('无标签时是 no-op', () => {
    const h = makeHandlers({ tabs: [], activeTabId: null });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('NEXT_TAB');
    expect(h.onSwitchTab).not.toHaveBeenCalled();
    expect(h.onGoHome).not.toHaveBeenCalled();
  });
});

// ───────────────────── PREV_TAB 环形逻辑 ─────────────────────
describe('fireAction - PREV_TAB 环形逻辑', () => {
  it('在主页（无 activeTabId），有标签时切换到最后一个标签', () => {
    const tabs = [makeTab('a'), makeTab('b'), makeTab('c')];
    const h = makeHandlers({ tabs, activeTabId: null });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('PREV_TAB');
    expect(h.onSwitchTab).toHaveBeenCalledWith('c');
  });

  it('在中间标签时切换到上一个', () => {
    const tabs = [makeTab('a'), makeTab('b'), makeTab('c')];
    const h = makeHandlers({ tabs, activeTabId: 'b' });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('PREV_TAB');
    expect(h.onSwitchTab).toHaveBeenCalledWith('a');
  });

  it('在第一个标签时应回到主页', () => {
    const tabs = [makeTab('a'), makeTab('b')];
    const h = makeHandlers({ tabs, activeTabId: 'a' });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('PREV_TAB');
    expect(h.onGoHome).toHaveBeenCalled();
    expect(h.onSwitchTab).not.toHaveBeenCalled();
  });

  it('无标签时是 no-op', () => {
    const h = makeHandlers({ tabs: [], activeTabId: null });
    renderHook(() => useWindowLocalShortcuts(h));
    capturedFireAction!('PREV_TAB');
    expect(h.onSwitchTab).not.toHaveBeenCalled();
    expect(h.onGoHome).not.toHaveBeenCalled();
  });
});

// ───────────────────── keydown 事件过滤 ─────────────────────
describe('keydown 事件过滤', () => {
  const localShortcuts: WingmanLocalShortcuts = {
    RELOAD_PAGE: 'F5',
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
    MEDIA_MUTE: 'CommandOrControl+Alt+M'
  };

  it('F5 在普通元素上应触发 RELOAD_PAGE', () => {
    const h = makeHandlers({ localShortcuts });
    renderHook(() => useWindowLocalShortcuts(h));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F5', bubbles: true }));
    expect(h.onReload).toHaveBeenCalled();
  });

  it('F5 在 INPUT 内应被过滤（RELOAD_PAGE 不在 ALLOWED_IN_INPUT）', () => {
    const h = makeHandlers({ localShortcuts });
    renderHook(() => useWindowLocalShortcuts(h));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'F5', bubbles: true, cancelable: true }));
    expect(h.onReload).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('TAB_RELAY_ACTIONS (NEW_TAB) 在 keydown 中应被跳过（由 IPC relay 处理）', () => {
    const h = makeHandlers({ localShortcuts });
    renderHook(() => useWindowLocalShortcuts(h));
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 't', ctrlKey: true, bubbles: true })
    );
    expect(h.onNewTab).not.toHaveBeenCalled();
  });
});
