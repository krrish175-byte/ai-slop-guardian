import os from 'node:os'

const WINDOWS = os.platform() === 'win32'
export const printPathCmd = WINDOWS ? 'set PATH' : 'printenv PATH'

/**
 * @param {string} randomHash
 * @returns {string}
 */
export function getBasePath(randomHash) {
  return WINDOWS
    ? `C:\\Users\\glen\\AppData\\Local\\npm-cache\\_npx\\${randomHash}\\node_modules`
    : `/Users/glen/.npm/_npx/${randomHash}/node_modules`
}

/**
 * @param {string} randomHash
 * @returns {string}
 */
export function getNpxPath(randomHash) {
  return WINDOWS
    ? `C:\\Users\\glen\\node_modules\\.bin;C:\\Users\\node_modules\\.bin;C:\\node_modules\\.bin;C:\\Program Files\\nodejs\\node_modules\\npm\\node_modules\\@npmcli\\run-script\\lib\\node-gyp-bin;C:\\Users\\glen\\AppData\\Local\\npm-cache\\_npx\\${randomHash}\\node_modules\\.bin;C:\\Users\\glen\\bin;C:\\Program Files\\Git\\mingw64\\bin;C:\\Program Files\\Git\\usr\\local\\bin;C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\usr\\bin;C:\\Program Files\\Git\\mingw64\\bin;C:\\Program Files\\Git\\usr\\bin;C:\\Users\\glen\\bin;C:\\Program Files (x86)\\Razer Chroma SDK\\bin;C:\\Program Files\\Razer Chroma SDK\\bin;C:\\Program Files (x86)\\Razer\\ChromaBroadcast\\bin;C:\\Program Files\\Razer\\ChromaBroadcast\\bin;C:\\Python38\\Scripts;C:
    Python38;C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0;C:\\Windows\\System32\\OpenSSH;C:\\Program Files (x86)\\NVIDIA Corporation\\PhysX\\Common;C:\\WINDOWS\\system32;C:\\WINDOWS;C:\\WINDOWS\\System32\\Wbem;C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0;C:\\WINDOWS\\System32\\OpenSSH;C:\\Program Files\\nodejs;C:\\ProgramData\\chocolatey\\bin;C:\\Program Files\\dotnet;C:\\WINDOWS\\system32\\config\\systemprofile\\AppData\\Local\\Microsoft\\WindowsApps;C:\\Program Files\\Docker\\Docker\\resources\\bin;C:\\ProgramData\\DockerDesktop\\version-bin;C:\\Program Files\\NVIDIA Corporation\\NVIDIA NvDLISR;C:\\Program Files\\Cloudflare\\Cloudflare WARP;C:\\Program Files\\Git\\cmd;C:\\Users\\glen\\AppData\\Local\\Microsoft\\WindowsApps;C:\\Program Files (x86)\\Nmap;C:\\Program Files\\JetBrains\\WebStorm 2020.3\\bin;C:\\Users\\glen\\AppData\\Local\\Programs\\Microsoft VS Code\\bin;C:\\Users\\glen\\AppData\\Roaming\\npm;C:\\Program Files\\Git\\usr\\bin\\vendor_perl;C:\\Program Files\\Git\\usr\\bin\\core_perl`
    : `/my/local/pwd/node_modules/.bin:/my/local/node_modules/.bin:/my/node_modules/.bin:/node_modules/.bin:/Users/glen/.nvm/versions/node/v18.3.0/lib/node_modules/npm/node_modules/@npmcli/run-script/lib/node-gyp-bin:/Users/glen/.npm/_npx/${randomHash}/node_modules/.bin:/Users/glen/go/bin:/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/usr/X11/bin:/usr/local/go/bin`
}
