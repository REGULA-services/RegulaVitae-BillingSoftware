import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, clipboard } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import QRCode from 'qrcode';

// Set App User Model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.madrasorthoclinic.localhost');
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Start Express API server directly inside process
try {
  require('../server/server');
} catch (err) {
  console.error('[LOCAL-SERVER] Failed to start local Express server:', err);
}

let controllerWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const PORT = process.env.PORT || 4848;

function getPrimaryLanIp(): { ip: string; isWifi: boolean; name: string } {
  try {
    const interfaces = os.networkInterfaces();
    const list: { ip: string; isWifi: boolean; isPhysical: boolean; name: string }[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.') && net.address !== '0.0.0.0') {
          const isWifi = /wi-?fi|wlan|wireless|802\.11/i.test(name);
          const isVirtual = /vethernet|hyper-v|vmware|virtualbox|vbox|wsl|docker|nord|openvpn|wireguard|zerotier|tailscale|teredo|loopback/i.test(name);
          list.push({ ip: net.address, isWifi, isPhysical: !isVirtual, name });
        }
      }
    }
    list.sort((a, b) => {
      const scoreA = (a.isWifi ? 10 : 0) + (a.isPhysical ? 5 : 0);
      const scoreB = (b.isWifi ? 10 : 0) + (b.isPhysical ? 5 : 0);
      return scoreB - scoreA;
    });
    return list.length > 0 ? { ip: list[0].ip, isWifi: list[0].isWifi, name: list[0].name } : { ip: '127.0.0.1', isWifi: false, name: 'Localhost' };
  } catch {
    return { ip: '127.0.0.1', isWifi: false, name: 'Localhost' };
  }
}

async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, { width: 220, margin: 1 });
  } catch {
    return '';
  }
}

async function createControllerWindow() {
  const lanInfo = getPrimaryLanIp();
  const customUrl = `http://madrasorthoclinic.local:${PORT}`;
  const customMobileUrl = `${customUrl}/?view=mobile`;
  const localhostUrl = `http://localhost:${PORT}`;
  const wifiUrl = `http://${lanInfo.ip}:${PORT}`;
  const wifiMobileUrl = `${wifiUrl}/?view=mobile`;
  const qrCustomDataUrl = await generateQrDataUrl(customMobileUrl);
  const qrWifiDataUrl = await generateQrDataUrl(wifiMobileUrl);

  const iconPath = process.platform === 'win32'
    ? (fs.existsSync(path.join(app.getAppPath(), 'build', 'icon.ico'))
        ? path.join(app.getAppPath(), 'build', 'icon.ico')
        : path.join(app.getAppPath(), 'public', 'icon.png'))
    : path.join(app.getAppPath(), 'public', 'icon.png');

  let logoDataUri = '';
  try {
    const pngCandidates = [
      path.join(app.getAppPath(), 'public', 'icon.png'),
      path.join(app.getAppPath(), 'build', 'icon.png'),
      path.join(__dirname, '../../../public/icon.png'),
      path.join(__dirname, '../../../build/icon.png')
    ];
    for (const candidate of pngCandidates) {
      if (fs.existsSync(candidate)) {
        logoDataUri = `data:image/png;base64,${fs.readFileSync(candidate).toString('base64')}`;
        break;
      }
    }
  } catch {}

  controllerWindow = new BrowserWindow({
    width: 920,
    height: 760,
    minWidth: 820,
    minHeight: 700,
    backgroundColor: '#fffbf7',
    title: "MADRAS ORTHO CLINIC - Local Host & Wi-Fi Server",
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>MADRAS ORTHO CLINIC - Local Host & Wi-Fi Server</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: linear-gradient(145deg, #ffffff 0%, #fff8f3 55%, #ffedd5 100%);
        color: #0f172a;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        user-select: none;
      }
      .header {
        padding: 16px 26px 14px;
        background: #ffffff;
        border-top: 4px solid #c25222;
        border-bottom: 1.5px solid #fed7aa;
        box-shadow: 0 2px 10px rgba(194, 82, 34, 0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .brand-wrap { display: flex; align-items: center; gap: 12px; }
      .brand-logo {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: #ffffff;
        border: 1.5px solid #fed7aa;
        padding: 2px;
        object-fit: cover;
        box-shadow: 0 3px 10px rgba(194, 82, 34, 0.12);
      }
      .clinic-title { font-size: 19px; font-weight: 800; letter-spacing: 0.3px; color: #c25222; }
      .clinic-sub { font-size: 12px; color: #64748b; margin-top: 2px; font-weight: 500; }
      .status-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ecfdf5;
        border: 1.5px solid #6ee7b7;
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 700;
        color: #047857;
      }
      .pulse-dot {
        width: 9px;
        height: 9px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.65);
        animation: pulse 1.8s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.45; transform: scale(0.85); }
      }
      .container {
        padding: 18px 26px;
        display: grid;
        grid-template-columns: 1fr 272px;
        gap: 18px;
        flex: 1;
        align-items: stretch;
      }
      .card {
        background: #ffffff;
        border: 1.5px solid #fed7aa;
        box-shadow: 0 6px 20px rgba(194, 82, 34, 0.06);
        border-radius: 16px;
        padding: 16px 18px;
        margin-bottom: 14px;
      }
      .card:last-child { margin-bottom: 0; }
      .card-primary {
        border: 1.5px solid #fb923c;
        background: linear-gradient(180deg, #ffffff 0%, #fffbf7 100%);
      }
      .card-title {
        font-size: 11.5px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.85px;
        color: #ea580c;
        margin-bottom: 9px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .url-box {
        background: #fff7ed;
        border: 1.5px solid #fdba74;
        padding: 9px 12px;
        border-radius: 11px;
        font-family: monospace;
        font-size: 13.5px;
        color: #c25222;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }
      .url-text {
        user-select: text;
        word-break: break-all;
        font-weight: 700;
      }
      .btn {
        cursor: pointer;
        border: none;
        outline: none;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        transition: all 0.16s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      .btn-primary { background: linear-gradient(135deg, #c25222, #ea580c); color: #ffffff; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.24); }
      .btn-primary:hover { background: linear-gradient(135deg, #9a3412, #c25222); transform: translateY(-1px); }
      .btn-orange-outline { background: #fff7ed; border: 1.5px solid #fdba74; color: #c2410c; }
      .btn-orange-outline:hover { background: #ffedd5; }
      .btn-secondary { background: #f8fafc; border: 1.5px solid #cbd5e1; color: #334155; }
      .btn-secondary:hover { background: #f1f5f9; border-color: #94a3b8; }
      .btn-emerald { background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.22); }
      .btn-emerald:hover { background: linear-gradient(135deg, #047857, #059669); transform: translateY(-1px); }
      .btn-amber { background: #fffbeb; border: 1.5px solid #f59e0b; color: #b45309; }
      .btn-amber:hover { background: #fef3c7; }
      .btn-copy { background: #ea580c; color: #ffffff; border: 1px solid #c25222; }
      .btn-copy:hover { background: #c25222; }
      .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
      .actions-row { display: flex; gap: 8px; margin-top: 11px; flex-wrap: wrap; }
      .qr-panel {
        background: #ffffff;
        border: 1.5px solid #fed7aa;
        box-shadow: 0 6px 20px rgba(194, 82, 34, 0.06);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .qr-tabs {
        display: flex;
        gap: 5px;
        margin-top: 8px;
        background: #fff7ed;
        padding: 4px;
        border-radius: 10px;
        border: 1px solid #fed7aa;
      }
      .qr-tab {
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 7px;
        border: none;
        cursor: pointer;
        color: #9a3412;
        background: transparent;
      }
      .qr-tab.active {
        background: linear-gradient(135deg, #c25222, #ea580c);
        color: #ffffff;
        box-shadow: 0 2px 6px rgba(234, 88, 12, 0.25);
      }
      .qr-img {
        width: 170px;
        height: 170px;
        background: #ffffff;
        padding: 8px;
        border-radius: 12px;
        border: 2px solid #fed7aa;
        margin: 12px 0 8px;
        box-shadow: 0 4px 14px rgba(194, 82, 34, 0.12);
      }
      .qr-note { font-size: 11px; color: #64748b; line-height: 1.45; }
      .footer {
        padding: 10px 26px;
        background: #fff7ed;
        border-top: 1.5px solid #fed7aa;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #475569;
        font-weight: 500;
      }
      .copy-toast {
        position: fixed;
        bottom: 48px;
        right: 26px;
        background: #059669;
        color: #fff;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 8px 24px rgba(5, 150, 105, 0.35);
        display: none;
        z-index: 100;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="brand-wrap">
        ${logoDataUri ? `<img class="brand-logo" src="${logoDataUri}" alt="Madras Ortho Clinic" />` : ''}
        <div>
          <div class="clinic-title">MADRAS ORTHO CLINIC PHARMACY</div>
          <div class="clinic-sub">Local Host &amp; Same Wi-Fi Network Server (Port ${PORT} · Adapter: ${lanInfo.name})</div>
        </div>
      </div>
      <div class="status-pill">
        <div class="pulse-dot"></div>
        <span>SERVER ACTIVE</span>
      </div>
    </div>

    <div class="container">
      <div class="main-left">
        <!-- Custom Clinic URL Card (Primary) -->
        <div class="card card-primary">
          <div class="card-title">Primary Custom Clinic URL (mDNS .local)</div>
          <div class="url-box">
            <span id="customUrl" class="url-text" style="font-size: 15px;">${customUrl}</span>
            <button type="button" class="btn btn-copy btn-sm" onclick="copyText('${customUrl}', this)">Copy</button>
          </div>
          <p style="font-size: 11.5px; color: #475569; margin-top: 9px; line-height: 1.45;">
            mDNS responder active on UDP 5353 (${lanInfo.ip}). On Android phones, keep <strong>Settings &rarr; Network &rarr; Private DNS</strong> set to <em>Off</em> or <em>Automatic</em> so <code style="color:#c25222;font-weight:700;">.local</code> resolves over Wi-Fi.
          </p>
          <div class="actions-row">
            <button type="button" class="btn btn-primary" onclick="openUrl('${customUrl}')">
              Open Custom URL in Browser
            </button>
            <button type="button" class="btn btn-orange-outline" onclick="openUrl('${customMobileUrl}')">
              Open Mobile UI Preview
            </button>
            <button type="button" class="btn btn-amber" onclick="enableMobileFirewall(this)">
              Enable Mobile Firewall (4848 / 5353)
            </button>
          </div>
        </div>

        <!-- Same Wi-Fi Network Card -->
        <div class="card">
          <div class="card-title" style="color: #047857;">Direct Wi-Fi URL (Works on All Phones &amp; Tablets)</div>
          <div class="url-box" style="background: #f0fdf4; border-color: #86efac; color: #065f46;">
            <span id="wifiUrl" class="url-text">${wifiUrl}</span>
            <button type="button" class="btn btn-emerald btn-sm" onclick="copyText('${wifiUrl}', this)">Copy</button>
          </div>
          <p style="font-size: 11.5px; color: #475569; margin-top: 9px; line-height: 1.45;">
            Connect your phone or tablet to the <strong>same clinic Wi-Fi</strong>, then open this direct Wi-Fi URL (works even when a router or Private DNS blocks <code style="color:#047857;font-weight:700;">.local</code>).
          </p>
          <div class="actions-row">
            <button type="button" class="btn btn-emerald" onclick="openUrl('${wifiMobileUrl}')">
              Launch Mobile Wi-Fi URL
            </button>
            <button type="button" class="btn btn-secondary" onclick="openUrl('${localhostUrl}')">
              Localhost Fallback
            </button>
            <button type="button" class="btn btn-secondary" onclick="minimizeToTray()">
              Minimize to Tray
            </button>
          </div>
        </div>
      </div>

      <!-- QR Code Side Panel -->
      <div class="qr-panel">
        <div class="card-title" style="margin-bottom: 2px;">SCAN TO OPEN MOBILE UI</div>
        <div class="qr-tabs">
          <button type="button" id="tabCustom" class="qr-tab active" onclick="switchQr('custom')">.local Domain</button>
          <button type="button" id="tabWifi" class="qr-tab" onclick="switchQr('wifi')">Direct Wi-Fi IP</button>
        </div>
        <img id="qrImg" class="qr-img" src="${qrCustomDataUrl || qrWifiDataUrl}" alt="Wi-Fi QR Code" />
        <div id="qrTargetText" style="font-family: monospace; font-size: 11px; color: #c25222; font-weight: 700; word-break: break-all; margin-bottom: 6px;">${customMobileUrl}</div>
        <div class="qr-note">
          Scan with your phone camera to open the dedicated <strong>Mobile &amp; Tablet Login Screen</strong>. Switch to <em>Direct Wi-Fi IP</em> if your phone blocks <code style="color:#c25222;">.local</code>.
        </div>
      </div>
    </div>

    <div id="copyToast" class="copy-toast"></div>

    <div class="footer">
      <div>Madras Ortho Clinic Pharmacy Software · Localhost Server (Port ${PORT})</div>
      <div>&copy; 2026 <strong style="color:#c25222;">RegulaVitae</strong>. All Rights Reserved · Developed by <strong style="color:#c25222;">RegulaVitae</strong></div>
    </div>

    <script>
      const { shell, ipcRenderer, clipboard } = require('electron');
      const QR_MAP = {
        custom: { img: ${JSON.stringify(qrCustomDataUrl)}, url: ${JSON.stringify(customMobileUrl)} },
        wifi: { img: ${JSON.stringify(qrWifiDataUrl)}, url: ${JSON.stringify(wifiMobileUrl)} }
      };

      function showToast(msg) {
        const toast = document.getElementById('copyToast');
        if (!toast) return;
        toast.textContent = msg;
        toast.style.display = 'block';
        clearTimeout(window.__toastTimer);
        window.__toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 2400);
      }

      function openUrl(url) {
        shell.openExternal(url);
      }

      function switchQr(mode) {
        const info = QR_MAP[mode] || QR_MAP.wifi;
        const imgEl = document.getElementById('qrImg');
        const txtEl = document.getElementById('qrTargetText');
        const tCustom = document.getElementById('tabCustom');
        const tWifi = document.getElementById('tabWifi');
        if (imgEl && info.img) imgEl.src = info.img;
        if (txtEl) txtEl.textContent = info.url;
        if (tCustom) tCustom.classList.toggle('active', mode === 'custom');
        if (tWifi) tWifi.classList.toggle('active', mode === 'wifi');
      }

      function fallbackCopyTextarea(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
        return ok;
      }

      function copyText(text, btnEl) {
        let copied = false;
        try {
          if (clipboard && typeof clipboard.writeText === 'function') {
            clipboard.writeText(text);
            copied = true;
          }
        } catch {}
        try {
          ipcRenderer.send('copy-to-clipboard', text);
          copied = true;
        } catch {}
        if (!copied) {
          copied = fallbackCopyTextarea(text);
        }

        if (btnEl) {
          const origText = btnEl.getAttribute('data-orig') || btnEl.textContent;
          btnEl.setAttribute('data-orig', origText);
          btnEl.textContent = '✓ Copied!';
          btnEl.style.background = '#059669';
          btnEl.style.color = '#ffffff';
          clearTimeout(btnEl.__resetTimer);
          btnEl.__resetTimer = setTimeout(() => {
            btnEl.textContent = origText;
            btnEl.style.background = '';
            btnEl.style.color = '';
          }, 1800);
        }
        showToast('Copied: ' + text);
      }

      function enableMobileFirewall(btnEl) {
        if (btnEl) btnEl.textContent = 'Applying Rules...';
        ipcRenderer.send('configure-mobile-firewall');
      }

      ipcRenderer.on('firewall-configured', (_e, res) => {
        const btns = document.querySelectorAll('.btn-amber');
        btns.forEach(b => { b.textContent = res && res.ok ? '✓ Firewall Rules Enabled' : 'Enable Mobile Firewall (4848 / 5353)'; });
        showToast(res && res.ok ? 'Windows Firewall allowed TCP 4848 & UDP 5353 (mDNS)!' : (res && res.error ? res.error : 'Run as Administrator to update Windows Firewall.'));
      });

      function minimizeToTray() {
        ipcRenderer.send('minimize-to-tray');
      }
    </script>
  </body>
  </html>
  `;

  controllerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  // Tray Setup
  setupTray(iconPath);

  // Auto-launch custom clinic URL in system default browser on first launch
  setTimeout(() => {
    shell.openExternal(customUrl);
  }, 1200);

  controllerWindow.on('close', () => {
    shutdownLocalhostApp(500);
  });
}

function shutdownLocalhostApp(exitDelayMs = 500, callQuit = true) {
  if (tray) {
    try { tray.destroy(); } catch {}
    tray = null;
  }
  if (callQuit) {
    app.quit();
  }
  if (exitDelayMs <= 0) {
    process.exit(0);
  }
  setTimeout(() => {
    process.exit(0);
  }, exitDelayMs);
}

function setupTray(iconPath: string) {
  if (tray) return;

  const lanInfo = getPrimaryLanIp();
  const customUrl = `http://madrasorthoclinic.local:${PORT}`;
  const localhostUrl = `http://localhost:${PORT}`;
  const wifiUrl = `http://${lanInfo.ip}:${PORT}`;

  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('MADRAS ORTHO CLINIC - Local Host Server (Active)');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'MADRAS ORTHO CLINIC SERVER: ACTIVE',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Open Custom URL (madrasorthoclinic.local)',
        click: () => shell.openExternal(customUrl)
      },
      {
        label: 'Open Localhost in Browser',
        click: () => shell.openExternal(localhostUrl)
      },
      {
        label: 'Open Mobile View (Phone & Tab)',
        click: () => shell.openExternal(`${customUrl}?view=mobile`)
      },
      {
        label: `Open Wi-Fi URL (${lanInfo.ip})`,
        click: () => shell.openExternal(wifiUrl)
      },
      { type: 'separator' },
      {
        label: 'Show Server Controller',
        click: () => {
          controllerWindow?.show();
          controllerWindow?.focus();
        }
      },
      {
        label: 'Quit Server',
        click: () => shutdownLocalhostApp(300)
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      controllerWindow?.show();
      controllerWindow?.focus();
    });
  } catch (err) {
    console.error('Failed to create tray:', err);
  }
}

ipcMain.on('copy-to-clipboard', (_event, text: string) => {
  try {
    clipboard.writeText(String(text || ''));
  } catch {}
});

ipcMain.on('configure-mobile-firewall', (event) => {
  if (process.platform !== 'win32') {
    event.sender.send('firewall-configured', { ok: true });
    return;
  }
  const cmd = `powershell -NoProfile -Command "Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -Command New-NetFirewallRule -DisplayName ''Madras Ortho Clinic POS (TCP 4848)'' -Direction Inbound -Protocol TCP -LocalPort ${PORT} -Action Allow -Profile Any -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName ''Madras Ortho Clinic mDNS (UDP 5353)'' -Direction Inbound -Protocol UDP -LocalPort 5353 -Action Allow -Profile Any -ErrorAction SilentlyContinue'"`;
  exec(cmd, (err) => {
    if (err) {
      event.sender.send('firewall-configured', { ok: false, error: 'Administrator permission was declined or unavailable.' });
    } else {
      event.sender.send('firewall-configured', { ok: true });
    }
  });
});

ipcMain.on('minimize-to-tray', () => {
  controllerWindow?.hide();
});

app.on('second-instance', () => {
  if (controllerWindow) {
    controllerWindow.show();
    controllerWindow.focus();
  }
});

app.whenReady().then(createControllerWindow);

app.on('before-quit', () => {
  shutdownLocalhostApp(1000, false);
});

app.on('will-quit', () => {
  shutdownLocalhostApp(0, false);
});

process.on('SIGINT', () => shutdownLocalhostApp(0));

process.on('SIGTERM', () => shutdownLocalhostApp(0));

app.on('window-all-closed', () => {
  shutdownLocalhostApp(500);
});
