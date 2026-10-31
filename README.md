# SpashtMandate AI
### AI-Powered Financial Journeys | Paytm Build for India Hackathon 2026 (Bengaluru Edition)

> **"Every payment deserves clarity."**  
> *"Understand what you agree to. Know what gets charged. Stay in control."*

---

## 🌟 Executive Overview
**SpashtMandate AI** is an intelligent subscription transparency auditing and regulatory verification engine. It ingests public merchant subscription and checkout pages, extracts recurring payment terms with **100% evidence grounding**, evaluates them deterministically against authentic **NPCI UPI AutoPay** and **RBI e-mandate guidelines**, and reconciles disclosures with technical mandate configurations.

---

## 🚀 Key Innovations & Engineering Pillars

### 1. Grounded AI Information Extraction (Zero Hallucinations)
- **Hybrid AI Pipeline**: Supports Google Gemini / OpenAI structured output with automatic, zero-dependency **Deterministic NLP Pattern Engine fallback** for standalone offline runs.
- **Verbatim Quote Grounding**: Every extracted parameter (subscription fee, cadence, trial period, renewal terms, cancellation terms, refund policy) stores the **exact quote** from the merchant DOM, source URL, capture timestamp, and confidence rating.
- **Strict Factuality**: If a parameter cannot be found on the page, it is strictly marked as `MISSING` or `null` — never fabricated.

### 2. Deterministic Python Regulatory Rule Engine
- While AI extracts and explains, a **deterministic Python rule matrix** evaluates legal and regulatory standing.
- Clear deterministic statuses: `PASS`, `REVIEW`, `MISSING`, `NOT_APPLICABLE`, `UNVERIFIED`.
- Evaluates 7 core consumer protection parameters:
  1. `RULE-01-AMOUNT`: Explicit Subscription Price Disclosure.
  2. `RULE-02-FREQUENCY`: Unambiguous Billing Cadence.
  3. `RULE-03-TRIAL-CONVERSION`: Post-Trial Auto-Conversion & Renewal Clarity.
  4. `RULE-04-CANCELLATION`: Frictionless Opt-Out & Revocation Mechanism.
  5. `RULE-05-PRE-DEBIT-NOTICE`: 24h Pre-Debit Notification Assurance (RBI/NPCI).
  6. `RULE-06-REFUND`: Cooling-off Period & Post-Debit Recourse.
  7. `RULE-07-MANDATE-CAP`: Mandate Authorization Ceiling vs Stated Plan Price.

### 3. Authentic Regulatory Knowledge Base
- Grounded in authentic, verifiable Indian payment circulars:
  - **RBI Circular `RBI/2019-20/47 (DPSS.CO.PD.No.447/02.14.003/2019-20)`**: Mandatory 24-hour pre-debit intimation for recurring card/UPI mandates.
  - **RBI Circular `RBI/2020-21/74 (DPSS.CO.PD.No.754/02.14.003/2020-21)`**: Unconditional customer facility to revoke e-mandates online.
  - **NPCI UPI AutoPay Framework `NPCI/UPI/OC-96/2020-21`**: Frequency designations, fixed/variable caps, and UMIN tracking.
  - **Paytm Subscription Integration Guidelines v2**: Recurring pre-debit webhooks and checkout transparency standards.

### 4. Authentic UPI AutoPay Mandate Comparison
- **Strict Ethical Architecture**: When no private mandate payload is provided, the platform explicitly displays:
  > *"Mandate configuration has not been provided. Actual UPI AutoPay settings cannot currently be verified."*
- **Comparison Engine**: Reconciles stated merchant price against technical mandate execution caps, flags `"As & when presented"` cadence anomalies, and validates NPCI UMIN identifiers.
- **Interactive Simulator**: Includes a built-in testing simulator for hackathon judges to verify matching vs variance scenarios in real time.

### 5. Publication-Grade Branded PDF Reports
- Built using Python's `reportlab` library with SpashtMandate's metallic brand palette.
- Generates downloadable, audit-ready compliance summaries with scorecards, evidence snippets, and AI-suggested corrective disclosure copy.

---

## 🎨 Visual Identity & "The Flow of Money" Design System
Inspired by the cinematic, atmospheric ambition of [sargamfest.com](https://sargamfest.com/), SpashtMandate AI avoids generic blue/purple SaaS templates in favor of a bespoke financial aesthetic:
- **Color Palette**:
  - Deep Espresso: `#211611`
  - Dark Coffee: `#2B211D`
  - Burnished Copper: `#85543A`
  - Muted Copper: `#A77E5C`
  - Antique Gold: `#C28B3D`
  - Champagne Gold: `#E8C78E`
  - Warm Ivory: `#F5EBDD`
  - Muted Sage: `#75836B`
- **Multi-Layer 3D & Parallax System**:
  - **Layer 1**: Atmospheric deep espresso background with subtle film grain and floating constellation particles.
  - **Layer 2**: Flowing metallic ribbons in copper and gold representing dynamic payment streams.
  - **Layer 3**: Interactive floating 3D coins, abstract recurring mandate rings, and financial network nodes with mouse-reactive depth.
  - **Layer 4**: Glowing energy particles traveling along payment paths.
  - **Layer 5**: Foreground editorial typography (Syne display font & Cormorant Garamond serif).

---

## 💻 Tech Stack
- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy, SQLite, ReportLab, BeautifulSoup4, HTTPX.
- **Extraction & AI**: Google Gemini 1.5 Flash (via REST), Firecrawl (optional), resilient native scraping with SSRF protection, heuristic NLP pattern engine.

---

## ⚡ Quick Start & Demonstration Guide

### Prerequisites
- Node.js 18+ (tested with v22.16.0)
- Python 3.10+ (tested with v3.13.0)

### 1. Backend Setup & Startup
```powershell
# Open terminal in project root
.\venv\Scripts\Activate.ps1

# Run FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- API Documentation (Swagger): `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/v1/health`

### 2. Frontend Setup & Startup
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- Open browser at: `http://127.0.0.1:5173/`

### 3. Demo Walkthrough for Judges
1. **Stage 1 – Cinematic Landing Page**:
   - Experience the minimal, immersive "Flow of Money" aesthetic with 5-layer parallax, metallic ribbons, and mouse-reactive depth.
   - Click **"Get Started / Sign In"** to transition smoothly into the authenticated experience.
2. **Stage 2 – Cryptographically Secure Authentication**:
   - Create a new auditor account or click **"Use Pre-Verified Demo Account"** (`demo@spashtmandate.ai` / `SpashtMandate@2026`).
   - Passwords are securely hashed with standard-library **PBKDF2-HMAC-SHA256 (100,000 rounds)** and bound to active 30-day session tokens.
3. **Stage 3 – Subscription Analysis Workspace**:
   - In the **"Analyse a subscription"** input, paste any public subscription URL or select any curated preset (e.g. **Spotify Premium India**, **Disney+ Hotstar**, **Coursera Plus**, or **GitHub Copilot**).
   - Click **"Analyse Subscription"** to trigger the 6-stage extraction and auditing pipeline.
4. **Core Feature – Chronological Subscription Timeline**:
   - View the visual, evidence-grounded subscription lifecycle: *Subscription Activation → Free Trial Window → Trial Expiry & Conversion → Statutory 24h Pre-Debit Notice (RBI/NPCI) → First Payment → Recurring Renewal Cadence → Cancellation Cutoff*.
   - Transparently distinguishes **Explicit Dates**, **Calculated Timing**, and **Relative Schedules**.
5. **Transparency Scorecard & Evidence**:
   - Inspect the 0–100 Transparency Scorecard, Letter Grade (A+ to D), and Coverage %.
   - Review 11 structured parameters with verbatim DOM quotes in the **Extracted Terms & Evidence** tab.
   - Review findings across all 7 regulatory rules in the **Regulatory Findings** tab.
6. **UPI AutoPay Mandate Verification**:
   - Observe the authentic unverified state when no private mandate payload is supplied.
   - Test drive the **Simulated Test Environment** to simulate exact matches or high execution cap variances (e.g. ₹5,000 ceiling).
7. **Publication-Grade PDF Report**:
   - Click **"Download PDF Audit Report"** to download an audit summary containing the Scorecard, Extracted Terms, Chronological Timeline, and Regulatory Findings.
8. **User-Isolated History**:
   - Click **"My Audits"** in the top navigation bar to view, reload, or delete your persistent audit history.

---

## 📄 License
Paytm Build for India Hackathon 2026 Submission. All rights reserved.
