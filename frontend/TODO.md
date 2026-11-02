# FinShield — Project Status & Remaining TODO Checklist

## Completed (`[x]`)

### 1. Design System & Stitch Screens
- [x] Fetched all 16 items from Google Stitch Project `4554961395624386665` (*Minimal Modular Design System*) into [`designs/`](./designs/) with [`designs/manifest.json`](./designs/manifest.json) and [`designs/DESIGN.md`](./designs/DESIGN.md).
- [x] Implemented the 6 DRY Modular UI Primitives in [`src/components/primitives/index.tsx`](./src/components/primitives/index.tsx):
  - `MetricPillPod`
  - `MonochromeBarChart`
  - `SemiCircleArcGauge`
  - `BentoProgressPod`
  - `InsetGroupedList`
  - `UniversalSheetModal`
  - Plus `DynamicQrSvg` (ISO/IEC 18004 Reed-Solomon QR encoder)
- [x] Implemented all core Stitch UI scenes as Next.js App Router pages:
  - [x] Scene 1: Home Insights Dashboard ([`src/app/page.tsx`](./src/app/page.tsx))
  - [x] Scene 2: Transactions Ledger & Rapid Input Docked/Modal Sheet ([`src/app/transactions/page.tsx`](./src/app/transactions/page.tsx), [`src/components/AppShell.tsx`](./src/components/AppShell.tsx))
  - [x] Scene 3: OCR Bill Scanner & Review ([`src/app/ocr/page.tsx`](./src/app/ocr/page.tsx))
  - [x] Scene 4: Spending Analytics ([`src/app/analytics/page.tsx`](./src/app/analytics/page.tsx))
  - [x] Scene 5: Monthly Budget Planner ([`src/app/budgets/page.tsx`](./src/app/budgets/page.tsx))
  - [x] Scenes 6 & 7: Savings Goals & Debt/EMI Tracker ([`src/app/goals/page.tsx`](./src/app/goals/page.tsx))
  - [x] Scene 8: Financial Calculators — Dual-Pod, Visual Arc & Amortization, and 3-Way Scenario Matrix ([`src/app/calculators/page.tsx`](./src/app/calculators/page.tsx))
  - [x] Scene 9: ML Shield Anomaly Guard ([`src/app/ml-shield/page.tsx`](./src/app/ml-shield/page.tsx))
  - [x] Scene 10: Notifications Center ([`src/app/notifications/page.tsx`](./src/app/notifications/page.tsx))
  - [x] Scene 11: Login & Registration ([`src/app/login/page.tsx`](./src/app/login/page.tsx))
  - [x] Scene 12: Profile & Settings + AWS Cloud Configurator ([`src/app/settings/page.tsx`](./src/app/settings/page.tsx))
  - [x] Scene 13: Client-Side Dynamic UPI QR, WhatsApp Split & Pending Collections ([`src/app/split/page.tsx`](./src/app/split/page.tsx))

### 2. Expansion Modules & Backend Engines
- [x] **Subscriptions & Utility Bills Hub** ([`src/app/subscriptions/page.tsx`](./src/app/subscriptions/page.tsx)) — Separated fixed Digital Subscriptions (Netflix, Spotify, Prime, etc.) from variable Metered Utility Bills (BESCOM Electricity, Airtel Fiber, Gas, Water, Rent).
- [x] **CSV Bank Statement Import & AI Analysis** ([`src/app/import-csv/page.tsx`](./src/app/import-csv/page.tsx), [`src/app/api/ai/analyze-csv/route.ts`](./src/app/api/ai/analyze-csv/route.ts)) — Quote-aware RFC-4180 parser for HDFC, ICICI, SBI, Axis, and Kotak CSVs + S3 archival + Bedrock AI categorization & anomaly detection.
- [x] **AWS Cloud Stack + Hybrid Local Fallback** ([`src/lib/aws-cloud.ts`](./src/lib/aws-cloud.ts), [`AWS_SETUP_GUIDE.md`](./AWS_SETUP_GUIDE.md)) — Native AWS SigV4 client for Bedrock, Textract (`AnalyzeExpense`), S3, and DynamoDB (`PutItem`).
- [x] **Solana Testnet (`api.testnet.solana.com`) & `username#crypt` Directory** ([`src/app/crypto/page.tsx`](./src/app/crypto/page.tsx), [`src/app/api/crypto/directory/route.ts`](./src/app/api/crypto/directory/route.ts), [`src/lib/finance-engine.ts`](./src/lib/finance-engine.ts)) — Multi-user `username#crypt` directory API, handle resolution (`arjun#crypt`, `rohan#crypt`, `priya#crypt`), Testnet/Devnet RPC `getBalance` & `requestAirdrop`, and Solana Pay QR codes.

---

## Remaining TODOs (`[ ]`)

### Priority 1: Multi-User Registration & Auth Flow (`/login`)
- [ ] **Add `username#crypt`, UPI VPA, and Solana Testnet Wallet fields directly to the `/login` Sign-Up form** ([`src/app/login/page.tsx`](./src/app/login/page.tsx)):
  - Currently, `/settings` and the `/crypto` Peer Registration Modal allow claiming/registering a `username#crypt` handle via `registerOrUpdateCryptUser()`, whereas `/login` only collects `name`, `email`, and `password`.
  - Wire `/login` Sign-Up mode to call `registerOrUpdateCryptUser()` so new users claim their `username#crypt` handle and auto-provision a Solana Testnet wallet address during initial account creation, plus add a quick "Switch Registered Demo User" selector on `/login`.
- [ ] **Real Multi-Session Auth Provider (NextAuth / AWS Cognito / DynamoDB User Sessions)**:
  - Replace local-state session switching with persistent JWT/session cookies backed by DynamoDB so multiple users logging in from separate browsers/devices authenticate against a shared cloud user table.

### Priority 2: Solana Testnet On-Chain Transaction Signing & SPL Transfers (`/crypto`)
- [ ] **Serialize & Broadcast Real On-Chain `SystemProgram.transfer` / SPL Token Transactions via Phantom (`window.solana.signAndSendTransaction`)**:
  - Currently, `/crypto` performs live JSON-RPC calls to `https://api.testnet.solana.com` for `getBalance` and `requestAirdrop` and connects to `window.solana.connect()`, while P2P transfer submission records a simulated Testnet signature if an active keypair isn't signing raw transaction bytes.
  - Add `@solana/web3.js` (or raw Ed25519 wire-format transaction serialization) to construct a transaction with `getLatestBlockhash`, sign it via `window.solana.signAndSendTransaction()`, and poll `getSignatureStatuses` on Solana Testnet.
- [ ] **Automated Unit Tests for `username#crypt` Directory & Solana Testnet Helpers**:
  - Add dedicated test cases in [`tests/finance-engine.test.mjs`](./tests/finance-engine.test.mjs) covering `normalizeCryptHandle`, `isValidCryptHandle`, `resolveCryptHandle`, `searchCryptDirectory`, `generateDeterministicTestnetWallet`, and `/api/crypto/directory` `GET`/`POST` conflict handling.

### Priority 3: AWS Cloud Production Wiring & DynamoDB Read Hydration
- [ ] **Bidirectional DynamoDB Hydration (`GetItem` / `Query` on App Load)**:
  - [`src/lib/aws-cloud.ts`](./src/lib/aws-cloud.ts) currently pushes entities via `DynamoDB_20120810.PutItem` (`syncEntityToDynamoDB`). Add `fetchEntityFromDynamoDB` (`GetItem` / `Scan` for `CRYPT_HANDLE_DIRECTORY#*`) so `/api/crypto/directory` and `/api/aws/sync` hydrate state from DynamoDB across cold serverless starts on Vercel.
- [ ] **Provision Live AWS Resources & Populate `.env.local` / Vercel Env Vars**:
  - Follow [`AWS_SETUP_GUIDE.md`](./AWS_SETUP_GUIDE.md) to create the `FinShieldLedger` DynamoDB table, `finshield-vault-artifacts` S3 bucket, and IAM keys, then run end-to-end cloud smoke tests.
