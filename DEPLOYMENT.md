# Baker's Chest Billing & POS Software - Deployment Guide

This guide covers setup, operations, testing, packaging, and deployment instructions for the high-speed, offline-first Bakery POS software.

---

## ⚡ Quick Reference: Keyboard Shortcuts

The software is optimized for mouse-free, high-speed terminal billing. Memorize these keys for fast operation:

| Category | Shortcut | Description |
|---|---|---|
| **Billing** | `F1` / `ALT + N` | Create a new customer billing session/tab |
| | `F2` | Focus search bar to type items or scan barcodes |
| | `F3` | Focus current active row's quantity input |
| | `F4` | Focus discount input (percent) |
| | `F5` | Toggle Hold status (hides/freezes active session data) |
| | `F7` or `F9` | Open checkout payment selection modal |
| | `ESC` | Cancel current action, close open modal, and reset focus |
| | `CTRL + D` | Delete currently selected product row |
| **Switching** | `ALT + [1-9]` | Swap immediately between active customer sessions 1 to 9 |
| | `ALT + X` | Close the current billing session tab |
| **Database** | `CTRL + N` | Open product management modal |
| | `CTRL + F` | Filter product management list |

---

## 🛠️ Prerequisites

Ensure the following environments are loaded on the cashier's computer:
- **Node.js**: `v20.0.0` or higher (tested on `v24.13.1`)
- **NPM**: `v10.0.0` or higher (tested on `v11.8.0`)

*Note: You do not need to install local SQL engines, MSVC++ compilers, or Python builders. If native SQLite binary compiling fails, the software automatically triggers a pure-JS JSON-File DB Engine fallback (`bakery_pos.json`) in AppData, ensuring the application starts and bills 100% of the time!*

---

## 🚀 Running in Development Mode

To boot the POS system concurrently (runs Vite dev server, Express backend APIs, and the Electron Desktop wrapper):

1. Open PowerShell or command line in the project root:
   ```powershell
   npm install
   ```
2. Launch the developer console pipeline:
   ```powershell
   npm run dev
   ```
This starts:
- Vite at `http://localhost:5173`
- Express API server at `http://localhost:4848`
- Electron app maximizing immediately into view.

---

## 🧪 Database & Calendar Math Verification

An automated script compiles and checks the database schemas, seeders, and strict Monday-to-Sunday weekly reporting calendar bounds:

To run the verification test:
```powershell
# Run the TS script directly using ts-node
npx ts-node scratch/test-db.ts
```

---

## 📦 Packaging a Windows Installer (.exe)

The software uses `electron-builder` to package all resources into a one-click setup executable:

1. Compile TypeScript configurations and build static React renderer files:
   ```powershell
   npm run build
   ```
2. Package the Electron wrapper into a Windows installer:
   ```powershell
   npm run package
   ```
3. Locate the completed installer in the newly created `/release` folder:
   - **Installer path**: `release/BakersChestPOS Setup 1.0.0.exe`

### Custom Installer Settings (Configured in package.json):
- **Desktop Shortcut**: Created automatically during installation.
- **Custom Installation Directory**: Supported for cashier environments.
- **Auto Launch**: Automatically loads the POS once setup is completed.

---

## 📁 Database and Log Storage Directories

The software stores database transaction files in the local machine's isolated AppData directory to prevent loss during application updates:

- **SQLite Database Path**: `%APPDATA%\BakersChestPOS\bakery_pos.db`
- **JSON Engine Fallback Path**: `%APPDATA%\BakersChestPOS\bakery_pos.json`
- **Excel Report Cache**: `%APPDATA%\BakersChestPOS\exports\`
