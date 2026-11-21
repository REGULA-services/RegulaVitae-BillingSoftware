import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
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
let isQuitting = false;
const PORT = process.env.PORT || 4848;

function getPrimaryLanIp(): { ip: string; isWifi: boolean; name: string } {
  try {
    const interfaces = os.networkInterfaces();
    const list: { ip: string; isWifi: boolean; name: string }[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          const isWifi = /wi-?fi|wlan|wireless|802\.11/i.test(name);
          list.push({ ip: net.address, isWifi, name });
        }
      }
    }
    list.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
    return list.length > 0 ? list[0] : { ip: '127.0.0.1', isWifi: false, name: 'Localhost' };
  } catch {
    return { ip: '127.0.0.1', isWifi: false, name: 'Localhost' };
  }
}

async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, { width: 220, margin: 1 });
  } catch (err) {
    return '';
  }
}

async function createControllerWindow() {
  const lanInfo = getPrimaryLanIp();
  const customUrl = `http://madrasorthoclinic.local:${PORT}`;
  const localhostUrl = `http://localhost:${PORT}`;
  const wifiUrl = `http://${lanInfo.ip}:${PORT}`;
  const qrDataUrl = await generateQrDataUrl(customUrl);

  const iconPath = process.platform === 'win32'
    ? (fs.existsSync(path.join(app.getAppPath(), 'build', 'icon.ico'))
        ? path.join(app.getAppPath(), 'build', 'icon.ico')
        : path.join(app.getAppPath(), 'public', 'icon.png'))
    : path.join(app.getAppPath(), 'public', 'icon.png');

  controllerWindow = new BrowserWindow({
    width: 860,
    height: 700,
    minWidth: 780,
    minHeight: 640,
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
        padding: 24px 32px 18px;
        background: rgba(15, 23, 42, 0.7);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .clinic-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #38bdf8; }
      .clinic-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
      .status-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.3);
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 600;
        color: #34d399;
      }
      .pulse-dot {
        width: 10px;
        height: 10px;
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
        padding: 24px 32px;
        display: grid;
        grid-template-columns: 1fr 260px;
        gap: 24px;
        flex: 1;
      }
      .card {
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 18px;
      }
      .card-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #94a3b8;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .url-box {
        background: #090d16;
        border: 1px solid rgba(56, 189, 248, 0.3);
        padding: 12px 16px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 15px;
        color: #38bdf8;
        display: flex;
        justify-content: space-between;
        align-items: center;
        word-break: break-all;
      }
      .btn {
        cursor: pointer;
        border: none;
        outline: none;
        padding: 10px 18px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .btn-primary {
        background: #0284c7;
        color: #ffffff;
      }
      .btn-primary:hover { background: #0369a1; transform: translateY(-1px); }
      .btn-secondary {
        background: #334155;
        color: #f1f5f9;
      }
      .btn-secondary:hover { background: #475569; }
      .btn-emerald {
        background: #059669;
        color: white;
      }
      .btn-emerald:hover { background: #047857; }
      .btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
      .actions-row { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
      .qr-panel {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .qr-img {
        width: 190px;
        height: 190px;
        background: white;
        padding: 8px;
        border-radius: 12px;
        margin: 12px 0;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      }
      .qr-note { font-size: 11px; color: #94a3b8; line-height: 1.4; }
      .footer {
        padding: 14px 32px;
        background: rgba(15, 23, 42, 0.9);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #64748b;
      }
      .copy-alert {
        display: none;
        background: #10b981;
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        margin-left: 8px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="clinic-title">🏥 MADRAS ORTHO CLINIC PHARMACY</div>
        <div class="clinic-sub">Local Host & Same Wi-Fi Network Server (Port ${PORT})</div>
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
          <div class="card-title" style="color: #38bdf8;">🏥 Primary Custom Clinic URL</div>
          <div class="url-box" style="border-color: #38bdf8;">
            <span id="customUrl" style="font-weight: bold; font-size: 16px;">${customUrl}</span>
            <button class="btn btn-secondary btn-sm" onclick="copyText('${customUrl}')">Copy</button>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 10px; line-height: 1.4;">
            Custom friendly domain active for this clinic system. Open directly in any web browser.
          </p>
          <div class="actions-row">
            <button class="btn btn-primary" onclick="openUrl('${customUrl}')">
              🌐 Open Custom URL in Browser
            </button>
            <button class="btn btn-secondary" onclick="openUrl('${customUrl}?view=mobile')">
              📱 Open Mobile & Tablet UI Preview
            </button>
          </div>
        </div>

        <!-- Same Wi-Fi Network Card -->
        <div class="card">
          <div class="card-title">📶 Access from Phones, Tablets & Wi-Fi Devices</div>
          <div class="url-box">
            <span id="wifiUrl">${wifiUrl}</span>
            <button class="btn btn-secondary btn-sm" onclick="copyText('${wifiUrl}')">Copy</button>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 10px; line-height: 1.5;">
            Connect your phone or tablet to the <strong>same clinic Wi-Fi</strong>, then open this URL or <strong>${customUrl}</strong> to access the dedicated <strong>Phone & Tablet UI</strong>.
          </p>
          <div class="actions-row">
            <button class="btn btn-emerald" onclick="openUrl('${wifiUrl}')">
              🚀 Launch Wi-Fi URL
            </button>
            <button class="btn btn-secondary" onclick="openUrl('${localhostUrl}')">
              🖥️ Localhost Fallback
            </button>
            <button class="btn btn-secondary" onclick="minimizeToTray()">
              📥 Minimize to Tray
            </button>
          </div>
        </div>
      </div>

      <!-- QR Code Side Panel -->
      <div class="qr-panel">
        <div class="card-title" style="margin-bottom: 4px;">📲 SCAN TO OPEN</div>
        <div class="qr-note">Scan with Phone Camera</div>
        ${qrDataUrl ? `<img class="qr-img" src="${qrDataUrl}" alt="Wi-Fi QR Code" />` : '<div style="padding:40px;">Generating...</div>'}
        <div class="qr-note">
          Automatically opens the <strong>Ordered Mobile UI</strong> on your phone.
        </div>
        <div id="copyAlert" class="copy-alert" style="margin-top: 10px;">Copied to clipboard!</div>
      </div>
    </div>

    <div class="footer">
      <div>Madras Ortho Clinic Pharmacy Software · Standalone Localhost Edition</div>
      <div>Running 24/7 on 0.0.0.0:${PORT} · Offline & LAN Ready</div>
    </div>

    <script>
      const { shell, ipcRenderer } = require('electron');

      function openUrl(url) {
        shell.openExternal(url);
      }

      function copyText(text) {
        navigator.clipboard.writeText(text);
        const alertEl = document.getElementById('copyAlert');
        if (alertEl) {
          alertEl.style.display = 'block';
          setTimeout(() => { alertEl.style.display = 'none'; }, 2000);
        }
      }

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

  controllerWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      controllerWindow?.hide();
    }
  });
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
        label: '🏥 Open Custom URL (madrasorthoclinic.local)',
        click: () => shell.openExternal(customUrl)
      },
      {
        label: '🌐 Open Localhost in Browser',
        click: () => shell.openExternal(localhostUrl)
      },
      {
        label: '📱 Open Mobile View (Phone & Tab)',
        click: () => shell.openExternal(`${customUrl}?view=mobile`)
      },
      {
        label: `📶 Open Wi-Fi URL (${lanInfo.ip})`,
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
        click: () => {
          isQuitting = true;
          app.quit();
        }
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
  isQuitting = true;
});

app.on('will-quit', () => {
  if (tray) {
    try { tray.destroy(); } catch {}
    tray = null;
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  isQuitting = true;
  app.quit();
  process.exit(0);
});

process.on('SIGTERM', () => {
  isQuitting = true;
  app.quit();
  process.exit(0);
});

app.on('window-all-closed', () => {
  if (isQuitting) {
    app.quit();
  }
  // Otherwise stay alive in system tray so devices on Wi-Fi remain connected
});
