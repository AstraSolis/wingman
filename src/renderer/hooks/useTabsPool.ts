import { useReducer, useCallback, useRef } from 'react';

export interface Tab {
  id: string;
  url: string;
  currentUrl: string;
  title: string;
  reloadTrigger: number;
}

// 最多保活 warm 标签数量（常驻 DOM 但不可见）
const MAX_WARM = 3;

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface PoolState {
  tabs: Tab[];
  activeTabId: string | null;
  warmIds: string[]; // LRU 顺序，最近使用的在前
}

type PoolAction =
  | { type: 'OPEN_NEW'; tab: Tab; background: boolean }
  | { type: 'SWITCH'; id: string }
  | { type: 'CLOSE'; id: string }
  | { type: 'NAVIGATE_ACTIVE'; url: string }
  | { type: 'UPDATE_TAB'; id: string; patch: Partial<Tab> }
  | { type: 'RELOAD_ACTIVE' }
  | { type: 'DEACTIVATE' };

/**
 * LRU 更新：将 promote 移到列表头部，将 remove 从列表删除，超出 MAX_WARM 则截断末尾。
 */
function lruPromote(warmIds: string[], promote: string | null, remove: string | null): string[] {
  let w = warmIds.filter(id => id !== promote && id !== remove);
  if (promote) w = [promote, ...w];
  return w.slice(0, MAX_WARM);
}

function reducer(state: PoolState, action: PoolAction): PoolState {
  switch (action.type) {
    case 'OPEN_NEW': {
      const tabs = [...state.tabs, action.tab];
      if (action.background) {
        // 后台打开：新标签进入 warm，active 不变
        return { ...state, tabs, warmIds: lruPromote(state.warmIds, action.tab.id, null) };
      }
      // 前台打开：旧 active 降入 warm，新标签成为 active
      const warmIds = state.activeTabId
        ? lruPromote(state.warmIds, state.activeTabId, null)
        : state.warmIds;
      return { tabs, activeTabId: action.tab.id, warmIds };
    }

    case 'SWITCH': {
      if (state.activeTabId === action.id) return state;
      // 旧 active 升入 warm，新 active 从 warm 移除
      const warmIds = state.activeTabId
        ? lruPromote(state.warmIds, state.activeTabId, action.id)
        : state.warmIds.filter(id => id !== action.id);
      return { ...state, activeTabId: action.id, warmIds };
    }

    case 'CLOSE': {
      const tabs = state.tabs.filter(t => t.id !== action.id);
      const warmIds = state.warmIds.filter(id => id !== action.id);
      let activeTabId = state.activeTabId;
      if (activeTabId === action.id) {
        // 优先激活最近使用的 warm 标签，其次取最后一个，无则 null
        if (warmIds.length > 0) {
          activeTabId = warmIds[0];
        } else if (tabs.length > 0) {
          activeTabId = tabs[tabs.length - 1].id;
        } else {
          activeTabId = null;
        }
      }
      return { tabs, activeTabId, warmIds };
    }

    case 'NAVIGATE_ACTIVE': {
      if (!state.activeTabId) return state;
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === state.activeTabId
            ? { ...t, url: action.url, currentUrl: action.url, title: action.url }
            : t
        )
      };
    }

    case 'UPDATE_TAB':
      return {
        ...state,
        tabs: state.tabs.map(t => (t.id === action.id ? { ...t, ...action.patch } : t))
      };

    case 'RELOAD_ACTIVE': {
      if (!state.activeTabId) return state;
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === state.activeTabId ? { ...t, reloadTrigger: t.reloadTrigger + 1 } : t
        )
      };
    }

    case 'DEACTIVATE': {
      if (!state.activeTabId) return state;
      // 当前 active 标签降入 warm，保留页面状态，避免切回时重新加载
      const warmIds = lruPromote(state.warmIds, state.activeTabId, null);
      return { ...state, activeTabId: null, warmIds };
    }

    default:
      return state;
  }
}

export function useTabsPool(loadUrl: (url: string) => string | null) {
  const [state, dispatch] = useReducer(reducer, {
    tabs: [],
    activeTabId: null,
    warmIds: []
  });

  // ref 用于在 stable callback 内读取最新 activeTabId，避免频繁重建 callback
  const activeTabIdRef = useRef<string | null>(null);
  activeTabIdRef.current = state.activeTabId;

  const activeTab = state.tabs.find(t => t.id === state.activeTabId) ?? null;

  /**
   * 在当前活跃标签导航；无活跃标签时自动新建前台标签。
   * callback 依赖仅 loadUrl，对外保持稳定引用。
   */
  const navigate = useCallback(
    (rawUrl: string) => {
      const url = loadUrl(rawUrl);
      if (!url) return;
      if (activeTabIdRef.current) {
        dispatch({ type: 'NAVIGATE_ACTIVE', url });
      } else {
        const id = makeId();
        dispatch({
          type: 'OPEN_NEW',
          tab: { id, url, currentUrl: url, title: url, reloadTrigger: 0 },
          background: false
        });
      }
    },
    [loadUrl]
  );

  /** 后台打开链接，不切换 active 标签 */
  const openInBackground = useCallback(
    (rawUrl: string) => {
      const url = loadUrl(rawUrl);
      if (!url) return;
      const id = makeId();
      dispatch({
        type: 'OPEN_NEW',
        tab: { id, url, currentUrl: url, title: url, reloadTrigger: 0 },
        background: true
      });
    },
    [loadUrl]
  );

  const closeTab = useCallback((id: string) => {
    dispatch({ type: 'CLOSE', id });
  }, []);

  const switchTab = useCallback((id: string) => {
    dispatch({ type: 'SWITCH', id });
  }, []);

  /** 去主页：停用当前活跃标签，保留所有标签在 warm 池中 */
  const goHome = useCallback(() => {
    dispatch({ type: 'DEACTIVATE' });
  }, []);

  const reloadActiveTab = useCallback(() => {
    dispatch({ type: 'RELOAD_ACTIVE' });
  }, []);

  const handleTabNavigate = useCallback((id: string, url: string, title?: string) => {
    dispatch({ type: 'UPDATE_TAB', id, patch: { currentUrl: url, ...(title ? { title } : {}) } });
    // lastUrl 只跟踪活跃标签，所有标签的导航都写历史
    if (id === activeTabIdRef.current) {
      window.wingman.userData.saveLastUrl(url);
    }
    window.wingman.userData.addHistory({ title: title || url, url });
  }, []);

  const handleTabTitleChange = useCallback((id: string, title: string) => {
    dispatch({ type: 'UPDATE_TAB', id, patch: { title } });
  }, []);

  return {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    warmIds: state.warmIds,
    activeTab,
    view: (state.activeTabId !== null ? 'webview' : 'home') as 'home' | 'webview',
    navigate,
    openInBackground,
    closeTab,
    switchTab,
    goHome,
    reloadActiveTab,
    handleTabNavigate,
    handleTabTitleChange,
    currentUrl: activeTab?.currentUrl ?? '',
    currentTitle: activeTab?.title ?? ''
  };
}
