const { spawn } = require('child_process');
const path = require('path');

const isDev = process.argv.includes('--dev');

function exitWithChildCode(child) {
  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

function run() {
  if (process.platform !== 'win32') {
    // 非 Windows 无需处理编码，直接运行
    const bin = isDev
      ? path.join(__dirname, '..', 'node_modules', '.bin', 'electron-vite')
      : require('electron/cli');
    const args = isDev ? ['dev'] : ['.'];
    exitWithChildCode(spawn(process.execPath, [bin, ...args], { stdio: 'inherit' }));
    return;
  }

  // Windows：先执行 chcp 65001 切换控制台编码为 UTF-8
  const binExt = isDev ? 'electron-vite.cmd' : 'electron.cmd';
  const binPath = path.win32.join(__dirname, '..', 'node_modules', '.bin', binExt);
  const cmdArgs = isDev
    ? ['/d', '/c', 'chcp', '65001', '>', 'nul', '&', 'call', binPath, 'dev']
    : ['/d', '/c', 'chcp', '65001', '>', 'nul', '&', 'call', binPath, '.'];

  const child = spawn('cmd.exe', cmdArgs, {
    stdio: 'inherit',
    windowsVerbatimArguments: true
  });
  exitWithChildCode(child);
}

run();
