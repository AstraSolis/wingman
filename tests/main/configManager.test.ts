// configManager 单元测试
// 使用临时目录隔离，不依赖 Electron app

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// mock electron，避免 app.getPath 调用
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/userData')
  }
}));

// 每次测试重新导入，避免模块级状态污染
async function freshImport() {
  vi.resetModules();
  vi.mock('electron', () => ({
    app: { getPath: vi.fn(() => '/mock/userData') }
  }));
  return import('../../src/main/configManager');
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'wingman-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  vi.resetModules();
});

describe('init - 首次启动（无配置文件）', () => {
  it('应使用默认配置', async () => {
    const cm = await freshImport();
    cm.init(join(tmpDir, 'config.json'));
    const config = cm.getAll();
    expect(config.locale).toBe('zh-CN');
    expect(config.opacity).toBe(0.85);
    expect(config.isClickThrough).toBe(false);
    expect(config.favorites).toEqual([]);
    expect(config.history).toEqual([]);
    expect(config.dockItems).toEqual([]);
    expect(config.startupPage).toBe('lastPage');
    expect(config.closeStrategy).toBe('minimize');
    expect(config.rememberWindowBounds).toBe(true);
    expect(config.windowBounds).toBeNull();
  });
});

describe('init - 读取现有配置文件', () => {
  it('应合并磁盘配置与默认值', async () => {
    const configPath = join(tmpDir, 'config.json');
    writeFileSync(configPath, JSON.stringify({ locale: 'en-US', opacity: 0.5 }), 'utf-8');

    const cm = await freshImport();
    cm.init(configPath);

    expect(cm.get('locale')).toBe('en-US');
    expect(cm.get('opacity')).toBe(0.5);
    // 磁盘未写的字段应保留默认值
    expect(cm.get('isClickThrough')).toBe(false);
    expect(cm.get('favorites')).toEqual([]);
  });

  it('配置文件损坏时应回退为默认值', async () => {
    const configPath = join(tmpDir, 'config.json');
    writeFileSync(configPath, '{ invalid json @@', 'utf-8');

    const cm = await freshImport();
    cm.init(configPath);

    expect(cm.get('locale')).toBe('zh-CN');
    expect(cm.get('opacity')).toBe(0.85);
  });
});

describe('get / set', () => {
  it('set 后 get 应返回新值', async () => {
    const cm = await freshImport();
    cm.init(join(tmpDir, 'config.json'));

    cm.set('locale', 'en-US');
    expect(cm.get('locale')).toBe('en-US');
  });

  it('set 相同值（原始类型）不应触发 debounce', async () => {
    const cm = await freshImport();
    cm.init(join(tmpDir, 'config.json'));

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    cm.set('locale', 'zh-CN'); // 与默认值相同
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it('set 对象类型应始终触发保存', async () => {
    const cm = await freshImport();
    cm.init(join(tmpDir, 'config.json'));

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    cm.set('favorites', []); // 即使是空数组
    expect(setTimeoutSpy).toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it('getAll 应返回副本而非引用', async () => {
    const cm = await freshImport();
    cm.init(join(tmpDir, 'config.json'));

    const all = cm.getAll();
    all.locale = 'en-US';
    expect(cm.get('locale')).toBe('zh-CN'); // 原始值未被污染
  });
});

describe('flush - 持久化', () => {
  it('flush 应将配置写入磁盘', async () => {
    const configPath = join(tmpDir, 'config.json');
    const cm = await freshImport();
    cm.init(configPath);

    cm.set('locale', 'en-US');
    cm.flush();

    // 文件应存在
    expect(existsSync(configPath)).toBe(true);

    // 文件内容应包含新值
    const { readFileSync } = await import('fs');
    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.locale).toBe('en-US');
  });

  it('flush 多次调用应是幂等的', async () => {
    const configPath = join(tmpDir, 'config.json');
    const cm = await freshImport();
    cm.init(configPath);

    cm.set('opacity', 0.6);
    cm.flush();
    cm.flush(); // 第二次不应报错

    const { readFileSync } = await import('fs');
    const saved = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(saved.opacity).toBe(0.6);
  });

  it('flush 应使用原子写（先 .tmp 再 rename）不留临时文件', async () => {
    const configPath = join(tmpDir, 'config.json');
    const cm = await freshImport();
    cm.init(configPath);
    cm.flush();

    expect(existsSync(configPath + '.tmp')).toBe(false);
    expect(existsSync(configPath)).toBe(true);
  });
});

describe('配置字段边界', () => {
  it('favorites 和 history 应支持数组元素操作', async () => {
    const cm = await freshImport();
    cm.init(join(tmpDir, 'config.json'));

    const item = { title: '测试', url: 'https://example.com', timestamp: Date.now() };
    cm.set('favorites', [item]);
    expect(cm.get('favorites')).toHaveLength(1);
    expect(cm.get('favorites')[0].url).toBe('https://example.com');
  });

  it('windowBounds 应支持设置和清除', async () => {
    const cm = await freshImport();
    cm.init(join(tmpDir, 'config.json'));

    const bounds = { x: 100, y: 200, width: 800, height: 600 };
    cm.set('windowBounds', bounds);
    expect(cm.get('windowBounds')).toEqual(bounds);

    cm.set('windowBounds', null);
    expect(cm.get('windowBounds')).toBeNull();
  });
});
