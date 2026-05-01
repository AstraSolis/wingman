// useTabsPool hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabsPool } from '../../src/renderer/hooks/useTabsPool';

// mock window.wingman.userData（handleTabNavigate 内部调用）
beforeEach(() => {
  Object.defineProperty(window, 'wingman', {
    value: {
      userData: {
        saveLastUrl: vi.fn(),
        addHistory: vi.fn()
      }
    },
    writable: true,
    configurable: true
  });
});

// loadUrl mock：直接原样返回，不做 URL 规范化
const loadUrl = vi.fn((url: string) => (url ? url : null));

function setup() {
  return renderHook(() => useTabsPool(loadUrl));
}

// ─────────────────────────────── 初始状态 ────────────────────────────────
describe('初始状态', () => {
  it('无标签、无 active、view 为 home', () => {
    const { result } = setup();
    expect(result.current.tabs).toHaveLength(0);
    expect(result.current.activeTabId).toBeNull();
    expect(result.current.view).toBe('home');
    expect(result.current.warmIds).toHaveLength(0);
  });
});

// ─────────────────────────────── navigate ────────────────────────────────
describe('navigate - 无 active 标签时新建前台标签', () => {
  it('应新建标签并成为 active', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://example.com'));

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTabId).not.toBeNull();
    expect(result.current.activeTab?.url).toBe('https://example.com');
    expect(result.current.view).toBe('webview');
  });

  it('URL 规范化失败（loadUrl 返回 null）时不应新建标签', () => {
    loadUrl.mockReturnValueOnce(null);
    const { result } = setup();
    act(() => result.current.navigate(''));
    expect(result.current.tabs).toHaveLength(0);
  });
});

describe('navigate - 已有 active 标签时原地导航', () => {
  it('应更新 active 标签的 url 而不新建标签', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://first.com'));
    act(() => result.current.navigate('https://second.com'));

    expect(result.current.tabs).toHaveLength(1); // 仍只有一个标签
    expect(result.current.activeTab?.url).toBe('https://second.com');
  });
});

// ─────────────────────────────── openInBackground ────────────────────────
describe('openInBackground', () => {
  it('应新建标签但不改变 activeTabId', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://active.com'));
    const activeId = result.current.activeTabId;

    act(() => result.current.openInBackground('https://bg.com'));

    expect(result.current.tabs).toHaveLength(2);
    expect(result.current.activeTabId).toBe(activeId); // active 未变
    expect(result.current.warmIds).toContain(
      result.current.tabs.find(t => t.url === 'https://bg.com')?.id
    );
  });
});

// ─────────────────────────────── switchTab ────────────────────────────────
describe('switchTab', () => {
  it('应切换 activeTabId 并将旧 active 放入 warm', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://tab1.com'));
    act(() => result.current.openInBackground('https://tab2.com'));

    const tab2Id = result.current.tabs.find(t => t.url === 'https://tab2.com')!.id;
    const oldActiveId = result.current.activeTabId!;

    act(() => result.current.switchTab(tab2Id));

    expect(result.current.activeTabId).toBe(tab2Id);
    expect(result.current.warmIds).toContain(oldActiveId);
    expect(result.current.warmIds).not.toContain(tab2Id);
  });

  it('切换到当前 active 标签应是 no-op', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://same.com'));
    const activeId = result.current.activeTabId;

    act(() => result.current.switchTab(activeId!));
    expect(result.current.activeTabId).toBe(activeId);
  });
});

// ─────────────────────────────── closeTab ────────────────────────────────
describe('closeTab', () => {
  it('关闭非 active 标签不应改变 activeTabId', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://active.com'));
    act(() => result.current.openInBackground('https://bg.com'));

    const bgId = result.current.tabs.find(t => t.url === 'https://bg.com')!.id;
    const activeId = result.current.activeTabId;

    act(() => result.current.closeTab(bgId));

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTabId).toBe(activeId);
  });

  it('关闭 active 标签后应激活最近使用的 warm 标签', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://tab1.com'));
    act(() => result.current.openInBackground('https://tab2.com'));

    const tab2Id = result.current.tabs.find(t => t.url === 'https://tab2.com')!.id;
    const activeId = result.current.activeTabId!;

    // tab2 在 warm 里
    expect(result.current.warmIds).toContain(tab2Id);

    act(() => result.current.closeTab(activeId));

    expect(result.current.activeTabId).toBe(tab2Id);
    expect(result.current.tabs).toHaveLength(1);
  });

  it('关闭最后一个标签后 activeTabId 应为 null', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://only.com'));
    const id = result.current.activeTabId!;

    act(() => result.current.closeTab(id));

    expect(result.current.tabs).toHaveLength(0);
    expect(result.current.activeTabId).toBeNull();
    expect(result.current.view).toBe('home');
  });
});

// ─────────────────────────────── goHome ────────────────────────────────
describe('goHome', () => {
  it('应清除 activeTabId 并将标签保留在 warm 池', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://page.com'));
    const tabId = result.current.activeTabId!;

    act(() => result.current.goHome());

    expect(result.current.activeTabId).toBeNull();
    expect(result.current.view).toBe('home');
    expect(result.current.tabs).toHaveLength(1); // 标签没有被删除
    expect(result.current.warmIds).toContain(tabId);
  });
});

// ─────────────────────────────── reloadActiveTab ────────────────────────
describe('reloadActiveTab', () => {
  it('应递增 active 标签的 reloadTrigger', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://page.com'));
    const before = result.current.activeTab!.reloadTrigger;

    act(() => result.current.reloadActiveTab());

    expect(result.current.activeTab!.reloadTrigger).toBe(before + 1);
  });

  it('无 active 标签时调用应是 no-op', () => {
    const { result } = setup();
    act(() => result.current.reloadActiveTab()); // 不应报错
    expect(result.current.tabs).toHaveLength(0);
  });
});

// ─────────────────────────────── handleTabNavigate ────────────────────────
describe('handleTabNavigate', () => {
  it('应更新标签的 currentUrl 和 title', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://page.com'));
    const tabId = result.current.activeTabId!;

    act(() => result.current.handleTabNavigate(tabId, 'https://page.com/sub', '子页面'));

    const tab = result.current.tabs.find(t => t.id === tabId)!;
    expect(tab.currentUrl).toBe('https://page.com/sub');
    expect(tab.title).toBe('子页面');
  });

  it('active 标签导航时应调用 saveLastUrl', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://page.com'));
    const tabId = result.current.activeTabId!;

    act(() => result.current.handleTabNavigate(tabId, 'https://page.com/new'));

    expect(window.wingman.userData.saveLastUrl).toHaveBeenCalledWith('https://page.com/new');
  });

  it('任意标签导航时应调用 addHistory', () => {
    const { result } = setup();
    act(() => result.current.navigate('https://page.com'));
    act(() => result.current.openInBackground('https://bg.com'));

    const bgTab = result.current.tabs.find(t => t.url === 'https://bg.com')!;

    act(() => result.current.handleTabNavigate(bgTab.id, 'https://bg.com/updated', '后台页面'));

    expect(window.wingman.userData.addHistory).toHaveBeenCalledWith({
      title: '后台页面',
      url: 'https://bg.com/updated'
    });
    // 后台标签不是 active，不应调用 saveLastUrl（仅应被 active 标签的调用触发）
    expect(window.wingman.userData.saveLastUrl).not.toHaveBeenCalledWith('https://bg.com/updated');
  });
});

// ─────────────────────────────── LRU warm 池上限 ────────────────────────
describe('LRU warm 池上限（MAX_WARM = 3）', () => {
  it('超过 3 个 warm 标签时应驱逐最旧的', () => {
    const { result } = setup();

    // 打开 5 个后台标签
    act(() => result.current.navigate('https://active.com'));
    for (let i = 1; i <= 4; i++) {
      act(() => result.current.openInBackground(`https://bg${i}.com`));
    }

    expect(result.current.warmIds).toHaveLength(3);
  });
});
