// 窗口绑定追踪模块 — 监控指定窗口的前台状态并自动控制 Wingman 主窗口显隐

import { spawn } from 'child_process';
import type { ChildProcess, SpawnOptions } from 'child_process';
import * as windowManager from './windowManager';
import * as configManager from './configManager';
import { createLogger } from './logger';

const logger = createLogger('WindowTracker');

// 应用自身的窗口标题前缀，用于识别自身获焦时不改变可见性
const APP_TITLE_PREFIX = 'Wingman';

// 当前绑定的窗口标题集合
const boundWindows = new Set<string>();

// 监控状态
let isTracking = false;
let monitorProcess: ChildProcess | null = null;
let lastForegroundTitle = '';

// ─── Windows：PowerShell + P/Invoke ──────────────────────────────────────────
// 每 350ms 输出一次当前前台窗口标题
const WIN_MONITOR_SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WingmanFgWin {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
'@
while ($true) {
    try {
        $h = [WingmanFgWin]::GetForegroundWindow()
        $b = New-Object System.Text.StringBuilder 512
        [WingmanFgWin]::GetWindowText($h, $b, 512) | Out-Null
        Write-Output $b.ToString()
    } catch {}
    Start-Sleep -Milliseconds 350
}
`.trim();

// ─── macOS：bash + osascript ──────────────────────────────────────────────────
// 每次调用 osascript 约 50-150ms，加 sleep 350ms 共约 400-500ms/次
const MAC_MONITOR_SCRIPT = `
while true; do
  osascript -e '
    try
      tell application "System Events"
        name of first process where it is frontmost
      end tell
    on error
      ""
    end try
  ' 2>/dev/null
  sleep 0.35
done
`.trim();

// ─── Linux：bash + xdotool（X11）─────────────────────────────────────────────
const LINUX_MONITOR_SCRIPT = `
while true; do
  xdotool getactivewindow getwindowname 2>/dev/null || echo ""
  sleep 0.35
done
`.trim();

// ─── 平台命令选择 ─────────────────────────────────────────────────────────────
type SpawnCmd = { cmd: string; args: string[]; opts?: SpawnOptions };

function getMonitorCmd(): SpawnCmd | null {
  switch (process.platform) {
    case 'win32':
      return {
        cmd: 'powershell',
        args: ['-NoProfile', '-Command', WIN_MONITOR_SCRIPT],
        opts: { windowsHide: true }
      };
    case 'darwin':
      return { cmd: 'bash', args: ['-c', MAC_MONITOR_SCRIPT] };
    case 'linux':
      return { cmd: 'bash', args: ['-c', LINUX_MONITOR_SCRIPT] };
    default:
      return null;
  }
}


function handleForegroundTitle(title: string): void {
  if (title === lastForegroundTitle) return;
  lastForegroundTitle = title;

  // Wingman 自身获焦时不改变可见性，让用户可以正常操作
  if (title && title.startsWith(APP_TITLE_PREFIX)) return;

  // 检查是否有绑定窗口与当前前台匹配（空 title 表示回到桌面，不匹配任何绑定）
  const isBound = !!title && Array.from(boundWindows).some(
    (bound) => title === bound || title.includes(bound) || bound.includes(title)
  );

  if (isBound) {
    windowManager.showWindow();
  } else {
    windowManager.hideWindow();
  }
}

// ─── 监控进程管理 ─────────────────────────────────────────────────────────
function startTracking(): void {
  if (isTracking) return;

  const cmd = getMonitorCmd();
  if (!cmd) {
    logger.warn(`窗口绑定追踪不支持当前平台: ${process.platform}`);
    return;
  }

  isTracking = true;
  logger.info('启动前台窗口监控');

  monitorProcess = spawn(cmd.cmd, cmd.args, cmd.opts ?? {});
  monitorProcess.stdout?.setEncoding('utf8');

  let buffer = '';
  monitorProcess.stdout?.on('data', (data: string) => {
    buffer += data;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      handleForegroundTitle(line.trim());
    }
  });

  monitorProcess.on('exit', (code) => {
    monitorProcess = null;
    if (isTracking) {
      // 意外退出则延迟重启
      logger.warn(`监控进程意外退出 (code=${code})，2 秒后重启`);
      isTracking = false;
      setTimeout(() => {
        if (boundWindows.size > 0) startTracking();
      }, 2000);
    }
  });

  monitorProcess.on('error', (err) => {
    logger.error('监控进程错误:', err);
    isTracking = false;
  });
}

function stopTracking(): void {
  if (!isTracking) return;
  isTracking = false;
  lastForegroundTitle = '';

  if (monitorProcess) {
    monitorProcess.kill();
    monitorProcess = null;
  }

  logger.info('前台窗口监控已停止');
}

// ─── 枚举脚本（各平台）──────────────────────────────────────────────────────

// Windows：通过 EnumWindows P/Invoke，比 Get-Process.MainWindowTitle 更全面
const WIN_ENUM_SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class WingmanWinEnum {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetShellWindow();
    [DllImport("user32.dll")] public static extern IntPtr GetParent(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
    public static List<string> GetVisibleWindowTitles() {
        var titles = new List<string>();
        IntPtr shell = GetShellWindow();
        EnumWindows((hWnd, _) => {
            if (!IsWindowVisible(hWnd)) return true;
            if (hWnd == shell) return true;
            if (GetParent(hWnd) != IntPtr.Zero) return true;
            // GWL_EXSTYLE = -20, WS_EX_TOOLWINDOW = 0x80，过滤工具窗口
            if ((GetWindowLong(hWnd, -20) & 0x80) != 0) return true;
            int len = GetWindowTextLength(hWnd);
            if (len == 0) return true;
            var sb = new StringBuilder(len + 1);
            GetWindowText(hWnd, sb, sb.Capacity);
            string t = sb.ToString().Trim();
            if (t.Length > 0) titles.Add(t);
            return true;
        }, IntPtr.Zero);
        return titles;
    }
}
'@
[WingmanWinEnum]::GetVisibleWindowTitles() | Sort-Object -Unique
`.trim();

// macOS：列出所有可见应用进程名称（首次运行需授权 Automation 权限）
const MAC_ENUM_SCRIPT = `
osascript -e '
  set output to ""
  tell application "System Events"
    set procs to every application process where visible is true
    repeat with p in procs
      set output to output & (name of p) & "\n"
    end repeat
  end tell
  output
' 2>/dev/null
`.trim();

// Linux（X11）：wmctrl 枚举，fallback xdotool
// wmctrl -l 格式：0x000... desktopNum hostname Title...
const LINUX_ENUM_SCRIPT = `
if command -v wmctrl >/dev/null 2>&1; then
  wmctrl -l | awk '{$1=$2=$3=""; sub(/^[[:space:]]+/,""); print}' | grep -v '^$' | sort -u
elif command -v xdotool >/dev/null 2>&1; then
  xdotool search --onlyvisible --name "" 2>/dev/null | xargs -I{} xdotool getwindowname {} 2>/dev/null | sort -u | grep -v '^$'
fi
`.trim();

function getEnumCmd(): SpawnCmd | null {
  switch (process.platform) {
    case 'win32':
      return {
        cmd: 'powershell',
        args: ['-NoProfile', '-NonInteractive', '-Command', WIN_ENUM_SCRIPT],
        opts: { windowsHide: true }
      };
    case 'darwin':
      return { cmd: 'bash', args: ['-c', MAC_ENUM_SCRIPT] };
    case 'linux':
      return { cmd: 'bash', args: ['-c', LINUX_ENUM_SCRIPT] };
    default:
      return null;
  }
}

// ─── 公开 API ──────────────────────────────────────────────────────────────

/**
 * 初始化：从配置文件加载持久化的绑定窗口并启动监控
 */
export function init(): void {
  const saved = configManager.get('boundWindows');
  if (saved && saved.length > 0) {
    for (const t of saved) {
      if (t.trim()) boundWindows.add(t.trim());
    }
    startTracking();
    logger.info(`已从配置恢复 ${boundWindows.size} 个绑定窗口`);
  }
}

/**
 * 获取当前所有可见顶层窗口/应用的标题列表
 */
export function getWindowList(): Promise<string[]> {
  const cmd = getEnumCmd();
  if (!cmd) return Promise.resolve([]);

  return new Promise((resolve) => {
    const ps = spawn(cmd.cmd, cmd.args, cmd.opts ?? {});
    ps.stdout?.setEncoding('utf8');

    let output = '';
    ps.stdout?.on('data', (data: string) => {
      output += data;
    });

    // 超时保护：合并在同一个 close 处理中，避免重复注册
    const timer = setTimeout(() => {
      ps.kill();
      resolve([]);
    }, 8000);

    ps.on('close', () => {
      clearTimeout(timer);
      const titles = output
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith(APP_TITLE_PREFIX));
      resolve(titles);
    });

    ps.on('error', () => {
      clearTimeout(timer);
      resolve([]);
    });
  });
}

/**
 * 获取当前绑定的窗口标题列表
 */
export function getBoundWindows(): string[] {
  return Array.from(boundWindows);
}

/**
 * 设置绑定窗口列表（完整替换）并持久化到配置
 */
export function setBoundWindows(titles: string[]): void {
  boundWindows.clear();
  for (const t of titles) {
    if (t.trim()) boundWindows.add(t.trim());
  }

  // 持久化
  configManager.set('boundWindows', Array.from(boundWindows));

  if (boundWindows.size > 0) {
    startTracking();
  } else {
    stopTracking();
    // 解绑全部时恢复窗口显示
    windowManager.showWindow();
  }

  logger.info(`绑定窗口已更新，共 ${boundWindows.size} 个`);
}

/**
 * 应用退出前清理监控进程
 */
export function cleanup(): void {
  stopTracking();
}
