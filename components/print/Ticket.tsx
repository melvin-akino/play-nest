'use client'

import { useEffect, useRef } from 'react'

interface TicketProps {
  childName: string
  guardianName: string
  timeIn: string
  qrDataUrl: string
  qrCode: string
  rateName: string
}

export function Ticket({ childName, guardianName, timeIn, qrDataUrl, qrCode, rateName }: TicketProps) {
  return (
    <div className="ticket-print hidden print:block" style={{ fontFamily: 'monospace', width: '72mm', padding: '4mm' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 'bold' }}>🎪 PlayNest</div>
        <div style={{ fontSize: 11 }}>Mall Playground</div>
        <hr style={{ margin: '6px 0' }} />
      </div>
      <div style={{ fontSize: 12, marginBottom: 4 }}>
        <div><strong>Child:</strong> {childName}</div>
        <div><strong>Guardian:</strong> {guardianName}</div>
        <div><strong>Time In:</strong> {new Date(timeIn).toLocaleString('en-PH')}</div>
        <div><strong>Rate:</strong> {rateName}</div>
      </div>
      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" style={{ width: 120, height: 120 }} />}
        <div style={{ fontSize: 9, marginTop: 2 }}>{qrCode}</div>
      </div>
      <hr style={{ margin: '6px 0' }} />
      <div style={{ fontSize: 10, textAlign: 'center' }}>Present this ticket upon exit</div>
    </div>
  )
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
          <div style="font-size:18px;font-weight:bold">PlayNest</div>
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
          <img src="${props.qrDataUrl}" style="width:120px;height:120px"/>
          <div style="font-size:9px;margin-top:2px">${props.qrCode}</div>
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
