// useOSD hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOSD } from '../../src/renderer/hooks/useOSD';

describe('useOSD', () => {
  it('初始状态 osdMessage 应为 null', () => {
    const { result } = renderHook(() => useOSD());
    expect(result.current.osdMessage).toBeNull();
  });

  it('showOSD 调用后 osdMessage 应包含文本', () => {
    const { result } = renderHook(() => useOSD());
    act(() => {
      result.current.showOSD('透明度: 85%');
    });
    expect(result.current.osdMessage?.text).toBe('透明度: 85%');
  });

  it('每次 showOSD 应生成唯一的 id', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useOSD());

    act(() => {
      result.current.showOSD('第一条');
    });
    const id1 = result.current.osdMessage?.id;

    // 推进 1ms，确保 Date.now() 返回不同值
    vi.advanceTimersByTime(1);

    act(() => {
      result.current.showOSD('第二条');
    });
    const id2 = result.current.osdMessage?.id;

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);

    vi.useRealTimers();
  });

  it('连续调用 showOSD 应以最后一条为准', () => {
    const { result } = renderHook(() => useOSD());

    act(() => {
      result.current.showOSD('第一条');
      result.current.showOSD('第二条');
    });

    expect(result.current.osdMessage?.text).toBe('第二条');
  });
});
