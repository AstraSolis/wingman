// useWindowState hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// mock window.wingman
const mockOpacityListener = vi.fn();
const mockClickThroughListener = vi.fn();
let opacityCallback: ((val: number) => void) | null = null;
let clickThroughCallback: ((enabled: boolean) => void) | null = null;

beforeEach(() => {
  opacityCallback = null;
  clickThroughCallback = null;
  vi.resetAllMocks();

  Object.defineProperty(window, 'wingman', {
    value: {
      window: {
        getInitialState: vi.fn().mockResolvedValue({ opacity: 0.85, isClickThrough: false }),
        setOpacity: vi.fn(),
        toggleClickThrough: vi.fn(),
        close: vi.fn(),
        onOpacityUpdated: vi.fn((cb: (val: number) => void) => {
          opacityCallback = cb;
          return () => { opacityCallback = null; };
        }),
        onClickThroughUpdated: vi.fn((cb: (enabled: boolean) => void) => {
          clickThroughCallback = cb;
          return () => { clickThroughCallback = null; };
        })
      }
    },
    writable: true,
    configurable: true
  });
});

// 伪造 BootStateContext，直接提供 bootState 值
vi.mock('../../src/renderer/hooks/useBootState', () => ({
  useBootState: vi.fn().mockReturnValue({
    windowState: { opacity: 0.85, isClickThrough: false },
    startupConfig: null,
    autoStart: false
  })
}));

import { useWindowState } from '../../src/renderer/hooks/useWindowState';

const mockShowOSD = vi.fn();
const mockT = vi.fn((key: string, params?: Record<string, string>) => {
  if (key === 'osd.opacity') return `透明度: ${params?.value}%`;
  if (key === 'osd.clickThroughOn') return '穿透已开启';
  if (key === 'osd.clickThroughOff') return '穿透已关闭';
  return key;
});

describe('useWindowState - 初始化', () => {
  it('应从 bootState 读取初始透明度', async () => {
    const { result } = renderHook(() => useWindowState(mockShowOSD, mockT as never));
    await waitFor(() => {
      expect(result.current.opacity).toBe(85); // 0.85 * 100
    });
  });

  it('应从 bootState 读取初始穿透状态', async () => {
    const { result } = renderHook(() => useWindowState(mockShowOSD, mockT as never));
    await waitFor(() => {
      expect(result.current.isClickThrough).toBe(false);
    });
  });
});

describe('useWindowState - 事件监听', () => {
  it('主进程推送透明度时应更新状态并显示 OSD', async () => {
    const { result } = renderHook(() => useWindowState(mockShowOSD, mockT as never));

    act(() => {
      opacityCallback?.(0.7);
    });

    await waitFor(() => {
      expect(result.current.opacity).toBe(70);
      expect(mockShowOSD).toHaveBeenCalledWith('透明度: 70%');
    });
  });

  it('主进程推送穿透状态时应更新状态并显示 OSD', async () => {
    const { result } = renderHook(() => useWindowState(mockShowOSD, mockT as never));

    act(() => {
      clickThroughCallback?.(true);
    });

    await waitFor(() => {
      expect(result.current.isClickThrough).toBe(true);
      expect(mockShowOSD).toHaveBeenCalledWith('穿透已开启');
    });
  });
});

describe('useWindowState - 用户操作', () => {
  it('handleOpacityChange 应调用 IPC 并更新本地状态', () => {
    const { result } = renderHook(() => useWindowState(mockShowOSD, mockT as never));

    act(() => {
      result.current.handleOpacityChange(60);
    });

    expect(result.current.opacity).toBe(60);
    expect(window.wingman.window.setOpacity).toHaveBeenCalledWith(0.6);
  });

  it('handleClickThrough 应调用 IPC', () => {
    const { result } = renderHook(() => useWindowState(mockShowOSD, mockT as never));
    act(() => result.current.handleClickThrough());
    expect(window.wingman.window.toggleClickThrough).toHaveBeenCalled();
  });

  it('handleClose 应调用 IPC', () => {
    const { result } = renderHook(() => useWindowState(mockShowOSD, mockT as never));
    act(() => result.current.handleClose());
    expect(window.wingman.window.close).toHaveBeenCalled();
  });
});
