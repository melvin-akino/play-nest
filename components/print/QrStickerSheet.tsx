'use client'

interface StickerItem {
  code: string
  qrDataUrl: string
}

export function usePrintQrStickers() {
  return (items: StickerItem[]) => {
    if (items.length === 0) return
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return

    const stickers = items.map(item => `
      <div class="sticker">
        <img src="${item.qrDataUrl}" />
        <div class="code">${item.code}</div>
      </div>
    `).join('')

    win.document.write(`
      <html><head><title>QR Stickers</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: monospace; }
        .sheet {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4mm;
          padding: 6mm;
        }
        .sticker {
          border: 1px dashed #999;
          border-radius: 4px;
          text-align: center;
          padding: 3mm;
        }
        .sticker img { width: 100%; max-width: 30mm; height: auto; }
        .sticker .code { font-size: 9px; margin-top: 2px; }
        @media print {
          .sheet { padding: 0; }
          .sticker { border: none; }
        }
      </style>
      </head><body>
      <div class="sheet">${stickers}</div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }
}
