// useI18n hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useI18n } from '../../src/renderer/hooks/useI18n';

const zhTranslations = {
  app: { name: '翼手' },
  osd: { opacity: '透明度: {value}%' },
  home: { favAdded: '已收藏' }
};

const enFallback = {
  app: { name: 'Wingman' },
  osd: { opacity: 'Opacity: {value}%' },
  home: { favAdded: 'Added to favorites' },
  extra: { onlyInFallback: 'fallback only text' }
};

beforeEach(() => {
  Object.defineProperty(window, 'wingman', {
    value: {
      i18n: {
        getData: vi.fn().mockResolvedValue({
          locale: 'zh-CN',
          translations: zhTranslations,
          fallback: enFallback
        }),
        setLocale: vi.fn().mockResolvedValue({
          locale: 'en-US',
          translations: enFallback,
          fallback: enFallback
        })
      }
    },
    writable: true,
    configurable: true
  });
});

describe('useI18n - 初始化', () => {
  it('初始 ready 应为 false，加载完成后为 true', async () => {
    const { result } = renderHook(() => useI18n());
    expect(result.current.ready).toBe(false);

    await waitFor(() => expect(result.current.ready).toBe(true));
  });

  it('加载完成后 locale 应为 zh-CN', async () => {
    const { result } = renderHook(() => useI18n());
    await waitFor(() => expect(result.current.locale).toBe('zh-CN'));
  });
});

describe('useI18n - t() 翻译函数', () => {
  it('应返回嵌套 key 的翻译', async () => {
    const { result } = renderHook(() => useI18n());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.t('app.name')).toBe('翼手');
  });

  it('应替换 {value} 插值变量', async () => {
    const { result } = renderHook(() => useI18n());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.t('osd.opacity', { value: '85' })).toBe('透明度: 85%');
  });

  it('key 不存在于主翻译时应回退到 fallback', async () => {
    const { result } = renderHook(() => useI18n());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.t('extra.onlyInFallback')).toBe('fallback only text');
  });

  it('key 在主翻译和 fallback 中均不存在时应原样返回 key', async () => {
    const { result } = renderHook(() => useI18n());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('无 vars 参数时应原样返回翻译文本（不做多余替换）', async () => {
    const { result } = renderHook(() => useI18n());
    await waitFor(() => expect(result.current.ready).toBe(true));

    expect(result.current.t('home.favAdded')).toBe('已收藏');
  });
});

describe('useI18n - setLocale', () => {
  it('setLocale 后应更新 locale 和翻译内容', async () => {
    const { result } = renderHook(() => useI18n());
    await waitFor(() => expect(result.current.ready).toBe(true));

    await act(async () => {
      await result.current.setLocale('en-US');
    });

    expect(result.current.locale).toBe('en-US');
    expect(result.current.t('app.name')).toBe('Wingman');
  });
});
