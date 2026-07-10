'use client'

interface ReceiptProps {
  childName: string
  guardianName: string
  timeIn: string
  timeOut: string
  durationMinutes: number
  amountCentavos: number
  method: string
  staffName: string
}

export function usePrintReceipt() {
  return (props: ReceiptProps) => {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    const amount = `₱${(props.amountCentavos / 100).toFixed(2)}`
    const h = Math.floor(props.durationMinutes / 60)
    const m = props.durationMinutes % 60
    const duration = h > 0 ? `${h}h ${m}m` : `${m}m`

    win.document.write(`
      <html><head><title>Receipt</title>
      <style>body{margin:0;font-family:monospace}@media print{body{width:72mm}}</style>
      </head><body>
      <div style="padding:4mm;width:72mm">
        <div style="text-align:center;margin-bottom:8px">
          <div style="font-size:18px;font-weight:bold">Jungle Gym Play House</div>
          <div style="font-size:11px">Official Receipt</div>
          <hr style="margin:6px 0"/>
        </div>
        <div style="font-size:12px">
          <div><b>Child:</b> ${props.childName}</div>
          <div><b>Guardian:</b> ${props.guardianName}</div>
          <div><b>Time In:</b> ${new Date(props.timeIn).toLocaleString('en-PH')}</div>
          <div><b>Time Out:</b> ${new Date(props.timeOut).toLocaleString('en-PH')}</div>
          <div><b>Duration:</b> ${duration}</div>
        </div>
        <hr style="margin:8px 0"/>
        <div style="font-size:14px;text-align:right">
          <b>TOTAL: ${amount}</b><br/>
          <span style="font-size:11px">${props.method}</span>
        </div>
        <hr style="margin:8px 0"/>
        <div style="font-size:10px;text-align:center">
          Served by: ${props.staffName}<br/>
          Thank you for visiting Jungle Gym Play House!
        </div>
      </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }
}
