/**
 * Copies Next.js standalone output into src-tauri/resources/
 * so Tauri can bundle it alongside the Rust binary.
 *
 * Run automatically via `npm run tauri:build` (see package.json).
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const STANDALONE = path.join(ROOT, '.next', 'standalone')
const STATIC = path.join(ROOT, '.next', 'static')
const PUBLIC = path.join(ROOT, 'public')
const MIGRATIONS = path.join(ROOT, 'lib', 'db', 'migrations')
const DEST = path.join(ROOT, 'src-tauri', 'resources')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) { console.warn(`⚠  Skipping missing: ${src}`); return }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

// Wipe and re-stage
fs.rmSync(DEST, { recursive: true, force: true })
fs.mkdirSync(DEST, { recursive: true })

console.log('Staging Next.js standalone output...')
copyDir(STANDALONE, path.join(DEST, 'standalone'))
copyDir(STATIC,    path.join(DEST, 'standalone', '.next', 'static'))
copyDir(PUBLIC,    path.join(DEST, 'standalone', 'public'))
copyDir(MIGRATIONS, path.join(DEST, 'standalone', 'lib', 'db', 'migrations'))

// Keep a .gitkeep so the empty dir is tracked
fs.writeFileSync(path.join(DEST, '.gitkeep'), '')

console.log('✓ src-tauri/resources/ ready for Tauri bundle')
