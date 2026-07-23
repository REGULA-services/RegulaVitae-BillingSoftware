// Proper multi-size ICO generator using jimp v1 + to-ico
// Creates a valid Windows ICO with 16, 32, 48, 64, 128, 256 px sizes
const { Jimp, ResizeStrategy } = require('jimp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const srcPng = path.join(__dirname, '..', 'public', 'icon.png');
const destIco = path.join(__dirname, '..', 'build', 'icon.ico');
const SIZES = [16, 32, 48, 64, 128, 256];

async function main() {
  console.log('Loading source PNG:', srcPng);
  const image = await Jimp.read(srcPng);
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
  fs.writeFileSync(destIco, icoBuffer);
  console.log(`Done! build/icon.ico = ${(icoBuffer.length / 1024).toFixed(1)} KB`);
}

main().catch(err => { console.error('FAILED:', err); process.exit(1); });
