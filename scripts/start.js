const { spawn } = require('child_process');
const path = require('path');

function exitWithChildCode(child) {
  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

function startElectron() {
  if (process.platform === 'win32') {
    const electronCmd = path.win32.join(__dirname, '..', 'node_modules', '.bin', 'electron.cmd');
    const child = spawn('cmd.exe', ['/d', '/c', 'chcp', '65001', '>', 'nul', '&', 'call', electronCmd, '.'], {
      stdio: 'inherit',
      windowsVerbatimArguments: true
    });
    exitWithChildCode(child);
    return;
  }

  const electronCli = require('electron/cli');
  const child = spawn(process.execPath, [electronCli, '.'], {
    stdio: 'inherit'
  });
  exitWithChildCode(child);
}

startElectron();
