// RegulaVitae ICO generator — builds multi-size ICO from the new logo PNG
// Outputs: build/icon.ico, src/renderer/public/icon.ico, src/renderer/public/favicon.ico
const { Jimp, ResizeStrategy } = require('jimp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const srcPng = 'C:/Users/joeli/.gemini/antigravity-ide/brain/49430f3c-b547-4877-9636-d4e98ef323c4/regulavitae_logo_1786126981068.png';

const OUTPUTS = [
  path.join(ROOT, 'build', 'icon.ico'),
  path.join(ROOT, 'src', 'renderer', 'public', 'icon.ico'),
  path.join(ROOT, 'src', 'renderer', 'public', 'favicon.ico'),
];

// Also deploy PNG to all needed locations
const PNG_OUTPUTS = [
  path.join(ROOT, 'build', 'icon.png'),
  path.join(ROOT, 'src', 'renderer', 'public', 'icon.png'),
  path.join(ROOT, 'public', 'icon.png'),
];

const SIZES = [16, 32, 48, 64, 128, 256];

async function main() {
  console.log('Loading RegulaVitae logo PNG...');
  const srcBuf = fs.readFileSync(srcPng);

  // Deploy PNGs first
  for (const dest of PNG_OUTPUTS) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(srcPng, dest);
    console.log('PNG deployed:', dest);
  }

  // Build ICO
  const image = await Jimp.read(srcBuf);
  console.log(`Source: ${image.bitmap.width}x${image.bitmap.height}`);

  const pngBuffers = await Promise.all(
    SIZES.map(async (size) => {
      const resized = image.clone().resize({ w: size, h: size, mode: ResizeStrategy.BICUBIC });
      const buf = await resized.getBuffer('image/png');
      console.log(`  ${size}x${size}: ${buf.length} bytes`);
      return buf;
    })
  );

  console.log('Building ICO...');
  const icoBuffer = await toIco(pngBuffers);

  for (const dest of OUTPUTS) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, icoBuffer);
    console.log(`ICO deployed (${(icoBuffer.length / 1024).toFixed(1)} KB):`, dest);
  }

  console.log('\n✅ All RegulaVitae icons deployed successfully!');
}

main().catch(err => { console.error('FAILED:', err); process.exit(1); });
