/// <reference types="vite/client" />
// 渲染进程日志工具 — 通过 IPC 将日志统一转发至主进程落文件

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

function send(level: LogLevel, scope: string, message: string, ...args: unknown[]): void {
  // 开发环境同步输出到 DevTools console，方便实时调试
  if (import.meta.env.DEV) {
    const fn = (console[level] as typeof console.log | undefined) ?? console.log;
    fn(`[${scope}] ${message}`, ...args);
  }

  // 通过 preload 桥接转发到主进程统一落文件
  try {
    window.wingman?.log?.(level, scope, message, ...args);
  } catch {
    // preload 尚未就绪时静默降级，避免循环错误
  }
}

/** 创建带模块标签的渲染进程 logger */
export function createLogger(scope: string) {
  return {
    error: (message: string, ...args: unknown[]) => send('error', scope, message, ...args),
    warn: (message: string, ...args: unknown[]) => send('warn', scope, message, ...args),
    info: (message: string, ...args: unknown[]) => send('info', scope, message, ...args),
    debug: (message: string, ...args: unknown[]) => send('debug', scope, message, ...args),
  };
}
