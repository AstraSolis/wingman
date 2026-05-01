// useModals hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useModals } from '../../src/renderer/hooks/useModals';

const mockItem: WingmanUserDataItem = { title: '测试页面', url: 'https://example.com' };

describe('useModals - 设置面板', () => {
  it('初始 showSettings 应为 false', () => {
    const { result } = renderHook(() => useModals());
    expect(result.current.showSettings).toBe(false);
  });

  it('openSettings 应将 showSettings 设为 true', () => {
    const { result } = renderHook(() => useModals());
    act(() => result.current.openSettings());
    expect(result.current.showSettings).toBe(true);
  });

  it('closeSettings 应将 showSettings 设为 false', () => {
    const { result } = renderHook(() => useModals());
    act(() => result.current.openSettings());
    act(() => result.current.closeSettings());
    expect(result.current.showSettings).toBe(false);
  });
});

describe('useModals - 列表模态框', () => {
  it('初始 listModal 应为 null', () => {
    const { result } = renderHook(() => useModals());
    expect(result.current.listModal).toBeNull();
  });

  it('openListModal 应设置 listModal 状态', async () => {
    const { result } = renderHook(() => useModals());
    const onSelect = vi.fn();

    await act(async () => {
      await result.current.openListModal(async () => ({
        title: '收藏夹',
        items: [mockItem],
        type: 'favorites',
        onSelect
      }));
    });

    expect(result.current.listModal).not.toBeNull();
    expect(result.current.listModal?.title).toBe('收藏夹');
    expect(result.current.listModal?.items).toHaveLength(1);
    expect(result.current.listModal?.type).toBe('favorites');
  });

  it('onSelect 触发后应自动关闭模态框', async () => {
    const { result } = renderHook(() => useModals());
    const onSelect = vi.fn();

    await act(async () => {
      await result.current.openListModal(async () => ({
        title: '收藏夹',
        items: [mockItem],
        type: 'favorites',
        onSelect
      }));
    });

    act(() => {
      result.current.listModal?.onSelect(mockItem);
    });

    expect(onSelect).toHaveBeenCalledWith(mockItem);
    expect(result.current.listModal).toBeNull();
  });

  it('closeListModal 应清空 listModal', async () => {
    const { result } = renderHook(() => useModals());

    await act(async () => {
      await result.current.openListModal(async () => ({
        title: '历史',
        items: [],
        type: 'history',
        onSelect: vi.fn()
      }));
    });

    act(() => result.current.closeListModal());
    expect(result.current.listModal).toBeNull();
  });

  it('onDelete 应更新列表内容', async () => {
    const { result } = renderHook(() => useModals());
    const updatedItems: WingmanUserDataItem[] = [{ title: '剩余', url: 'https://remain.com' }];

    await act(async () => {
      await result.current.openListModal(async () => ({
        title: '收藏夹',
        items: [mockItem, updatedItems[0]],
        type: 'favorites',
        onSelect: vi.fn(),
        onDelete: async () => updatedItems
      }));
    });

    await act(async () => {
      await result.current.listModal?.onDelete?.(mockItem);
    });

    await waitFor(() => {
      expect(result.current.listModal?.items).toHaveLength(1);
      expect(result.current.listModal?.items[0].url).toBe('https://remain.com');
    });
  });
});
