// useStartupPage hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// mock useBootState，按测试需求动态返回不同 bootState
const mockUseBootState = vi.fn();
vi.mock('../../src/renderer/hooks/useBootState', () => ({
  useBootState: () => mockUseBootState()
}));

import { useStartupPage } from '../../src/renderer/hooks/useStartupPage';

function setup(navigate: ReturnType<typeof vi.fn>, openFavoritesModal: ReturnType<typeof vi.fn>) {
  return renderHook(() => useStartupPage(navigate, openFavoritesModal));
}

describe('useStartupPage - lastPage 模式', () => {
  it('有 lastUrl 时应 navigate 到上次 URL', async () => {
    mockUseBootState.mockReturnValue({
      windowState: { opacity: 0.85, isClickThrough: false, lastUrl: 'https://last.com' },
      startupConfig: { startupPage: 'lastPage', customStartupUrl: '' },
      autoStart: false
    });

    const navigate = vi.fn();
    const openFav = vi.fn();
    setup(navigate, openFav);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('https://last.com'));
    expect(openFav).not.toHaveBeenCalled();
  });

  it('无 lastUrl 时不应调用 navigate', async () => {
    mockUseBootState.mockReturnValue({
      windowState: { opacity: 0.85, isClickThrough: false, lastUrl: '' },
      startupConfig: { startupPage: 'lastPage', customStartupUrl: '' },
      autoStart: false
    });

    const navigate = vi.fn();
    setup(navigate, vi.fn());

    // 等待可能的异步副作用
    await new Promise(r => setTimeout(r, 50));
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('useStartupPage - customUrl 模式', () => {
  it('有 customStartupUrl 时应 navigate 到自定义 URL', async () => {
    mockUseBootState.mockReturnValue({
      windowState: { opacity: 0.85, isClickThrough: false, lastUrl: '' },
      startupConfig: { startupPage: 'customUrl', customStartupUrl: 'https://custom.com' },
      autoStart: false
    });

    const navigate = vi.fn();
    setup(navigate, vi.fn());

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('https://custom.com'));
  });

  it('无 customStartupUrl 时不应调用 navigate', async () => {
    mockUseBootState.mockReturnValue({
      windowState: { opacity: 0.85, isClickThrough: false, lastUrl: '' },
      startupConfig: { startupPage: 'customUrl', customStartupUrl: '' },
      autoStart: false
    });

    const navigate = vi.fn();
    setup(navigate, vi.fn());

    await new Promise(r => setTimeout(r, 50));
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('useStartupPage - favorites 模式', () => {
  it('应调用 openFavoritesModal', async () => {
    mockUseBootState.mockReturnValue({
      windowState: { opacity: 0.85, isClickThrough: false, lastUrl: '' },
      startupConfig: { startupPage: 'favorites', customStartupUrl: '' },
      autoStart: false
    });

    const navigate = vi.fn();
    const openFav = vi.fn();
    setup(navigate, openFav);

    await waitFor(() => expect(openFav).toHaveBeenCalled());
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('useStartupPage - home 模式', () => {
  it('不应 navigate 也不应 openFavoritesModal', async () => {
    mockUseBootState.mockReturnValue({
      windowState: { opacity: 0.85, isClickThrough: false, lastUrl: 'https://last.com' },
      startupConfig: { startupPage: 'home', customStartupUrl: 'https://custom.com' },
      autoStart: false
    });

    const navigate = vi.fn();
    const openFav = vi.fn();
    setup(navigate, openFav);

    await new Promise(r => setTimeout(r, 50));
    expect(navigate).not.toHaveBeenCalled();
    expect(openFav).not.toHaveBeenCalled();
  });
});

describe('useStartupPage - 单次初始化保证', () => {
  it('bootState 多次更新只应执行一次初始化', async () => {
    let callCount = 0;
    mockUseBootState.mockImplementation(() => {
      callCount++;
      // 前两次返回 null（加载中），之后返回真实数据
      if (callCount <= 2) return null;
      return {
        windowState: { opacity: 0.85, isClickThrough: false, lastUrl: 'https://once.com' },
        startupConfig: { startupPage: 'lastPage', customStartupUrl: '' },
        autoStart: false
      };
    });

    const navigate = vi.fn();
    const { rerender } = setup(navigate, vi.fn());

    // 触发多次 rerender 模拟 bootState 多次变化
    rerender();
    rerender();
    rerender();

    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledTimes(1); // 只执行一次
  });
});
