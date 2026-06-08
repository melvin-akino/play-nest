# Services Map

## Internal Services (Next.js API Routes)
| Route prefix | Service file | Responsibility |
|---|---|---|
| `/api/sessions` | `SessionService` | Time-in/out, active list |
| `/api/customers` | `CustomerService` | Guardian/child CRUD |
| `/api/payments` | `PaymentService` | Record payment, receipt |
| `/api/qr` | `QRService` | Generate, validate codes |
| `/api/rates` | `RateService` | Pricing management |
| `/api/reports` | `ReportService` | Analytics queries |
| `/api/auth` | NextAuth.js | Staff login |

## External Services
| Service | Purpose | Integration |
|---|---|---|
| Thermal Printer | Print QR ticket + receipt | ESC/POS over USB (via Electron IPC in desktop mode; node-thermal-printer) |
| Barcode Scanner | USB HID keyboard emulation | Reads into input field directly — no driver |
| Camera (fallback) | QR scan via webcam | @zxing/browser in client component |

## Tauri Commands (desktop only, Rust backend)
| Command | Direction | Purpose |
|---|---|---|
| `print_ticket` | frontend → Rust | Send ticket ESC/POS payload to thermal printer |
| `print_receipt` | frontend → Rust | Send receipt payload to thermal printer |
| `list_printers` | frontend → Rust | Enumerate available USB printers |

> USB barcode scanner uses keyboard emulation — no Tauri command needed, reads directly into focused input field.
