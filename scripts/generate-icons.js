/**
 * Generates placeholder icons for Tauri build.
 * Run: node scripts/generate-icons.js
 * Replace with real branded icons before shipping.
 *
 * Requires: npm install --save-dev sharp
 */
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons')
fs.mkdirSync(iconsDir, { recursive: true })

// Blue square with "P" — placeholder branding
async function makeIcon(size, outPath) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#2563eb"/>
    <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial" font-weight="bold" font-size="${Math.round(size * 0.55)}" fill="white">P</text>
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(outPath)
  console.log('✓', path.basename(outPath))
}

;(async () => {
  await makeIcon(32,   path.join(iconsDir, '32x32.png'))
  await makeIcon(128,  path.join(iconsDir, '128x128.png'))
  await makeIcon(256,  path.join(iconsDir, '128x128@2x.png'))
  await makeIcon(1024, path.join(iconsDir, 'icon-source.png'))

  // ICO: copy 32x32 as minimal placeholder
  fs.copyFileSync(path.join(iconsDir, '32x32.png'), path.join(iconsDir, 'icon.ico'))
  // ICNS: copy 128x128 as placeholder (real ICNS generation needs iconutil on macOS)
  fs.copyFileSync(path.join(iconsDir, '128x128.png'), path.join(iconsDir, 'icon.icns'))

  console.log('\nDone. Replace src-tauri/icons/ with real branded icons before release.')
})()
