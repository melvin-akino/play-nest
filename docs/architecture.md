# Architecture — Mall Playground Management System

## System Identity
**Name:** PlayNest POS  
**Type:** Hybrid (Web + Desktop via Electron wrapper)  
**Target:** Mall playgrounds (Philippines)

---

## Platform Strategy
| Mode | Runtime | Use Case |
|------|---------|----------|
| Web  | Browser (Chrome) | Admin panel, reports, remote access |
| Desktop | Tauri + Next.js | Cashier POS, printer/scanner hardware access |

Single Next.js codebase. Tauri shell wraps it for desktop. Hardware (printer, scanner) accessed via Tauri commands (Rust backend) or local API bridge.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js App (App Router)            │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ POS UI     │  │ Admin UI    │  │ Reports UI   │  │
│  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│        └────────────────┴─────────────────┘          │
│                     API Routes (REST)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ sessions │ │customers │ │payments  │ │reports  │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│                  Service Layer                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │SessionSvc│ │CustomerSvc│ │BillingSvc│ │QRSvc   │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│                  Prisma ORM                           │
└───────────────────────┬─────────────────────────────┘
                        │
                  PostgreSQL DB
```

---

## Module Breakdown

| Module | Responsibility |
|--------|---------------|
| `sessions` | Time-in/out lifecycle, timer, billing calc |
| `customers` | Guardian + children profiles (reusable) |
| `payments` | Cash/GCash recording, receipt generation |
| `qr` | QR/barcode generation, scan validation |
| `rates` | Pricing config (per hour, extensible) |
| `reports` | Sales, hours, analytics aggregation |
| `auth` | Staff login, role-based access (cashier/admin) |
| `printer` | ESC/POS thermal print bridge |

---

## Data Flow: Entry → Exit

```
Register/Lookup Guardian+Child
        ↓
Create Session (status: PENDING)
        ↓
Print QR Ticket → status: ACTIVE, time_in recorded
        ↓
[Child plays...]
        ↓
Scan QR on exit → time_out recorded
        ↓
BillingSvc computes duration → applies rate
        ↓
Payment recorded → status: COMPLETED
        ↓
Print receipt
```

---

## Technology Decisions
See `decisions.md`.
