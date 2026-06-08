# Service Contracts

## SessionService
```ts
createSession(childId: string, rateId: string, staffId: string): Promise<Session>
timeIn(sessionId: string): Promise<Session>
timeOut(sessionId: string): Promise<{ session: Session; bill: BillResult }>
getActiveSession(qrCode: string): Promise<Session | null>
getActiveSessions(): Promise<Session[]>
```

## CustomerService
```ts
findGuardianByPhone(phone: string): Promise<Guardian | null>
createGuardian(data: CreateGuardianDTO): Promise<Guardian>
addChild(guardianId: string, data: CreateChildDTO): Promise<Child>
getGuardianWithChildren(guardianId: string): Promise<GuardianWithChildren>
```

## BillingService
```ts
computeBill(timeIn: Date, timeOut: Date, rate: Rate): BillResult
// BillResult: { durationMinutes, durationDisplay, amount, rateSnapshot }
```

## QRService
```ts
generateSessionQR(sessionId: string): Promise<{ qrDataUrl: string; barcodeValue: string }>
validateCode(code: string): Promise<Session | null>
```

## PaymentService
```ts
recordPayment(sessionId: string, data: RecordPaymentDTO): Promise<Payment>
// RecordPaymentDTO: { amount, method: 'CASH' | 'GCASH', receivedBy: staffId }
```

## ReportService
```ts
getDailySummary(date: Date): Promise<DailySummary>
getMonthlySummary(year: number, month: number): Promise<MonthlySummary>
getPeakHours(from: Date, to: Date): Promise<PeakHourData[]>
```

## RateService
```ts
getActiveRate(): Promise<Rate>
createRate(data: CreateRateDTO): Promise<Rate>
deactivateRate(rateId: string): Promise<Rate>
```
