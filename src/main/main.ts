import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import fs from 'fs';
import net from 'net';

// Set App User Model ID for Windows Taskbar grouping and high-res icon display
if (process.platform === 'win32') {
  app.setAppUserModelId('com.madrasorthoclinic.pos');
}

// Single instance lock: prevent duplicate running instances and zombie processes
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[STARTUP] Another instance is already running. Quitting.');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Import and start Express backend directly in Electron's main process context
// This makes compilation/packaging unified and single-process!
try {
  require('../server/server');
} catch (err) {
  console.error("Failed to require local Express server module:", err);
}

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  const iconPath = process.platform === 'win32'
    ? (fs.existsSync(path.join(app.getAppPath(), 'build', 'icon.ico'))
        ? path.join(app.getAppPath(), 'build', 'icon.ico')
        : path.join(app.getAppPath(), 'public', 'icon.png'))
    : path.join(app.getAppPath(), 'public', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    title: "MADRAS ORTHO CLINIC SOFTWARE",
    icon: iconPath,
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

app.on('before-quit', () => {
  // Ensure windows and processes can terminate cleanly without being held
});

process.on('SIGINT', () => {
  app.quit();
  process.exit(0);
});

process.on('SIGTERM', () => {
  app.quit();
  process.exit(0);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    process.exit(0);
  }
});

app.on('will-quit', () => {
  process.exit(0);
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
        bakeryName = "MADRAS ORTHO CLINIC & PHARMACY",
        address = "42 Anna Salai, Thousand Lights, Chennai - 600002, Tamil Nadu",
        phone = "+91 44 2855 0123 / +91 98401 22334",
        gstin = "33AAAAA0000A1Z5",
        dlNo = "20B/TN/CHE/00482",
        dlNo21 = "21B/TN/CHE/00482",
        billNumber,
        date,
        time,
        cashierName = "Pharmacist",
        patientName = "Walk-in Patient",
        patientAge = null,
        patientGender = null,
        patientPhone = null,
        doctorName = "Dr. Arjun Sharma, MS (Ortho)",
        doctorRegNo = "TNMC/2012/94821",
        pharmacistName = "Priya Nair, B.Pharm",
        pharmacistRegNo = "TNSPC/2018/48912",
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
      const hasScheduleH1 = items.some((it: any) => String(it.schedule || '').toUpperCase().includes('H1'));
      const hasScheduleH = items.some((it: any) => String(it.schedule || '').toUpperCase().includes('SCHEDULE H'));

      const totalMrp = items.reduce((sum: number, it: any) => sum + (Number(it.mrp || it.rate || 0) * Number(it.quantity || 1)), 0);
      const patientSavings = Math.max(0, totalMrp - Number(grandTotal));

      // Compile styled statutory pharmacy thermal receipt HTML markup
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
              font-size: ${width === '58mm' ? '11px' : '12px'};
              line-height: 1.35;
              margin: 0;
              padding: ${width === '58mm' ? '5px' : '10px'};
              color: #000;
              background: #fff;
              width: ${width};
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header-title {
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            .sub-info { font-size: ${width === '58mm' ? '9px' : '10px'}; }
            .separator { border-top: 1px dashed #000; margin: 5px 0; }
            .double-separator { border-top: 2px solid #000; margin: 6px 0; }
            .info-table, .items-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 1px 0; font-size: ${width === '58mm' ? '9px' : '10px'}; }
            .items-table th {
              text-align: left;
              border-bottom: 1px dashed #000;
              padding-bottom: 3px;
              font-size: ${width === '58mm' ? '9px' : '10px'};
              font-weight: bold;
            }
            .items-table td {
              padding: 2px 0;
              vertical-align: top;
              font-size: ${width === '58mm' ? '9px' : '10.5px'};
            }
            .right { text-align: right; }
            .totals-container { width: 100%; margin-top: 5px; }
            .totals-table { width: 75%; margin-left: 25%; font-size: ${width === '58mm' ? '9.5px' : '11px'}; }
            .totals-table td { padding: 1.5px 0; }
            .warning-box {
              border: 1px solid #000;
              padding: 4px;
              margin-top: 6px;
              font-size: ${width === '58mm' ? '8.5px' : '9.5px'};
              text-align: center;
              line-height: 1.25;
            }
            .footer {
              margin-top: 10px;
              font-size: ${width === '58mm' ? '9px' : '10px'};
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">${bakeryName}</div>
            <div class="sub-info bold">Center for Orthopaedic Surgery & Pharmacy</div>
            <div class="sub-info">${address}</div>
            <div class="sub-info">Ph: ${phone}</div>
            ${gstin ? `<div class="sub-info bold">GSTIN: ${gstin}</div>` : ''}
            <div class="sub-info">Drug Lic (Form 20B): ${dlNo} | (Form 21B): ${dlNo21}</div>
          </div>

          <div class="separator"></div>

          <table class="info-table">
            <tr>
              <td><span class="bold">Tax Invoice #:</span> ${billNumber}</td>
              <td class="right"><span class="bold">Date:</span> ${date}</td>
            </tr>
            <tr>
              <td><span class="bold">Time:</span> ${time}</td>
              <td class="right"><span class="bold">Payment:</span> ${paymentMethod}</td>
            </tr>
            <tr>
              <td colspan="2"><span class="bold">Patient:</span> ${patientName} ${patientAge ? `(${patientAge}y/${patientGender || ''})` : ''} ${patientPhone ? `| Ph: ${patientPhone}` : ''}</td>
            </tr>
            <tr>
              <td colspan="2"><span class="bold">Prescriber:</span> ${doctorName} [Reg: ${doctorRegNo}]</td>
            </tr>
          </table>

          <div class="separator"></div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 48%;">Item / Generic / Batch</th>
                <th class="right" style="width: 14%;">Qty</th>
                <th class="right" style="width: 18%;">Rate</th>
                <th class="right" style="width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any) => `
                <tr>
                  <td>
                    <span class="bold">${item.product_name}</span>
                    ${item.generic_name ? `<br/><span style="font-size:8.5px;color:#333;">${item.generic_name}</span>` : ''}
                    <br/><span style="font-size:8px;">B:${item.batch_number || 'B-STD'} | Exp:${item.expiry_date || 'N/A'} | HSN:${item.hsn_code || '3004'}</span>
                    ${item.mrp ? `<br/><span style="font-size:8px;color:#555;">MRP: ₹${Number(item.mrp).toFixed(2)}</span>` : ''}
                  </td>
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
                <td>Taxable Subtotal:</td>
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
                  <td>CGST:</td>
                  <td class="right">+₹${cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST:</td>
                  <td class="right">+₹${sgst.toFixed(2)}</td>
                </tr>
                <tr class="bold">
                  <td>Total GST:</td>
                  <td class="right">+₹${Number(tax).toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr class="bold">
                <td>Invoice Total:</td>
                <td class="right" style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 3px 0;">
                  ₹${Number(grandTotal).toFixed(2)}
                </td>
              </tr>
            </table>
          </div>

          ${hasScheduleH1 ? `
            <div class="warning-box bold">
              SCHEDULE H1 PRESCRIPTION DRUG - CAUTION:<br/>
              It is dangerous to take this preparation except in accordance with the medical advice.<br/>
              Not to be sold by retail without the prescription of a Registered Medical Practitioner.
            </div>
          ` : (hasScheduleH ? `
            <div class="warning-box">
              <span class="bold">SCHEDULE H PRESCRIPTION DRUG - CAUTION:</span><br/>
              To be sold by retail on the prescription of a Registered Medical Practitioner only.
            </div>
          ` : '')}

          <div class="separator"></div>

          <div class="center footer">
            <div class="bold" style="font-size: 11px; margin-top: 4px; letter-spacing: 0.5px;">Drugs sold cannot be refunded</div>
            <div style="font-size: 8.5px; color: #444; margin-top: 3px;">
              Statutory Tax Invoice under Rule 65(5) D&C Rules, 1945 & CGST Act 2017
            </div>
            <div class="bold" style="margin-top: 4px;">Wish you a speedy recovery!</div>
            <div style="font-size: 8.5px; color: #666; margin-top: 3px;">Developed by RegulaVitae © 2026</div>
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

// ----------------------------------------------------
// IPC Handler: Print via WiFi / Ethernet TCP Socket (port 9100)
// ----------------------------------------------------
function formatMainEscPos(receiptData: any): Buffer {
  const {
    bakeryName = "MADRAS ORTHO CLINIC SOFTWARE",
    description = "Mission for Cure",
    address = "Chennai, Tamil Nadu",
    phone = "+91 98765 43210",
    gstin = "",
    dlNo = "",
    billNumber = 1,
    date = new Date().toISOString().split('T')[0],
    time = new Date().toLocaleTimeString(),
    cashierName = "Pharmacist",
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    grandTotal = 0,
    paymentMethod = "Cash",
    width = "80mm"
  } = receiptData || {};

  const is58mm = width === "58mm";
  const colWidth = is58mm ? 32 : 48;
  const divider = "-".repeat(colWidth) + "\n";
  const doubleDivider = "=".repeat(colWidth) + "\n";

  const chunks: Buffer[] = [];
  const pushAscii = (str: string) => {
    chunks.push(Buffer.from(str.replace(/₹/g, "Rs."), 'latin1'));
  };

  const twoCol = (l: string, r: string) => {
    const lClean = l.replace(/₹/g, "Rs.");
    const rClean = r.replace(/₹/g, "Rs.");
    const spaces = Math.max(1, colWidth - lClean.length - rClean.length);
    return lClean + " ".repeat(spaces) + rClean + "\n";
  };

  // ESC @: Init
  chunks.push(Buffer.from([0x1B, 0x40]));
  // ESC a 1: Center
  chunks.push(Buffer.from([0x1B, 0x61, 0x01]));
  // ESC ! 0x18: Double height bold
  chunks.push(Buffer.from([0x1B, 0x21, 0x18]));
  pushAscii(bakeryName + "\n");
  // ESC ! 0x08: Normal bold
  chunks.push(Buffer.from([0x1B, 0x21, 0x08]));
  pushAscii(description + "\n");
  // ESC ! 0x00: Normal
  chunks.push(Buffer.from([0x1B, 0x21, 0x00]));
  if (address) pushAscii(address + "\n");
  if (phone) pushAscii(`Ph: ${phone}\n`);
  if (gstin) pushAscii(`GSTIN: ${gstin}\n`);
  if (dlNo) pushAscii(`Drug Lic: ${dlNo}\n`);

  // Left align: ESC a 0
  chunks.push(Buffer.from([0x1B, 0x61, 0x00]));
  pushAscii(divider);
  pushAscii(twoCol(`Bill No: #${billNumber}`, `Date: ${date}`));
  pushAscii(twoCol(`Time: ${time}`, `Status: Issued`));
  pushAscii(divider);

  if (is58mm) {
    pushAscii(twoCol("Item", "Qty   Total"));
  } else {
    pushAscii("Item".padEnd(24) + "Qty".padStart(6) + "Rate".padStart(8) + "Total".padStart(10) + "\n");
  }
  pushAscii(divider);

  for (const it of items) {
    const name = String(it.product_name || "Item");
    const qty = String(it.quantity || 1);
    const rate = Number(it.rate || 0).toFixed(2);
    const tot = Number(it.total || 0).toFixed(2);

    if (is58mm) {
      pushAscii((name.length > 30 ? name.substring(0, 30) : name) + "\n");
      pushAscii(twoCol(`  ${qty} x Rs.${rate}`, `Rs.${tot}`));
    } else {
      let tName = name.length > 23 ? name.substring(0, 21) + ".." : name;
      pushAscii(tName.padEnd(24) + qty.padStart(6) + (`Rs.${rate}`).padStart(8) + (`Rs.${tot}`).padStart(10) + "\n");
    }
  }

  pushAscii(divider);
  pushAscii(twoCol("Subtotal (excl. GST):", `Rs.${Number(subtotal).toFixed(2)}`));
  if (discount > 0) {
    pushAscii(twoCol("Discount:", `-Rs.${Number(discount).toFixed(2)}`));
  }
  if (tax > 0) {
    pushAscii(twoCol("CGST (Half):", `+Rs.${(tax / 2).toFixed(2)}`));
    pushAscii(twoCol("SGST (Half):", `+Rs.${(tax / 2).toFixed(2)}`));
    pushAscii(twoCol("Total GST Added:", `+Rs.${Number(tax).toFixed(2)}`));
  }
  pushAscii(doubleDivider);

  // Grand Total Bold Double Height
  chunks.push(Buffer.from([0x1B, 0x21, 0x18]));
  pushAscii(twoCol("Grand Total (incl. GST):", `Rs.${Number(grandTotal).toFixed(2)}`));
  chunks.push(Buffer.from([0x1B, 0x21, 0x00]));
  pushAscii(doubleDivider);

  // Center: ESC a 1
  chunks.push(Buffer.from([0x1B, 0x61, 0x01]));
  pushAscii(`Payment Mode: ${paymentMethod}\n\n`);
  chunks.push(Buffer.from([0x1B, 0x45, 0x01])); // Bold on
  pushAscii("Drugs sold cannot be refunded\n\n");
  chunks.push(Buffer.from([0x1B, 0x45, 0x00])); // Bold off
  pushAscii("Thank You. Stay Healthy!\n");
  pushAscii(`${bakeryName || 'MADRAS ORTHO CLINIC'}\n`);
  pushAscii("Developed by RegulaVitae (c) 2026\n\n\n\n");

  // Paper cut: GS V 66 0
  chunks.push(Buffer.from([0x1D, 0x56, 0x42, 0x00]));

  return Buffer.concat(chunks);
}

ipcMain.handle('print-network', async (event, { host, port = 9100, receiptData }) => {
  return new Promise((resolve, reject) => {
    if (!host) {
      return reject(new Error("Printer IP address or hostname is required."));
    }
    const client = new net.Socket();
    client.setTimeout(6000);

    client.connect(Number(port), host, () => {
      try {
        const rawBytes = formatMainEscPos(receiptData);
        client.write(rawBytes, () => {
          client.end();
          resolve({ success: true });
        });
      } catch (encodeErr) {
        client.destroy();
        reject(encodeErr);
      }
    });

    client.on('error', (err: any) => {
      client.destroy();
      reject(new Error(`WiFi Printer connection failed (${host}:${port}): ${err.message}`));
    });

    client.on('timeout', () => {
      client.destroy();
      reject(new Error(`WiFi Printer timed out connecting to ${host}:${port}`));
    });
  });
});

