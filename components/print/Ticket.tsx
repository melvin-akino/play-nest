'use client'

interface TicketProps {
  childName: string
  guardianName: string
  timeIn: string
  qrCode: string
  rateName: string
}

export function usePrintTicket() {
  return (props: TicketProps) => {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(`
      <html><head><title>Ticket</title>
      <style>body{margin:0;font-family:monospace}@media print{body{width:72mm}}</style>
      </head><body>
      <div style="padding:4mm;width:72mm">
        <div style="text-align:center;margin-bottom:8px">
          <div style="font-size:18px;font-weight:bold">Jungle Gym Play House</div>
          <div style="font-size:11px">Mall Playground</div>
          <hr style="margin:6px 0"/>
        </div>
        <div style="font-size:12px;margin-bottom:4px">
          <div><b>Child:</b> ${props.childName}</div>
          <div><b>Guardian:</b> ${props.guardianName}</div>
          <div><b>Time In:</b> ${new Date(props.timeIn).toLocaleString('en-PH')}</div>
          <div><b>Rate:</b> ${props.rateName}</div>
        </div>
        <div style="text-align:center;margin:8px 0">
          <div style="font-size:10px;color:#555">Wristband Code</div>
          <div style="font-size:13px;font-weight:bold;letter-spacing:1px">${props.qrCode}</div>
        </div>
        <hr style="margin:6px 0"/>
        <div style="font-size:10px;text-align:center">Present this ticket upon exit</div>
      </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }
}
