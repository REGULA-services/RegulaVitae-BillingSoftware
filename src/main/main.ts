import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';

// Import and start Express backend directly in Electron's main process context
// This makes compilation/packaging unified and single-process!
try {
  require('../server/server');
} catch (err) {
  console.error("Failed to require local Express server module:", err);
}

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    title: "RegulaVitae POS",
    icon: path.join(app.getAppPath(), 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    // Frameless window for premium desktop experience
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  // Toggle maximize
  mainWindow.maximize();

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Use __dirname-relative path for robustness inside the ASAR archive.
    // dist/ is packed at the app root alongside dist-electron/.
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load index.html:', err, 'Tried path:', indexPath);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // -----------------------------------------------------------
  // CRITICAL: Clear HTTP cache and purge any cached Service Workers
  // on every launch. A stale SW registered in a previous install
  // intercepts file:// requests and serves a broken cached response,
  // causing a blank white screen on every subsequent launch.
  // -----------------------------------------------------------
  try {
    const ses = session.defaultSession;

    // Clear the HTTP disk cache entirely
    await ses.clearCache();

    // Clear storage data: service workers, cache storage, cookies, etc.
    await ses.clearStorageData({
      storages: ['serviceworkers', 'cachestorage', 'cookies']
    });

    console.log('[STARTUP] Session cache and service workers cleared.');
  } catch (err) {
    console.warn('[STARTUP] Could not clear session cache:', err);
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ----------------------------------------------------
// HARDWARE SILENT THERMAL PRINTING IPC HANDLERS
// ----------------------------------------------------

ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers;
  } catch (err) {
    console.error("Failed to fetch OS printers list:", err);
    return [];
  }
});

ipcMain.handle('print-receipt', async (event, receiptData, printerName) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        bakeryName = "Billing Software POS",
        address = "123 Gourmet Lane, Foodie City",
        phone = "+91 98765 43210",
        gstin = "",
        fssai = "",
        billNumber,
        date,
        time,
        cashierName = "Cashier",
        items = [],
        subtotal = 0,
        discount = 0,
        tax = 0,
        grandTotal = 0,
        paymentMethod = "Cash",
        width = "80mm" // "58mm" or "80mm"
      } = receiptData;

      const cgst = tax > 0 ? tax / 2 : 0;
      const sgst = tax > 0 ? tax / 2 : 0;

      // Compile styled thermal receipt HTML markup
      const thermalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${width === '58mm' ? '11px' : '13px'};
              line-height: 1.4;
              margin: 0;
              padding: ${width === '58mm' ? '5px' : '12px'};
              color: #000;
              background: #fff;
              width: ${width};
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .header-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .sub-info {
              font-size: ${width === '58mm' ? '10px' : '11px'};
            }
            .separator {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .info-table, .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            .info-table td {
              padding: 1px 0;
            }
            .items-table th {
              text-align: left;
              border-bottom: 1px dashed #000;
              padding-bottom: 4px;
              font-weight: bold;
            }
            .items-table td {
              padding: 3px 0;
              vertical-align: top;
            }
            .right {
              text-align: right;
            }
            .totals-container {
              width: 100%;
              margin-top: 6px;
            }
            .totals-table {
              width: 70%;
              margin-left: 30%;
            }
            .totals-table td {
              padding: 2px 0;
            }
            .footer {
              margin-top: 16px;
              font-size: ${width === '58mm' ? '10px' : '11px'};
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">${bakeryName}</div>
            <div class="sub-info">${address}</div>
            <div class="sub-info">Ph: ${phone}</div>
            ${gstin ? `<div class="sub-info bold">GSTIN: ${gstin}</div>` : ''}
            ${fssai ? `<div class="sub-info">FSSAI Lic No: ${fssai}</div>` : ''}
          </div>

          <div class="separator"></div>

          <table class="info-table">
            <tr>
              <td><span class="bold">Bill No:</span> #${billNumber}</td>
              <td class="right"><span class="bold">Date:</span> ${date}</td>
            </tr>
            <tr>
              <td><span class="bold">Cashier:</span> ${cashierName}</td>
              <td class="right"><span class="bold">Time:</span> ${time}</td>
            </tr>
          </table>

          <div class="separator"></div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 45%;">Item</th>
                <th class="right" style="width: 15%;">Qty</th>
                <th class="right" style="width: 18%;">Rate</th>
                <th class="right" style="width: 22%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>${item.product_name} ${item.hsn_code ? `<br/><small>HSN: ${item.hsn_code}</small>` : ''}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">₹${Number(item.rate).toFixed(2)}</td>
                  <td class="right">₹${Number(item.total).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="separator"></div>

          <div class="totals-container">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td class="right">₹${Number(subtotal).toFixed(2)}</td>
              </tr>
              ${discount > 0 ? `
                <tr>
                  <td>Discount:</td>
                  <td class="right">-₹${Number(discount).toFixed(2)}</td>
                </tr>
              ` : ''}
              ${tax > 0 ? `
                <tr>
                  <td>CGST (Half):</td>
                  <td class="right">₹${cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST (Half):</td>
                  <td class="right">₹${sgst.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="bold">
                <td>Grand Total:</td>
                <td class="right" style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
                  ₹${Number(grandTotal).toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          <div class="separator"></div>

          <div class="center">
            <span class="bold">Payment Mode: ${paymentMethod}</span>
          </div>

          <div class="separator"></div>

          <div class="center footer">
            <div class="bold">Thank You. Visit Again!</div>
            <div style="font-size: 9px; color: #666; margin-top: 4px;">GST Invoice | Powered by RegulaVitae POS</div>
          </div>
        </body>
        </html>
      `;

      // Create a hidden printer window
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });

      // Load HTML
      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(thermalHtml)}`);

      printWindow.webContents.on('did-finish-load', async () => {
        try {
          const printOptions: any = {
            silent: true,
            printBackground: true,
            color: false,
            margins: {
              marginType: 'none'
            }
          };

          // If a printerName is provided and is not 'Default', direct output there
          if (printerName && printerName !== 'Default') {
            printOptions.deviceName = printerName;
          }

          printWindow.webContents.print(printOptions, (success, failureReason) => {
            printWindow.destroy(); // Always cleanup and release memory
            if (success) {
              resolve({ success: true });
            } else {
              reject(new Error(`Print failure reason: ${failureReason}`));
            }
          });
        } catch (err: any) {
          printWindow.destroy();
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
});
