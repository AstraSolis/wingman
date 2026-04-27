// 日志系统 — 基于 electron-log，统一主/渲染进程的落文件与格式

import log from 'electron-log/main';
import { app } from 'electron';

/** 需要在 URL query string 中脱敏的参数名（全小写匹配） */
const SENSITIVE_PARAMS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'password',
  'passwd',
  'pwd',
  'secret',
  'api_key',
  'apikey',
  'key',
  'auth',
  'authorization',
  'credential',
]);

/**
 * 对 URL 中的敏感查询参数进行脱敏。
 * 安全失败时返回原始字符串，绝不抛出异常。
 */
export function sanitizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    let changed = false;
    for (const param of SENSITIVE_PARAMS) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, '***');
        changed = true;
      }
    }
    return changed ? parsed.toString() : rawUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * 初始化日志系统。
 * 必须在 app.whenReady() 最早处调用（早于 window / IPC 初始化）。
 */
export function initLogger(): void {
  // 启用 IPC 桥接，使 renderer 端可经 preload 转发日志
  log.initialize();

  // ── 文件日志 ──────────────────────────────────────────────
  // info 及以上等级落文件；单文件上限 5 MB，超限自动归档为 .old.log
  log.transports.file.level = 'info';
  log.transports.file.maxSize = 5 * 1024 * 1024;
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {scope} {text}';

  // ── 控制台日志 ────────────────────────────────────────────
  // 开发模式输出 debug，打包后关闭（避免泄露内部信息）
  log.transports.console.level = app.isPackaged ? false : 'debug';
  log.transports.console.format = '[{h}:{i}:{s}.{ms}] [{level}] {scope} {text}';

  // ── 异常兜底 ──────────────────────────────────────────────
  // 自动捕获未处理的 uncaughtException / unhandledRejection 写入文件
  log.errorHandler.startCatching({ showDialog: false });
}

/** 获取当前日志文件的绝对路径（可供设置界面展示） */
export function getLogFilePath(): string {
  return log.transports.file.getFile().path;
}

/** 创建带有模块标签的 logger 实例 */
export function createLogger(module: string) {
  const scoped = log.scope(module);
  return {
    error: (message: string, ...args: unknown[]) => scoped.error(message, ...args),
    warn: (message: string, ...args: unknown[]) => scoped.warn(message, ...args),
    info: (message: string, ...args: unknown[]) => scoped.info(message, ...args),
    debug: (message: string, ...args: unknown[]) => scoped.debug(message, ...args),
  };
}

/** 有效的日志级别集合 */
const VALID_LEVELS = new Set(['error', 'warn', 'info', 'debug']);
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * 处理来自 renderer 进程经 IPC 转发的日志。
 * 对所有入参进行严格校验与截断，防止日志注入攻击。
 */
export function handleRendererLog(
  rawLevel: unknown,
  rawScope: unknown,
  rawMessage: unknown,
  ...args: unknown[]
): void {
  if (typeof rawLevel !== 'string' || !VALID_LEVELS.has(rawLevel)) return;
  const level = rawLevel as LogLevel;

  // scope 仅允许字母、数字和 : / _ - 字符，防止控制字符注入
  const scope = String(rawScope ?? '')
    .replace(/[^a-zA-Z0-9:/_-]/g, '')
    .slice(0, 64);

  const message = String(rawMessage ?? '').slice(0, 4096);

  const scoped = log.scope(`renderer:${scope}`);
  scoped[level](message, ...args);
}
