// useWingman hook 单元测试
// @vitest-environment jsdom

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWingman } from '../../src/renderer/hooks/useWingman';

describe('useWingman - loadUrl', () => {
  function getLoadUrl(engine?: string, customUrl?: string) {
    const { result } = renderHook(() => useWingman(engine, customUrl));
    return result.current.loadUrl;
  }

  it('空字符串应返回 null', () => {
    const loadUrl = getLoadUrl();
    expect(loadUrl('')).toBeNull();
    expect(loadUrl('   ')).toBeNull();
  });

  it('含空格的输入应视为搜索词', () => {
    const loadUrl = getLoadUrl();
    const result = loadUrl('how to play minecraft');
    expect(result).toBe('https://www.bing.com/search?q=how%20to%20play%20minecraft');
  });

  it('已有 https:// 前缀的 URL 应原样返回', () => {
    const loadUrl = getLoadUrl();
    expect(loadUrl('https://example.com')).toBe('https://example.com');
  });

  it('已有 http:// 前缀的 URL 应原样返回', () => {
    const loadUrl = getLoadUrl();
    expect(loadUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  it('无协议的域名应补全 https://', () => {
    const loadUrl = getLoadUrl();
    expect(loadUrl('example.com')).toBe('https://example.com');
    expect(loadUrl('www.google.com')).toBe('https://www.google.com');
  });

  it('子域名 URL 应补全 https://', () => {
    const loadUrl = getLoadUrl();
    expect(loadUrl('docs.example.com/guide')).toBe('https://docs.example.com/guide');
  });

  it('纯关键词（无点）应转为 Bing 搜索', () => {
    const loadUrl = getLoadUrl();
    const result = loadUrl('minecraft');
    expect(result).toBe('https://www.bing.com/search?q=minecraft');
  });

  it('中文搜索词应正确编码', () => {
    const loadUrl = getLoadUrl();
    const result = loadUrl('我的世界攻略');
    expect(result).toContain('bing.com/search?q=');
    expect(result).toContain(encodeURIComponent('我的世界攻略'));
  });

  it('Google 引擎应生成 google.com 搜索链接', () => {
    const loadUrl = getLoadUrl('google');
    expect(loadUrl('minecraft')).toBe('https://www.google.com/search?q=minecraft');
  });

  it('百度引擎应生成 baidu.com 搜索链接', () => {
    const loadUrl = getLoadUrl('baidu');
    expect(loadUrl('我的世界')).toContain('baidu.com/s?wd=');
  });

  it('自定义引擎应将 {query} 替换为编码后的搜索词', () => {
    const loadUrl = getLoadUrl('custom', 'https://search.example.com/?q={query}');
    expect(loadUrl('test search')).toBe('https://search.example.com/?q=test%20search');
  });

  it('自定义引擎无 {query} 时追加在末尾', () => {
    const loadUrl = getLoadUrl('custom', 'https://search.example.com/?q=');
    expect(loadUrl('hello')).toBe('https://search.example.com/?q=hello');
  });
});
