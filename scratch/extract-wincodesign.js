const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cacheDir = path.join(process.env.LOCALAPPDATA, 'electron-builder/Cache/winCodeSign');
const targetDir = path.join(cacheDir, 'winCodeSign-2.6.0');

// Find the .7z files
const files = fs.readdirSync(cacheDir);
const archiveFile = files.find(f => f.endsWith('.7z'));

if (!archiveFile) {
  console.error("No .7z archive file found in cache directory!");
  process.exit(1);
}

const archivePath = path.join(cacheDir, archiveFile);
console.log("Found archive:", archivePath);

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Path to 7za.exe inside the project node_modules
const projectRoot = path.resolve(__dirname, '..');
const sevenZipPath = path.join(projectRoot, 'node_modules/7zip-bin/win/x64/7za.exe');

console.log("Using 7zip path:", sevenZipPath);
console.log("Extracting archive, excluding darwin files...");

try {
  // Extract, excluding 'darwin' folder to avoid symlink privilege errors on Windows
  const cmd = `"${sevenZipPath}" x -aoa -bd "${archivePath}" "-o${targetDir}" "-x!*darwin*"`;
  console.log("Running:", cmd);
  execSync(cmd, { stdio: 'inherit' });
  console.log("Extraction completed successfully!");
} catch (err) {
  console.error("Extraction failed:", err);
  process.exit(1);
}
