# 📊 Excel Report Studio

A local, client-side web application built with **React**, **Vite**, **Tailwind CSS**, **SheetJS**, and **ExcelJS** to generate executive Excel reports from raw spreadsheet data.

---

## 🌟 Key Features

1. **Excel File Provisioning**:
   - Drag & drop or upload `.xlsx`, `.xls`, or `.csv` files.
   - Multi-sheet workbook support with instant sheet switching.
   - Pre-loaded with 4 business datasets (**Sales & Profitability**, **Budget Variance**, **Payroll Register**, and **Inventory Stock Valuation**) for 1-click testing.
   - 100% local in-browser processing — your confidential spreadsheets never leave your computer.

2. **Report Heading Selection**:
   - **Heading Style Dropdown**: Select from pre-configured executive heading presets:
     - *Sales Performance & Profitability Summary*
     - *Departmental Budget vs. Actual Variance Report*
     - *Payroll Register & Net Compensation Summary*
     - *Inventory Stock Valuation & Replenishment Audit*
     - *Custom Executive Management Report*
   - Customize report title, subtitle, company name, author/prepared-by, and report date.
   - Choose executive color palettes: **Excel Emerald**, **Corporate Navy**, **Executive Slate**, **Modern Indigo**, or **Royal Crimson**.

3. **Formula & Modification Engine**:
   - Map raw input columns directly to report headings.
   - Calculate new metrics with mathematical expressions:
     - Multiplication: `[Units] * [UnitPrice]`
     - Discounts: `[Gross] * (1 - [DiscountPct] / 100)`
     - Margins: `(([Revenue] - [Cost]) / [Revenue]) * 100`
     - Variances: `[AllocatedBudget] - [ActualSpend]`
     - Conditional status badges: `IF([Margin %] >= 35, "High Margin ★", "Standard")`
   - Visual **Formula Builder Modal** with clickable column chips, operator pads, and live test evaluation on actual data rows.
   - Format columns as Currency (`$`), Percentage (`%`), Number, Integer, or Text.
   - Configure Grand Total summary row operations: `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`.
   - Optional Group By / Aggregation (Pivot) summary mode.

4. **Interactive Views**:
   - **Split View (Side-by-Side)**: View raw source data on the left alongside the generated executive report on the right.
   - **Raw Data View**: Search across all columns, inspect detected column diagnostics (types, sums, averages), and paginate.
   - **Report Builder**: Reorder, configure, add, or delete output columns and heading settings.
   - **Generated Report View**: Faithfully previews the final formatted report with KPI summary cards and accounting-style totals.

5. **Executive Excel Export (`.xlsx`)**:
   - Exports styled Microsoft Excel files using `ExcelJS`.
   - Themed header banner and table header with fill colors and bold white text.
   - Formatted numbers, currency, and percentages.
   - Grand Total summary row with accounting double-line borders and native Excel formulas (`=SUM(...)`).
   - Auto-adjusted column widths.
   - Also supports quick CSV export.

---

## 🚀 How to Run Locally

1. Open a terminal in this directory:
   ```bash
   cd e:\WEB_DEV_PROJECT\Report_maker
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

4. To build for production distribution:
   ```bash
   npm run build
   ```
