// useSettingsPanel hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useSettingsPanel } from '../../src/renderer/hooks/useSettings';

const mockShowOSD = vi.fn();
const mockOnLocaleChange = vi.fn().mockResolvedValue(undefined);
const mockT = vi.fn((key: string) => key);

const mockStartupConfig = {
  startupPage: 'lastPage',
  customStartupUrl: 'https://custom.com',
  closeStrategy: 'minimize',
  rememberWindowBounds: true,
  searchEngine: 'bing',
  customSearchUrl: 'https://www.bing.com/search?q={query}'
};

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(window, 'wingman', {
    value: {
      settings: {
        getStartupConfig: vi.fn().mockResolvedValue(mockStartupConfig),
        getAutoStart: vi.fn().mockResolvedValue(true),
        setAutoStart: vi.fn().mockResolvedValue(undefined),
        setStartupPage: vi.fn().mockResolvedValue(undefined),
        setCustomStartupUrl: vi.fn().mockResolvedValue(undefined),
        setCloseStrategy: vi.fn().mockResolvedValue(undefined),
        setRememberWindowBounds: vi.fn().mockResolvedValue(undefined),
        setSearchEngine: vi.fn().mockResolvedValue(undefined),
        setCustomSearchUrl: vi.fn().mockResolvedValue(undefined)
      },
      userData: {
        clearHistory: vi.fn().mockResolvedValue([])
      }
    },
    writable: true,
    configurable: true
  });
});

describe('useSettingsPanel - 初始化', () => {
  it('应从 bootState 同步初始设置', async () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );

    await waitFor(() => {
      expect(result.current.autoStart).toBe(true);
      expect(result.current.startupPage).toBe('lastPage');
      expect(result.current.customUrl).toBe('https://custom.com');
      expect(result.current.closeStrategy).toBe('minimize');
      expect(result.current.rememberBounds).toBe(true);
    });
  });

  it('应暴露语言选项列表', () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );
    expect(result.current.langOptions).toHaveLength(2);
    expect(result.current.langOptions[0].value).toBe('zh-CN');
    expect(result.current.langOptions[1].value).toBe('en-US');
  });
});

describe('useSettingsPanel - 操作', () => {
  it('handleAutoStartChange 应更新状态并调用 IPC', async () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );

    await waitFor(() => expect(result.current.autoStart).toBe(true));

    await act(async () => {
      await result.current.handleAutoStartChange(false);
    });

    expect(result.current.autoStart).toBe(false);
    expect(window.wingman.settings.setAutoStart).toHaveBeenCalledWith(false);
  });

  it('handleStartupPageChange 应更新状态并调用 IPC', async () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );

    await waitFor(() => expect(result.current.startupPage).toBe('lastPage'));

    await act(async () => {
      await result.current.handleStartupPageChange('home');
    });

    expect(result.current.startupPage).toBe('home');
    expect(window.wingman.settings.setStartupPage).toHaveBeenCalledWith('home');
  });

  it('handleCloseStrategyChange 应更新状态并调用 IPC', async () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );

    await waitFor(() => expect(result.current.closeStrategy).toBe('minimize'));

    await act(async () => {
      await result.current.handleCloseStrategyChange('quit');
    });

    expect(result.current.closeStrategy).toBe('quit');
    expect(window.wingman.settings.setCloseStrategy).toHaveBeenCalledWith('quit');
  });

  it('handleRememberBoundsChange 应更新状态并调用 IPC', async () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );

    await waitFor(() => expect(result.current.rememberBounds).toBe(true));

    await act(async () => {
      await result.current.handleRememberBoundsChange(false);
    });

    expect(result.current.rememberBounds).toBe(false);
    expect(window.wingman.settings.setRememberWindowBounds).toHaveBeenCalledWith(false);
  });

  it('handleClearHistory 应调用 IPC 并显示 OSD', async () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );

    await act(async () => {
      await result.current.handleClearHistory();
    });

    expect(window.wingman.userData.clearHistory).toHaveBeenCalled();
    expect(mockShowOSD).toHaveBeenCalledWith('settings.historyCleared');
  });

  it('handleLocaleChange 应调用 onLocaleChange 回调', async () => {
    const { result } = renderHook(() =>
      useSettingsPanel('zh-CN', mockOnLocaleChange, mockShowOSD, mockT as never)
    );

    await act(async () => {
      await result.current.handleLocaleChange('en-US');
    });

    expect(mockOnLocaleChange).toHaveBeenCalledWith('en-US');
  });
});
