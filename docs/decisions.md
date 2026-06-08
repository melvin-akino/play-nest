# Architecture Decisions

## ADR-001: Next.js App Router as unified platform
- **Decision:** Single Next.js 14 (App Router) codebase for both web and desktop
- **Reason:** Avoids duplicating UI; Tauri wraps the same app for hardware access
- **Trade-off:** Tauri requires Rust toolchain at build time; runtime bundle is ~10MB (vs Electron's ~150MB)

## ADR-002: SQLite (libSQL/Turso) + Drizzle ORM
- **Decision:** Turso (libSQL cloud) for web; embedded libSQL for Tauri desktop; Drizzle as type-safe ORM
- **Reason:** Single schema works for both targets; Drizzle has native libSQL driver; zero DB ops on server
- **Trade-off:** Single writer limitation — acceptable for single-location POS; Turso multi-DB handles future multi-branch

## ADR-003: Pricing — per hour, configurable via DB
- **Decision:** Rates stored in `rates` table, not hardcoded
- **Reason:** User confirmed pricing must be updatable at any time without code changes
- **Implication:** BillingSvc always reads active rate from DB, never from env/config

## ADR-004: QR Code as primary session identifier
- **Decision:** UUID-based QR + printed barcode (Code 128) per session
- **Reason:** Generic USB HID scanners read Code 128 as keyboard input — no driver needed
- **Implication:** QR for camera scan fallback; barcode for physical scanner at counter

## ADR-005: Payment — Cash and GCash both recorded, not gateway-integrated
- **Decision:** Payment method is a recorded enum (CASH | GCASH), no payment gateway
- **Reason:** User confirmed GCash is manual (cashier confirms on phone, records in system)
- **Implication:** No webhook/callback infra needed; keeps system offline-capable

## ADR-006: Returning customer profile lookup
- **Decision:** Guardian identified by phone number; children linked to guardian
- **Reason:** Fastest lookup at counter without requiring app/account from customers
- **Implication:** Phone number is unique key on guardians table

## ADR-007: Auth — Role-based (cashier / admin)
- **Decision:** NextAuth.js with credential provider; roles: CASHIER, ADMIN
- **Reason:** Staff-only system; no public-facing auth needed
- **Implication:** Cashier sees POS only; Admin sees reports, config, customer records
