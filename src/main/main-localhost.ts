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

  controllerWindow = new BrowserWindow({
    width: 900,
    height: 750,
    minWidth: 800,
    minHeight: 680,
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
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        user-select: none;
      }
      .header {
        padding: 20px 30px 16px;
        background: rgba(15, 23, 42, 0.78);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .clinic-title { font-size: 20px; font-weight: 800; letter-spacing: 0.4px; color: #38bdf8; }
      .clinic-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
      .status-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.35);
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 700;
        color: #34d399;
      }
      .pulse-dot {
        width: 9px;
        height: 9px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 10px #10b981;
        animation: pulse 1.8s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.85); }
      }
      .container {
        padding: 22px 30px;
        display: grid;
        grid-template-columns: 1fr 278px;
        gap: 22px;
        flex: 1;
      }
      .card {
        background: rgba(30, 41, 59, 0.72);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 16px;
      }
      .card-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.9px;
        color: #94a3b8;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .url-box {
        background: #090d16;
        border: 1px solid rgba(56, 189, 248, 0.35);
        padding: 10px 14px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 14px;
        color: #38bdf8;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }
      .url-text {
        user-select: text;
        word-break: break-all;
      }
      .btn {
        cursor: pointer;
        border: none;
        outline: none;
        padding: 9px 15px;
        border-radius: 10px;
        font-size: 12.5px;
        font-weight: 600;
        transition: all 0.18s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }
      .btn-primary { background: #0284c7; color: #ffffff; }
      .btn-primary:hover { background: #0369a1; transform: translateY(-1px); }
      .btn-secondary { background: #334155; color: #f1f5f9; }
      .btn-secondary:hover { background: #475569; }
      .btn-emerald { background: #059669; color: white; }
      .btn-emerald:hover { background: #047857; }
      .btn-amber { background: rgba(245, 158, 11, 0.16); border: 1px solid rgba(245, 158, 11, 0.45); color: #fbbf24; }
      .btn-amber:hover { background: rgba(245, 158, 11, 0.28); }
      .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
      .actions-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
      .qr-panel {
        background: rgba(30, 41, 59, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .qr-tabs {
        display: flex;
        gap: 6px;
        margin-top: 8px;
        background: #0f172a;
        padding: 4px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .qr-tab {
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 7px;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        background: transparent;
      }
      .qr-tab.active {
        background: #0284c7;
        color: #fff;
      }
      .qr-img {
        width: 185px;
        height: 185px;
        background: white;
        padding: 8px;
        border-radius: 12px;
        margin: 12px 0 8px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      }
      .qr-note { font-size: 11px; color: #94a3b8; line-height: 1.45; }
      .footer {
        padding: 12px 30px;
        background: rgba(15, 23, 42, 0.92);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #94a3b8;
      }
      .copy-toast {
        position: fixed;
        bottom: 52px;
        right: 26px;
        background: #059669;
        color: #fff;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        display: none;
        z-index: 100;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="clinic-title">MADRAS ORTHO CLINIC PHARMACY</div>
        <div class="clinic-sub">Local Host & Same Wi-Fi Network Server (Port ${PORT} · Adapter: ${lanInfo.name})</div>
      </div>
      <div class="status-pill">
        <div class="pulse-dot"></div>
        <span>SERVER ACTIVE</span>
      </div>
    </div>

    <div class="container">
      <div class="main-left">
        <!-- Custom Clinic URL Card (Primary) -->
        <div class="card" style="border: 1px solid rgba(56, 189, 248, 0.4); background: rgba(14, 116, 144, 0.15);">
          <div class="card-title" style="color: #38bdf8;">Primary Custom Clinic URL (mDNS .local)</div>
          <div class="url-box" style="border-color: #38bdf8;">
            <span id="customUrl" class="url-text" style="font-weight: bold; font-size: 15px;">${customUrl}</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="copyText('${customUrl}', this)">Copy</button>
          </div>
          <p style="font-size: 11.5px; color: #cbd5e1; margin-top: 9px; line-height: 1.45;">
            mDNS responder active on UDP 5353 (${lanInfo.ip}). Note: On Android phones, keep <strong>Settings &rarr; Network &rarr; Private DNS</strong> set to <em>Off</em> or <em>Automatic</em> so <code>.local</code> resolves over Wi-Fi.
          </p>
          <div class="actions-row">
            <button type="button" class="btn btn-primary" onclick="openUrl('${customUrl}')">
              Open Custom URL in Browser
            </button>
            <button type="button" class="btn btn-secondary" onclick="openUrl('${customMobileUrl}')">
              Open Mobile UI Preview
            </button>
            <button type="button" class="btn btn-amber" onclick="enableMobileFirewall(this)">
              Enable Mobile Firewall (4848 / 5353)
            </button>
          </div>
        </div>

        <!-- Same Wi-Fi Network Card -->
        <div class="card">
          <div class="card-title">Direct Wi-Fi URL (Works on All Phones & Tablets)</div>
          <div class="url-box">
            <span id="wifiUrl" class="url-text">${wifiUrl}</span>
            <button type="button" class="btn btn-secondary btn-sm" onclick="copyText('${wifiUrl}', this)">Copy</button>
          </div>
          <p style="font-size: 11.5px; color: #94a3b8; margin-top: 9px; line-height: 1.5;">
            Connect your phone or tablet to the <strong>same clinic Wi-Fi</strong>, then open this direct Wi-Fi URL (works even when a router or Private DNS blocks <code>.local</code>).
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
        <div id="qrTargetText" style="font-family: monospace; font-size: 11px; color: #38bdf8; word-break: break-all; margin-bottom: 6px;">${customMobileUrl}</div>
        <div class="qr-note">
          Scan with your phone camera to open the dedicated <strong>Mobile & Tablet Login Screen</strong>. Switch to <em>Direct Wi-Fi IP</em> if your phone blocks <code>.local</code>.
        </div>
      </div>
    </div>

    <div id="copyToast" class="copy-toast"></div>

    <div class="footer">
      <div>Madras Ortho Clinic Pharmacy Software · Localhost Server (Port ${PORT})</div>
      <div>&copy; 2026 <strong style="color:#38bdf8;">RegulaVitae</strong>. All Rights Reserved · Developed by RegulaVitae</div>
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
