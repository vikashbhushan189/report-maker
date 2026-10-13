# 📊 Report Maker — Project Context & Resume Guide

This document captures the full context, technical architecture, and progress of the **Excel Report Studio / Report Maker** project so you (and the AI assistant) can seamlessly resume work on any computer (e.g., Office PC).

---

## 🚀 Live Deployment & Repository
- **Production URL**: [https://report-maker-beta.vercel.app](https://report-maker-beta.vercel.app)
- **GitHub Repository**: [https://github.com/vikashbhushan189/report-maker.git](https://github.com/vikashbhushan189/report-maker.git)
- **Vercel Project**: `vikashbhushan189s-projects/report-maker`

---

## 🎯 What the Application Does
A web-based tool designed for office staff to take raw Excel/CSV exports from the **Bihar Jeevika / NRLM portal** and generate exact, publication-ready executive reports in seconds.

### Main Report Topic: `S01 - Member KYC & e-KYC Progress Report`
Replicates the official government report layout:
1. **Header Layout**:
   - Centered bold red title: `S01 - Member KYC Details`
   - 3-Box Subheader Row:
     - Box 1: `Block: KOTWA`
     - Box 2: `S01 - Member KYC Details Panchayat: All Panchayats`
     - Box 3: `Date:-12-10-2026`
2. **Table Header**:
   - Olive green background fill (`#c5d9a4` / `#C5D9A4`) with bold text.
   - Red header text for Gap and Unverified columns.
3. **Panchayat Ranking**:
   - Automatically ranks all 16 Gram Panchayats by **`e-KYC Gap` in descending order** (highest gap at top: `MACHHARGAWA` at 963 down to `BHAHARWA KALA WEST` at 236).
4. **Cell Color Fills**:
   - **Soft Green** (`#86efac`): `With e-KYC Adhaar` and `With Mobile No. Verified`.
   - **Soft Coral/Red** (`#f87171`): `e-KYC Gap` and `With Mobile No. Not Verified`.
   - **Yesterday Progress Badges**:
     - Deep Green ($\ge 10$)
     - Light Green ($4 - 9$)
     - Yellow ($1 - 3$)
     - Orange ($0$)
     - Red (Negative)
   - **Trend Arrows**:
     - ⬇ Red, ➡ Orange, ⬆ Green for `% e-KYC Gap`
     - ▼ Red, ➡ Orange, ▲ Green for `% With Mobile No. Not Verified`
5. **Total Row**:
   - Bold red text (`#c00000`) across all columns.
   - Percentages calculated as weighted ratios of totals (e.g. Total Gap % = $\frac{7,163}{26,589} \times 100 = 26.94\%$).

---

## 📑 Raw Data Portal Structure (Handled Automatically)
In the raw Excel export from the portal:
- **Rows 1 & 2**: Header title & metadata (`Period: 2026-10`, `State: BIHAR`, `District: PURBI CHAMPARAN`, `Block: KOTWA`, `Panchayat: All Panchayats`).
- **Row 3**: Column Headers (`State`, `District`, `Block`, `Gram Panchayat`, `No. of Members *`...).
- **Row 4**: The pre-existing **Total row** across the block (**26,528** Members, **25,792** Aadhar, **18,653** e-KYC).
  - *The parser automatically extracts this as `portalTotals` and ensures it is NEVER treated as a Gram Panchayat record.*
- **Rows 5 to 20**: The **16 Gram Panchayats** (`AHIRAULIYA` at Row 5 to `POKHARA` at Row 20).
- **Row 22**: Download timestamp and user footer (`User ID: IBR_KOTWA & Downloaded on: ...`).

---

## ✏️ Manual Previous-Day Data Handling
Because the daily portal export only includes the *current* day's e-KYC count, the app provides 3 fast ways for staff to supply yesterday's numbers:
1. **Direct Inline Cell Editing**: Staff can click any cell in the `With e-KYC Adhaar 10-10-2026` column and type the number directly; the progress column and totals recalculate live.
2. **Bulk Paste Column**: Click `✏️ Fill Previous Day e-KYC` -> Paste 16 numbers copied from yesterday's spreadsheet.
3. **Upload Yesterday's Raw File**: In the modal, select yesterday's file; the parser automatically matches all 16 Panchayats and extracts their previous counts.
4. Numbers are automatically preserved in browser `localStorage`.

---

## 🛠️ Tech Stack & Key Files
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: `lucide-react`
- **Spreadsheet Parsers**: SheetJS (`xlsx`) for parsing & ExcelJS (`exceljs`) for styled `.xlsx` exports.

### File Structure:
- [`src/App.jsx`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/App.jsx): Main state, reactive calculation, and tab routing.
- [`src/components/FastReportGenerator.jsx`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/components/FastReportGenerator.jsx): Simplified 2-step generator bar designed for new staff.
- [`src/components/ReportViewer.jsx`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/components/ReportViewer.jsx): Exact executive report view matching the image, inline cell editing, and totals.
- [`src/components/ManualDataModal.jsx`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/components/ManualDataModal.jsx): Modal for editing, pasting, or uploading yesterday's e-KYC numbers.
- [`src/components/RawDataViewer.jsx`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/components/RawDataViewer.jsx): Clean view of raw input data with Row 4 Portal Total and Rows 5-20 Panchayats.
- [`src/components/SplitView.jsx`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/components/SplitView.jsx): Side-by-side comparison of raw data and generated report.
- [`src/components/ReportConfig.jsx`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/components/ReportConfig.jsx): Advanced formula & column builder.
- [`src/utils/excelReader.js`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/utils/excelReader.js): Parser that extracts metadata, handles Row 4 totals, and reads Rows 5-20.
- [`src/utils/formulaEngine.js`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/utils/formulaEngine.js): Formula parser, progress delta, gap ranking, and weighted totals.
- [`src/utils/excelExporter.js`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/utils/excelExporter.js): Generates styled `.xlsx` with merged subheader boxes, olive headers, and red totals.
- [`src/utils/reportTemplates.js`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/utils/reportTemplates.js): Report presets (e-KYC Progress, Bank Seeding, Mobile Audit, Master KYC).
- [`src/utils/sampleData.js`](file:///e:/WEB_DEV_PROJECT/Report_maker/src/utils/sampleData.js): Accurate Kotwa Block 16 Panchayat baseline dataset.
- [`vercel.json`](file:///e:/WEB_DEV_PROJECT/Report_maker/vercel.json): Vercel SPA routing and build configuration.

---

## 💻 How to Resume on Office PC

1. **Clone the Repo on Office PC**:
   ```bash
   git clone https://github.com/vikashbhushan189/report-maker.git
   cd report-maker
   ```
2. **Install Dependencies & Start**:
   ```bash
   npm install
   npm run dev
   ```
3. **If using Antigravity AI on Office PC**:
   Open this project folder in Antigravity. The AI assistant will automatically read this `PROJECT_CONTEXT.md` file and `.gemini/instructions.md` and know everything that was done.
   You can just type:
   > *"I am continuing work on this project from my home PC. Check PROJECT_CONTEXT.md and help me with [your next task]."*
