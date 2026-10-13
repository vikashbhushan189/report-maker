# Workspace Instructions for Report Maker

You are assisting on the **Report Maker** project (local & web application for generating government S01 Member KYC & e-KYC progress reports).

## Key Project Rules & Context:
1. **Repository & Deployment**:
   - Deployed at: https://report-maker-beta.vercel.app
   - Repository: https://github.com/vikashbhushan189/report-maker.git
   - Full history & technical specs are documented in `PROJECT_CONTEXT.md`.

2. **Core S01 e-KYC Report Format**:
   - Top Title: `S01 - Member KYC Details` (red text, centered)
   - 3-Box Subheader Row: `Block: KOTWA` | `S01 - Member KYC Details Panchayat: All Panchayats` | `Date:-12-10-2026`
   - Table Header: Olive green background (`#c5d9a4`)
   - Ranking: All 16 Gram Panchayats are ranked by `e-KYC Gap` in descending order.
   - Highlights: Green for `With e-KYC Adhaar` & `Verified Mobile`; Red for `e-KYC Gap` & `Not Verified Mobile`; Colored progress badges.
   - Grand Total: Bold red text across all columns with weighted ratio percentages.

3. **Portal Excel File Structure**:
   - Row 3: Headers.
   - Row 4: Pre-existing block Total (`26,528` members). Must NEVER be counted as a Gram Panchayat.
   - Rows 5 to 20: The 16 Gram Panchayats.
   - Row 22: Portal download timestamp.

4. **Previous Day e-KYC Column**:
   - Column `With e-KYC Adhaar 10-10-2026` is manual-editable inline in the table and via `ManualDataModal.jsx`.
   - Used to compute `Yesterday e-KYC Progress` (`Current - Previous`).
   - Persisted in `localStorage`.

5. **Simplicity for New Staff**:
   - Keep the Fast 2-Step workflow (`FastReportGenerator.jsx`) front and center.
   - Advanced formula and template builders remain available via secondary links.
