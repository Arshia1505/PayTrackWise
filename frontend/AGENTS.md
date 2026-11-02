# AGENTS.md — FinShield AI Agent & Developer Reference Manual

> **Purpose**: This document exports the complete architectural, design, domain, and technical context of **FinShield** so that any AI coding agent (Claude Code, Cursor, Windsurf, GitHub Copilot, Antigravity) or developer can immediately understand, extend, debug, and deploy the project with zero ramp-up time.

---

## 1. Project Identity & Tech Stack

- **Project Name**: **FinShield** (*Minimal Modular Design System — Pure iOS Monochrome & Modular Token Edition*)
- **Stitch Project ID**: `4554961395624386665`
- **Framework**: Next.js 15 (App Router, TypeScript, React 19, Tailwind CSS)
- **Deployment Target**: Vercel (Serverless API Routes + Static/Dynamic App Router pages)
- **Local Backend**: FastAPI on `http://127.0.0.1:8000` with SQLite (`backend/data/paytrackwise.db`) and Ollama (`llama3:8b` at `http://127.0.0.1:11434`). Statement summaries and receipt structuring go through Python. The ledger also stays in `localStorage` (`finshield_vault_state_v27`).
- **Web3 / Crypto Rail**: **Solana Testnet (`https://api.testnet.solana.com`) & Devnet** with Phantom Wallet (`window.solana`) support, Solana Pay QR generation (`solana:<recipient>?amount=...`), and a UPI-style multi-user **`username#crypt` Handle Registry**.
- **Currency & Locale**: Indian Rupees (`₹`, `en-IN` lakh/crore grouping: `₹1,25,000`, tabular numerals `JetBrains Mono` / `tabular-nums`).

---

## 2. Repository Directory Map

```text
/home/akinchan/Documents/Projects/FinProj/
├── AGENTS.md                        # Complete AI Agent & Developer Context Export (this file)
├── TODO.md                          # Completed items [x] and Remaining TODOs [ ]
├── ../backend/                      # FastAPI, SQLite, Ollama (accounts, OCR, summaries)
├── package.json                     # Next.js 15, React 19, Tailwind CSS, TypeScript scripts
├── fetch_designs.py                 # Stitch MCP downloader script used to pull raw designs
├── designs/                         # Raw Google Stitch Project (ID: 4554961395624386665) exports
│   ├── DESIGN.md                    # Master UI Design System specification
│   ├── manifest.json                # Full metadata index of all 16 downloaded Stitch items
│   ├── README.md                    # Markdown table linking all 16 Stitch screens & screenshots
│   ├── 00_design_system/
│   └── scene_01..scene_13_*/        # Each folder has code.html, screenshot.png, metadata.json
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout (Inter + JetBrains Mono + Material Symbols + Context)
│   │   ├── globals.css              # Design tokens (--bg-canvas, --bg-pod, --signal-*, .bento-pod)
│   │   ├── page.tsx                 # Scene 1: Home Insights Dashboard
│   │   ├── transactions/page.tsx    # Scene 2: Transactions Ledger & Rapid Input
│   │   ├── ocr/page.tsx             # Scene 3: OCR Bill Scanner (local Tesseract + Ollama)
│   │   ├── analytics/page.tsx       # Scene 4: Spending Analytics
│   │   ├── budgets/page.tsx         # Scene 5: Monthly Budget Planner (Hero Arc & 3x2 Bento)
│   │   ├── goals/page.tsx           # Scenes 6 & 7: Savings Goals & Debt/EMI Tracker
│   │   ├── calculators/page.tsx     # Scene 8: Financial Calculators (3 Interactive Modes)
│   │   ├── ml-shield/page.tsx       # Scene 9: ML Shield Statistical Z-Score Anomaly Guard
│   │   ├── notifications/page.tsx   # Scene 10: Notifications Center
│   │   ├── login/page.tsx           # Scene 11: Login & Registration
│   │   ├── settings/page.tsx        # Scene 12: Profile and local engine status
│   │   ├── split/page.tsx           # Scene 13: Dynamic UPI QR, WhatsApp Split & Pending Collections
│   │   ├── subscriptions/page.tsx   # Expansion: Digital Subscriptions vs. Utility Bills Hub
│   │   ├── import-csv/page.tsx      # Expansion: Bank Statement CSV Import & Ollama summary
│   │   ├── crypto/page.tsx          # Expansion: Solana Testnet P2P & username#crypt Handle Registry
│   │   └── api/
│   │       └── crypto/directory/route.ts  # GET/POST: Multi-user username#crypt registry
│   ├── components/
│   │   ├── AppShell.tsx             # Top header, Floating Glass Pill Dock, Universal Quick-Add Modal
│   │   └── primitives/index.tsx     # 6 DRY Modular UI Primitives + ISO/IEC 18004 QR SVG renderer
│   ├── context/
│   │   └── FinShieldContext.tsx     # Global reactive state, cross-module sync, #crypt actions
│   └── lib/
│       └── finance-engine.ts        # Core math, ISO QR encoder, RFC-4180 CSV parser, Solana Testnet RPC
└── tests/
    └── finance-engine.test.mjs      # Node native test runner suite (`npm test`)
```

---

## 3. Design System Rules (`designs/DESIGN.md`)

Any AI agent modifying or adding UI components MUST follow these design rules:

1. **Modular Color Tokens**:
   - `--bg-canvas`: `#FFFFFF` (Pure White main background)
   - `--bg-pod`: `#F5F5F7` (iOS System Gray 6 — borderless Bento cards, `22px` squircle radius)
   - `--bg-glass-dock`: `rgba(245, 245, 247, 0.82)` (`backdrop-filter: blur(24px)`)
   - `--ink-primary`: `#1C1C1E` (Jet Charcoal — headings, hero figures, active bars)
   - `--ink-secondary`: `#636366` (Graphite Gray)
   - `--ink-muted`: `#8E8E93` (System Gray — uppercase micro-labels)
   - `--track-empty`: `#E5E5EA` (Unfilled progress tracks & list hairlines)
   - `--signal-positive`: `#32D74B` (Tint `#E8F8ED` — Income, verified, settled, on-track)
   - `--signal-warning`: `#FF9F0A` (Tint `#FFF6E0` — Budgets 75%–99%, EMI due ≤5 days)
   - `--signal-critical`: `#FF453A` (Tint `#FFEEEE` — Budgets >100%, High Z-score ML anomaly)
2. **The Monochrome-First Rule ("Quiet UI, Loud Signals")**:
   - All normal charts, category bars, and Bento pods render in tonal monochrome (`#1C1C1E`, `#48484A`, `#8E8E93`, `#C7C7CC`).
   - Color is strictly reserved for semantic exceptions (Green / Amber / Coral Red) and always paired with an explicit pill tag (`NEAR LIMIT`, `EXCEEDED`, `NEEDS REVIEW`).
3. **The 6 DRY Modular UI Primitives** ([`src/components/primitives/index.tsx`](./src/components/primitives/index.tsx)):
   - `<MetricPillPod />`
   - `<MonochromeBarChart />`
   - `<SemiCircleArcGauge />`
   - `<BentoProgressPod />`
   - `<InsetGroupedList />`
   - `<UniversalSheetModal />`
   - Plus `<DynamicQrSvg />` (renders scannable ISO/IEC 18004 QR matrices)

---

## 4. Stitch Design Reference (`designs/`)

All 16 raw Stitch screens are stored in [`designs/`](./designs/):

| # | Stitch Screen ID | Title | Local Path |
|---|---|---|---|
| 1 | `4422215749120161846` | `DESIGN.md` | `designs/DESIGN.md` |
| 2 | `e5483d668a5d43b9a16c1d1ddc032a19` | Scene 1: Home Insights Dashboard | `designs/scene_01_home_insights_dashboard/` |
| 3 | `f658daae6c864e81aca7dd59eac39f7d` | Scene 2: Transactions & Rapid Input (Docked) | `designs/scene_02_transactions_rapid_input_docked/` |
| 4 | `11ea7e5064cc4a08b943bb7d5bcb90b3` | Scene 2: Transactions & Rapid Input Sheet | `designs/scene_02_transactions_rapid_input_sheet/` |
| 5 | `63dc84ca66494b03b10bcf670bcb8bec` | Scene 3: OCR Bill Scanner & Review | `designs/scene_03_ocr_bill_scanner_review/` |
| 6 | `7a8d9f0fc2164f6fbc091470123d93d6` | Scene 4: Spending Analytics | `designs/scene_04_spending_analytics/` |
| 7 | `79b23d12d6e14d94a4ea6b5ed969907d` | Scene 5: Monthly Budget Planner | `designs/scene_05_monthly_budget_planner/` |
| 8 | `64bc9122e3684849be2289f0e49ca543` | Scene 6: Savings Goals | `designs/scene_06_savings_goals/` |
| 9 | `2a433662efc144328880465d26f54a8e` | Scene 7: Debt & EMI Tracker | `designs/scene_07_debt_emi_tracker/` |
| 10 | `932c0584db68445386cdc1bc1f6fa3b7` | Scene 8: Calculators (Interactive Dual-Pod) | `designs/scene_08_financial_calculators_dual_pod/` |
| 11 | `573c63ddf61b4e86b881d15bbf615dc7` | Scene 8: Calculators (Visual Arc & Amortization) | `designs/scene_08_financial_calculators_visual_arc/` |
| 12 | `93833111e6294988b9547014b6ea4d8a` | Scene 8: Calculators (Scenario Comparison Matrix) | `designs/scene_08_financial_calculators_scenario_matrix/` |
| 13 | `e9f0f215506540fba9af3c10a70a6e84` | Scene 10: Notifications Center | `designs/scene_10_notifications_center/` |
| 14 | `688bd359cf5b42dd9acfa16066cacc39` | Scene 11: Login & Registration | `designs/scene_11_login_registration/` |
| 15 | `c83877cc602743989e7f9011d33ef3d8` | Scene 12: Profile & Settings | `designs/scene_12_profile_settings/` |
| 16 | `51707e28cc574cea9658fc93d38dfecc` | Scene 13: Split Bill, UPI QR & WhatsApp | `designs/scene_13_split_bill_upi_qr/` |

---

## 5. Core Domain Engines & Key Functions

### A. Quantitative Finance, QR, CSV & Solana Engine ([`src/lib/finance-engine.ts`](./src/lib/finance-engine.ts))
- **Indian Currency Formatting**: `formatINR(amount, compact?)`
- **NPCI Dynamic UPI 2.0 URI & WhatsApp Split**:
  - `buildUpiUri({ pa, pn, am, cu, tn, tr })` → `upi://pay?pa=...&pn=...&am=1417.00&cu=INR&tn=...`
  - `buildWhatsAppSplitLink({ phone, friendName, merchantName, totalBill, shareAmount, upiUri })`
- **ISO/IEC 18004 QR Code Generator**:
  - `generateQrMatrix(data)` — Encodes arbitrary strings in Byte mode (`0100`) with $\text{GF}(2^8)$ Reed-Solomon error-correction codewords across Versions 1–7, finder/alignment/timing patterns, Mask 0, and format bits (`0x77c4`).
- **Statistical Z-Score Anomaly Engine**:
  - `calculateZScoreAnomaly(amount, history)` — Flags `MEDIUM` ($Z \ge 2.0$) and `HIGH` ($Z \ge 3.0$) spending deviations.
- **Amortization & Prepayment Engine**:
  - `calculateAmortization({ principal, annualRatePct, tenureMonths, extraMonthlyPrepayment })`
- **RFC-4180 Bank Statement CSV Parser**:
  - `detectBankFormat(csvHeaderLine)` & `parseAndAnalyzeBankCSV(rawCsvText)` — Supports **HDFC, ICICI, SBI, Axis, and Kotak** CSV formats with quoted comma fields and Indian number formatting, auto-categorizing rows, flagging Z-score anomalies, and detecting recurring Subscriptions/Utility Bills/EMIs.
- **Solana Testnet & `username#crypt` Directory Engine**:
  - `SOLANA_NETWORKS`: `testnet` (`https://api.testnet.solana.com`) and `devnet` (`https://api.devnet.solana.com`).
  - `normalizeCryptHandle(input)`, `isValidCryptHandle(handle)`, `resolveCryptHandle(query, directory)`, `searchCryptDirectory(query, directory)`.
  - `generateDeterministicTestnetWallet(seedInput)` — Generates deterministic 44-char Base58 Solana Testnet public keys for registered handles.
  - `fetchSolanaTestnetBalance(walletAddress, cluster, fallbackSol)` & `requestSolanaTestnetAirdrop(walletAddress, solAmount, cluster)` — Performs live JSON-RPC calls (`getBalance`, `requestAirdrop`) to Solana Testnet with instant fallback.
  - `buildCryptoPaymentUri({ symbol, recipientAddress, recipientHandle, tokenAmount, memo })` — Builds Solana Pay URIs (`solana:<address>?amount=...&spl-token=...&label=...&message=...&memo=...`).

### B. Local Python API (`../backend`)
- `POST /ai/summary` — Ollama writes three bullets. If Ollama is down, the same prompt is served from the SQLite `ai_insights` table.
- `POST /ocr/scan` — Saves the receipt under `backend/data/receipts`, reads it with the local `tesseract` binary when it is installed, then asks Ollama for merchant, date, tax, and line items. Unreadable photos stay blank for manual entry.
- `POST /ledger/snapshot` — Stores a short ledger snapshot in SQLite.
- `GET /health` — Reports SQLite and whether Ollama answers.

### C. Global Reactive Context ([`src/context/FinShieldContext.tsx`](./src/context/FinShieldContext.tsx))
Cross-module actions that automatically keep Transactions, Monthly Budgets, Pending Collections, Notifications, and the `#crypt` Directory in sync:
- `addTransaction(tx)`
- `importCsvRowsToLedger(rows)`
- `updateBudgetLimit(id, newLimit)`
- `contributeToGoal(id, amount)` / `addSavingsGoal(goal)`
- `recordEmiPayment(id, extraPrepayment?)`
- `toggleSubscriptionPause(id)` / `addSubscription(sub)`
- `payUtilityBill(id)` / `addUtilityBill(bill)`
- `resolveAnomalyItem(id, action)` / `setAnomalySensitivity(sigma)`
- `markCollectionSettled(id)` / `addPendingCollection(item)` / `sendCollectionReminder(id)`
- `recordCryptoTransfer(tx)`
- `registerOrUpdateCryptUser(input)` / `switchActiveCryptUser(handleOrId)` / `creditTestnetAirdrop(solAmount, signature?)`
- `saveLedgerLocally()`

---

## 6. Build, Test & Development Commands

> **Note on Node Environment**: On this machine, Node v24 / npm / npx are located in `/run/user/1000/fnm_multishells/*/bin`. When running commands in non-interactive shells, prepend the fnm bin path to `PATH` if `node` is not on the default system `PATH`.

```bash
# Run unit & integration test suite (Node native test runner)
npm test

# TypeScript strict typecheck
npx tsc --noEmit

# Production Next.js build
npm run build

# Start local development server on http://localhost:3000
npm run dev
```

---

## 7. Remaining Work & Next Steps for Future Agents

See [`TODO.md`](./TODO.md) for the prioritized checklist of remaining enhancements:
1. Wire `username#crypt` handle + Solana Testnet wallet registration fields directly into the `/login` Sign-Up form ([`src/app/login/page.tsx`](./src/app/login/page.tsx)).
2. Add on-chain transaction wire serialization (`SystemProgram.transfer` / SPL Token transfer) with `window.solana.signAndSendTransaction` on Solana Testnet in [`src/app/crypto/page.tsx`](./src/app/crypto/page.tsx).
3. Add unit tests specifically for the `#crypt` directory API & handle resolution helpers in [`tests/finance-engine.test.mjs`](./tests/finance-engine.test.mjs).
4. Keep statement summaries and receipt reads on the local FastAPI service. Do not add a cloud document or model provider.
