// useUserData hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserData } from '../../src/renderer/hooks/useUserData';

const mockFav: WingmanUserDataItem = { title: '测试', url: 'https://test.com' };
const mockShowOSD = vi.fn();
const mockNavigate = vi.fn();
const mockT = vi.fn((key: string) => key);

beforeEach(() => {
  vi.resetAllMocks();

  Object.defineProperty(window, 'wingman', {
    value: {
      userData: {
        get: vi.fn().mockResolvedValue({ favorites: [mockFav], history: [] }),
        saveFavorite: vi.fn().mockResolvedValue([mockFav]),
        removeFavorite: vi.fn().mockResolvedValue([]),
        addHistory: vi.fn(),
        clearHistory: vi.fn().mockResolvedValue([])
      },
      navigation: {
        onNavigateUrl: vi.fn().mockReturnValue(() => {})
      }
    },
    writable: true,
    configurable: true
  });
});

describe('useUserData - openFavorites', () => {
  it('应加载收藏数据并构造 modal 参数', async () => {
    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    let modal: Awaited<ReturnType<typeof result.current.openFavorites>>;
    await act(async () => {
      modal = await result.current.openFavorites();
    });

    expect(modal!.title).toBe('modal.favorites');
    expect(modal!.items).toHaveLength(1);
    expect(modal!.items[0].url).toBe('https://test.com');
    expect(modal!.type).toBe('favorites');
  });

  it('onSelect 应调用 navigate', async () => {
    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    let modal: Awaited<ReturnType<typeof result.current.openFavorites>>;
    await act(async () => {
      modal = await result.current.openFavorites();
    });

    modal!.onSelect(mockFav);
    expect(mockNavigate).toHaveBeenCalledWith('https://test.com');
  });

  it('onDelete 应调用 IPC removeFavorite 并返回更新后的列表', async () => {
    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    let modal: Awaited<ReturnType<typeof result.current.openFavorites>>;
    await act(async () => {
      modal = await result.current.openFavorites();
    });

    let updatedItems: WingmanUserDataItem[] = [];
    await act(async () => {
      updatedItems = await modal!.onDelete!(mockFav);
    });

    expect(window.wingman.userData.removeFavorite).toHaveBeenCalledWith('https://test.com');
    expect(updatedItems).toEqual([]);
  });
});

describe('useUserData - openHistory', () => {
  it('应加载历史数据并不提供 onDelete', async () => {
    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    let modal: Awaited<ReturnType<typeof result.current.openHistory>>;
    await act(async () => {
      modal = await result.current.openHistory();
    });

    expect(modal!.title).toBe('modal.history');
    expect(modal!.type).toBe('history');
    expect(modal!.onDelete).toBeUndefined();
  });
});

describe('useUserData - handleAddFav', () => {
  it('about:blank 应直接跳过，不调用 IPC', async () => {
    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    await act(async () => {
      await result.current.handleAddFav('about:blank', '空白页');
    });

    expect(window.wingman.userData.get).not.toHaveBeenCalled();
  });

  it('空 URL 应直接跳过', async () => {
    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    await act(async () => {
      await result.current.handleAddFav('', '标题');
    });

    expect(window.wingman.userData.get).not.toHaveBeenCalled();
  });

  it('已收藏的 URL 再次添加应触发删除并显示 OSD', async () => {
    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    await act(async () => {
      await result.current.handleAddFav('https://test.com', '测试');
    });

    expect(window.wingman.userData.removeFavorite).toHaveBeenCalledWith('https://test.com');
    expect(mockShowOSD).toHaveBeenCalledWith('home.favRemoved');
  });

  it('未收藏的 URL 添加应调用 saveFavorite 并显示 OSD', async () => {
    // 覆盖 mock，返回空收藏列表（表示该 URL 未收藏）
    vi.mocked(window.wingman.userData.get).mockResolvedValue({ favorites: [], history: [] });

    const { result } = renderHook(() => useUserData(mockShowOSD, mockNavigate, mockT as never));

    await act(async () => {
      await result.current.handleAddFav('https://new.com', '新页面');
    });

    expect(window.wingman.userData.saveFavorite).toHaveBeenCalledWith({
      title: '新页面',
      url: 'https://new.com'
    });
    expect(mockShowOSD).toHaveBeenCalledWith('home.favAdded');
  });
});
