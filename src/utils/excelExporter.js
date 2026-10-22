import ExcelJS from 'exceljs';
import { REPORT_THEMES } from './reportTemplates.js';
import { getT01PctColor, getVoPctColor, getLakhpatiProgressColor, getP01HhsHeatmapColor, getP01ShgArrow } from './formulaEngine.js';

/**
 * Convert 1-indexed column number to Excel column letter (1 -> 'A', 2 -> 'B', etc.)
 */
function getColLetter(colIdx) {
  let letter = '';
  let temp = colIdx;
  while (temp > 0) {
    const rem = (temp - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    temp = Math.floor((temp - 1) / 26);
  }
  return letter;
}

/**
 * Generates and downloads a professionally styled Excel (.xlsx) report
 * exactly matching the layout, colors, and headers in the official report image,
 * with live Excel formulas for all percentages, totals, and calculations.
 */
export async function exportToStyledExcel({
  reportMeta,
  columns,
  rows,
  totals,
  filename = 'Report.xlsx'
}) {
  const theme = REPORT_THEMES[reportMeta.theme] || REPORT_THEMES.ekyc_olive;
  const isP01 = reportMeta.presetId === 'p01_shg_households' || reportMeta.layoutType === 'p01_grid';
  const isLakhpati = !isP01 && (reportMeta.presetId === 'lakhpati_didi' || reportMeta.layoutType === 'lakhpati_grid');
  const isVoIndividual = !isP01 && !isLakhpati && (reportMeta.presetId === 't01_vo_individual' || reportMeta.layoutType === 't01_vo_individual_grid');
  const isVo = !isP01 && !isLakhpati && !isVoIndividual && (reportMeta.presetId === 't01_vo_transactions' || reportMeta.layoutType === 't01_vo_grid');
  const isT01 = !isP01 && !isLakhpati && !isVoIndividual && !isVo && (reportMeta.presetId === 't01_transactions' || reportMeta.layoutType === 't01_grid');
  const isEkyc = !isP01 && !isLakhpati && !isVoIndividual && !isVo && !isT01 && (reportMeta.presetId === 'ekyc_progress' || reportMeta.layoutType === 'ekyc_grid');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Report Studio';
  workbook.lastModifiedBy = 'Report Studio';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetName = isP01 ? 'SHGs and Households' : (isLakhpati ? 'Lakhpati Didi Status Report' : (isVoIndividual ? 'VO Monitoring Status' : (isVo ? 'VO Transactions Report' : (isT01 ? 'SHG Transactions Report' : (isEkyc ? 'KYC Progress Report' : 'Report')))));
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
  });

  const hexToArgb = (hex) => 'FF' + hex.replace('#', '').toUpperCase();
  const borderThin = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FF94A3B8' } },
    right: { style: 'thin', color: { argb: 'FF94A3B8' } }
  };

  let currentRowIdx = 1;
  const totalColsCount = columns.length + 1; // +1 for S.No

  // Build a map of column header -> Excel column letter
  // Col 1 is 'A' (S.No)
  // Col 2 is 'B' (Gram Panchayat)
  // Col 3+ are data columns
  const colLetterMap = {};
  columns.forEach((col, idx) => {
    colLetterMap[col.header] = getColLetter(idx + 2);
  });

  if (isP01) {
    // ----------------------------------------------------
    // 1. P01 HEADER: Title Banner (Row 1)
    // ----------------------------------------------------
    const titleRow = sheet.getRow(currentRowIdx);
    titleRow.values = [reportMeta.title || 'P01 - SMC - SHGs and Households'];
    titleRow.height = 28;
    titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFC00000' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);

    const titleCell = sheet.getCell(currentRowIdx, 1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' }
    };
    for (let c = 1; c <= totalColsCount; c++) {
      sheet.getCell(currentRowIdx, c).border = borderThin;
    }
    currentRowIdx++;

    // ----------------------------------------------------
    // 2. P01 SUBHEADER: 4-Box Row (District, Block, Panchayat, Date)
    // ----------------------------------------------------
    const subheaderRow = sheet.getRow(currentRowIdx);
    subheaderRow.height = 24;

    const districtText = `District: ${reportMeta.district || 'PURBI CHAMPARAN'}`;
    const blockText = `Block: ${reportMeta.companyName?.replace(/^Block:\s*/i, '').trim() || reportMeta.block || 'KOTWA'}`;
    const panchayatText = `Panchayat: ${reportMeta.panchayat || 'All Panchayats'}`;
    const dateText = reportMeta.dateLabel?.startsWith('Date:') ? reportMeta.dateLabel : `Date:-${reportMeta.reportDate || reportMeta.currentDate || '14-10-2026'}`;

    const b1End = Math.max(2, Math.round(totalColsCount * 0.25));
    const b2End = Math.max(b1End + 1, Math.round(totalColsCount * 0.5));
    const b3End = Math.max(b2End + 1, Math.round(totalColsCount * 0.75));
    const b4End = totalColsCount;

    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, b1End);
    sheet.mergeCells(currentRowIdx, b1End + 1, currentRowIdx, b2End);
    sheet.mergeCells(currentRowIdx, b2End + 1, currentRowIdx, b3End);
    sheet.mergeCells(currentRowIdx, b3End + 1, currentRowIdx, b4End);

    const formatSubBox = (colStart, text) => {
      const cell = sheet.getCell(currentRowIdx, colStart);
      cell.value = text;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    };

    formatSubBox(1, districtText);
    formatSubBox(b1End + 1, blockText);
    formatSubBox(b2End + 1, panchayatText);
    formatSubBox(b3End + 1, dateText);

    for (let c = 1; c <= totalColsCount; c++) {
      const cell = sheet.getCell(currentRowIdx, c);
      cell.border = borderThin;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
    }
    currentRowIdx++;
  } else if (isLakhpati) {
    // ----------------------------------------------------
    // 1. LAKHPATI HEADER: Title Banner (Row 1)
    // ----------------------------------------------------
    const titleRow = sheet.getRow(currentRowIdx);
    titleRow.values = [reportMeta.title || 'Lakhpati Didi Entry Status Report - (Q2 : Jul-sep), 2026-27'];
    titleRow.height = 28;
    titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFC00000' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);

    const titleCell = sheet.getCell(currentRowIdx, 1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFFFF' }
    };
    for (let c = 1; c <= totalColsCount; c++) {
      sheet.getCell(currentRowIdx, c).border = borderThin;
    }
    currentRowIdx++;

    // ----------------------------------------------------
    // 2. LAKHPATI SUBHEADER: 3-Box Row (District, Block, Date)
    // ----------------------------------------------------
    const subheaderRow = sheet.getRow(currentRowIdx);
    subheaderRow.height = 24;

    const rawDistrict = reportMeta.district || 'PURBI CHAMPARAN';
    const cleanDistrict = rawDistrict
      .replace(/^District:\s*/i, '')
      .replace(/\s+(?:Block|Panchayat|Date|Period|State):.*$/i, '')
      .trim();
    const districtText = `District: ${cleanDistrict || 'PURBI CHAMPARAN'}`;

    const rawBlock = reportMeta.companyName?.replace(/^Block:\s*/i, '').trim() || reportMeta.block || 'KOTWA';
    const cleanBlock = rawBlock
      .replace(/^Block:\s*/i, '')
      .replace(/\s+(?:District|Panchayat|Date|Period|State):.*$/i, '')
      .trim();
    const blockText = `Block: ${cleanBlock || 'KOTWA'}`;

    const dateText = reportMeta.dateLabel?.startsWith('Date:') ? reportMeta.dateLabel : `Date:-${reportMeta.currentDate || '21-10-2026'}`;

    const b1End = 2; // S.No to Gram Panchayat
    const b2End = 5; // Active Approved Potential Didis to Total Entry
    const b3End = totalColsCount; // % Entry to % Gap

    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, b1End);
    sheet.mergeCells(currentRowIdx, b1End + 1, currentRowIdx, b2End);
    sheet.mergeCells(currentRowIdx, b2End + 1, currentRowIdx, b3End);

    const formatSubBox = (colStart, text) => {
      const cell = sheet.getCell(currentRowIdx, colStart);
      cell.value = text;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    };

    formatSubBox(1, districtText);
    formatSubBox(b1End + 1, blockText);
    formatSubBox(b2End + 1, dateText);

    for (let c = 1; c <= totalColsCount; c++) {
      const cell = sheet.getCell(currentRowIdx, c);
      cell.border = borderThin;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
    }
    currentRowIdx++;
  } else if (isVo || isVoIndividual) {
    // ----------------------------------------------------
    // 1. VO HEADER: Title Banner (Row 1)
    // ----------------------------------------------------
    const titleRow = sheet.getRow(currentRowIdx);
    titleRow.values = [reportMeta.title || 'T01 - VO Transactions Monitoring Status'];
    titleRow.height = 28;
    titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFC00000' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);

    const titleCell = sheet.getCell(currentRowIdx, 1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' } // Light gray background
    };
    for (let c = 1; c <= totalColsCount; c++) {
      sheet.getCell(currentRowIdx, c).border = borderThin;
    }
    currentRowIdx++;

    // ----------------------------------------------------
    // 2. VO SUBHEADER: 3-Box Row (District, Block, Date)
    // ----------------------------------------------------
    const subheaderRow = sheet.getRow(currentRowIdx);
    subheaderRow.height = 24;

    const districtText = `District: ${reportMeta.district || 'PURBI CHAMPARAN'}`;
    const blockText = `Block: ${reportMeta.companyName?.replace(/^Block:\s*/i, '').trim() || 'KOTWA'}`;
    const dateText = `Date:-${reportMeta.currentDate || (isVoIndividual ? '12-10-2026' : '13-10-2026')}`;

    const b1End = Math.max(2, Math.floor(totalColsCount * 0.33));
    const b2End = Math.max(b1End + 1, Math.floor(totalColsCount * 0.67));
    const b3End = totalColsCount;

    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, b1End);
    sheet.mergeCells(currentRowIdx, b1End + 1, currentRowIdx, b2End);
    sheet.mergeCells(currentRowIdx, b2End + 1, currentRowIdx, b3End);

    const formatSubBox = (colStart, text) => {
      const cell = sheet.getCell(currentRowIdx, colStart);
      cell.value = text;
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    };

    formatSubBox(1, districtText);
    formatSubBox(b1End + 1, blockText);
    formatSubBox(b2End + 1, dateText);

    for (let c = 1; c <= totalColsCount; c++) {
      const cell = sheet.getCell(currentRowIdx, c);
      cell.border = borderThin;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
    }
    currentRowIdx++;
  } else if (isT01) {
    // ----------------------------------------------------
    // 1. T01 HEADER: Title Banner (Row 1)
    // ----------------------------------------------------
    const titleRow = sheet.getRow(currentRowIdx);
    titleRow.values = [reportMeta.title || 'T01 - SHG Transactions Monitoring Status'];
    titleRow.height = 28;
    titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFC00000' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);

    const titleCell = sheet.getCell(currentRowIdx, 1);
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' } // Light gray background
    };
    for (let c = 1; c <= totalColsCount; c++) {
      sheet.getCell(currentRowIdx, c).border = borderThin;
    }
    currentRowIdx++;

    // ----------------------------------------------------
    // 2. T01 SUBHEADER: 4-Box Row (District, Block, Panchayat, Date)
    // ----------------------------------------------------
    const subheaderRow = sheet.getRow(currentRowIdx);
    subheaderRow.height = 24;

    const districtText = `District: ${reportMeta.district || 'PURBI CHAMPARAN'}`;
    const blockText = `Block: ${reportMeta.companyName?.replace(/^Block:\s*/i, '').trim() || 'KOTWA'}`;
    const panchayatText = `Panchayat: ${reportMeta.panchayat || 'All Panchayats'}`;
    const dateText = `Date:-${reportMeta.currentDate || '10-10-2026'}`;

    // Split totalColsCount nicely into 4 segments
    const b1End = Math.max(2, Math.floor(totalColsCount * 0.25));
    const b2End = Math.max(b1End + 1, Math.floor(totalColsCount * 0.50));
    const b3End = Math.max(b2End + 1, Math.floor(totalColsCount * 0.75));
    const b4End = totalColsCount;

    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, b1End);
    sheet.mergeCells(currentRowIdx, b1End + 1, currentRowIdx, b2End);
    sheet.mergeCells(currentRowIdx, b2End + 1, currentRowIdx, b3End);
    sheet.mergeCells(currentRowIdx, b3End + 1, currentRowIdx, b4End);

    const formatSubBox = (colStart, text) => {
      const cell = sheet.getCell(currentRowIdx, colStart);
      cell.value = text;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC00000' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    };

    formatSubBox(1, districtText);
    formatSubBox(b1End + 1, blockText);
    formatSubBox(b2End + 1, panchayatText);
    formatSubBox(b3End + 1, dateText);

    for (let c = 1; c <= totalColsCount; c++) {
      const cell = sheet.getCell(currentRowIdx, c);
      cell.border = borderThin;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }
      };
    }
    currentRowIdx++;
  } else if (isEkyc) {
    // ----------------------------------------------------
    // S01 HEADER: 3-Box Subheader Row
    // ----------------------------------------------------
    const titleRow = sheet.getRow(currentRowIdx);
    titleRow.values = [reportMeta.title || 'S01 - Member KYC Details'];
    titleRow.height = 28;
    titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFC00000' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);
    for (let c = 1; c <= totalColsCount; c++) {
      sheet.getCell(currentRowIdx, c).border = borderThin;
    }
    currentRowIdx++;

    const subheaderRow = sheet.getRow(currentRowIdx);
    subheaderRow.height = 24;

    const blockText = reportMeta.companyName || 'Block: KOTWA';
    const centerText = reportMeta.subtitle || 'S01 - Member KYC Details Panchayat: All Panchayats';
    const dateText = reportMeta.dateLabel || `Date:-${reportMeta.yesterdayDate || reportMeta.currentDate || '12-10-2026'}`;

    const colSplit1 = 4;
    const colSplit2 = Math.min(13, totalColsCount - 4);

    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, colSplit1);
    sheet.mergeCells(currentRowIdx, colSplit1 + 1, currentRowIdx, colSplit2);
    sheet.mergeCells(currentRowIdx, colSplit2 + 1, currentRowIdx, totalColsCount);

    const cell1 = sheet.getCell(currentRowIdx, 1);
    cell1.value = blockText;
    cell1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } };
    cell1.alignment = { vertical: 'middle', horizontal: 'center' };

    const cell2 = sheet.getCell(currentRowIdx, colSplit1 + 1);
    cell2.value = centerText;
    cell2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } };
    cell2.alignment = { vertical: 'middle', horizontal: 'center' };

    const cell3 = sheet.getCell(currentRowIdx, colSplit2 + 1);
    cell3.value = dateText;
    cell3.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFC00000' } };
    cell3.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let c = 1; c <= totalColsCount; c++) {
      sheet.getCell(currentRowIdx, c).border = borderThin;
    }
    currentRowIdx++;
  } else {
    // Generic Header
    const titleRow = sheet.getRow(currentRowIdx);
    titleRow.values = [reportMeta.companyName || 'Enterprise Report'];
    titleRow.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FF1E293B' } };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);
    currentRowIdx++;

    const titleRow2 = sheet.getRow(currentRowIdx);
    titleRow2.values = [reportMeta.title || 'Executive Report'];
    titleRow2.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF1E293B' } };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);
    currentRowIdx++;
    currentRowIdx++;
  }

  // ----------------------------------------------------
  // 3. Table Column Header Row: Olive Green (#C5D9A4)
  // ----------------------------------------------------
  const headerRowIdx = currentRowIdx;
  const headerRow = sheet.getRow(headerRowIdx);
  headerRow.values = ['S.NO', ...columns.map(col => col.header)];
  headerRow.height = 36;

  const headerBgArgb = isLakhpati ? 'FFFFFF00' : hexToArgb(theme.primaryColor || '#c5d9a4');

  headerRow.eachCell((cell, colIdx) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerBgArgb }
    };

    const colObj = colIdx > 1 ? columns[colIdx - 2] : null;
    const isRed = isLakhpati || (colObj && (colObj.headerColor === '#c00000' || colObj.header.includes('Gap') || colObj.header.includes('Not Verified')));

    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: isRed ? 'FFC00000' : 'FF000000' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = borderThin;
  });
  if (isLakhpati) {
    try {
      sheet.autoFilter = {
        from: { row: headerRowIdx, column: 1 },
        to: { row: headerRowIdx, column: totalColsCount }
      };
    } catch (e) {
      // Ignore autofilter error
    }
  }
  currentRowIdx++;

  const firstDataRowIdx = currentRowIdx;

  // ----------------------------------------------------
  // 4. Data Rows with Live Formulas
  // ----------------------------------------------------
  rows.forEach((row, rowIdx) => {
    const dataRow = sheet.getRow(currentRowIdx);
    dataRow.height = 20;

    // Set S.NO in Column 1
    const snoCell = sheet.getCell(currentRowIdx, 1);
    snoCell.value = rowIdx + 1;
    snoCell.alignment = { vertical: 'middle', horizontal: 'center' };
    snoCell.border = borderThin;
    snoCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };

    columns.forEach((col, cIdx) => {
      const colCell = sheet.getCell(currentRowIdx, cIdx + 2);
      colCell.border = borderThin;
      colCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };

      const rawVal = row[col.header];
      const numVal = typeof rawVal === 'number' ? rawVal : Number(String(rawVal || '').replace(/[$,%]/g, '').trim());

      // --------------------------------------------------
      // CELL STYLING FOR P01 (SHGs and Households)
      // --------------------------------------------------
      if (isP01) {
        if (col.header === 'Gram Panchayat') {
          colCell.value = rawVal || '';
          colCell.alignment = { vertical: 'middle', horizontal: 'left' };
          colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
          return;
        }

        // Arrow indicator for SHG On [Date]
        if (col.isShgOnDate || col.cellStyle === 'p01_shg_arrow' || (col.header.startsWith('SHG On') && !col.header.startsWith('SHGs'))) {
          colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          colCell.numFmt = '0" ↑";-0" ↓";0" →"';
          colCell.alignment = { vertical: 'middle', horizontal: 'center' };
          let fontColor = 'FF15803D'; // green
          if (numVal <= 1 && numVal >= 0) fontColor = 'FFF59E0B'; // amber
          else if (numVal < 0) fontColor = 'FFE11D48'; // red
          colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: fontColor } };
          return;
        }

        // Heatmap for HHs On [Date]
        if (col.isHhsOnDate || col.cellStyle === 'p01_hhs_heatmap' || col.header.startsWith('HHs On')) {
          colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          const colorMeta = getP01HhsHeatmapColor(numVal);
          if (colorMeta && colorMeta.excelArgb) {
            colCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: colorMeta.excelArgb }
            };
            colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
          }
          return;
        }

        // SHGs in Cumulative formula: [SHGs Till March-23] + [SHGs April-2023 to October-2026]
        if (col.header === 'SHGs in Cumulative') {
          const colShgMarch = colLetterMap['SHGs Till March-23'];
          const shgAprHeader = Object.keys(colLetterMap).find(h => h.startsWith('SHGs April-2023'));
          const colShgApr = shgAprHeader ? colLetterMap[shgAprHeader] : null;

          if (colShgMarch && colShgApr) {
            colCell.value = {
              formula: `${colShgMarch}${currentRowIdx}+${colShgApr}${currentRowIdx}`,
              result: isNaN(numVal) ? 0 : numVal
            };
          } else {
            colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          }
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        // Other numeric columns in P01
        if (['SHGs Till March-23', 'HHs Till March-23', 'Members in Cumulative'].includes(col.header) || col.header.startsWith('SHGs April-2023') || col.header.startsWith('HHs April-2023')) {
          colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }
      }

      // --------------------------------------------------
      // CELL STYLING FOR LAKHPATI DIDI
      // --------------------------------------------------
      if (isLakhpati) {
        const colTarget = colLetterMap['Target'];
        const colTotalEntry = colLetterMap['Total Entry'];
        const colGap = colLetterMap['Gap'];

        if (col.header === 'Gram Panchayat') {
          colCell.value = rawVal || '';
          colCell.alignment = { vertical: 'middle', horizontal: 'left' };
          colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
          return;
        }

        if (col.header === 'Active Approved Potential Didis' || col.header === 'Active Approved Potential Lakhpati Didi') {
          colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === 'Target') {
          colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === 'Total Entry' || col.header.includes('PLD Entered')) {
          colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% Entry' && colTarget && colTotalEntry) {
          colCell.value = {
            formula: `IF(${colTarget}${currentRowIdx}>0, ${colTotalEntry}${currentRowIdx}/${colTarget}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === 'Gap' && colTarget && colTotalEntry) {
          colCell.value = {
            formula: `${colTarget}${currentRowIdx}-${colTotalEntry}${currentRowIdx}`,
            result: isNaN(numVal) ? 0 : numVal
          };
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
          return;
        }

        if (col.header === '% Gap' && colTarget && colGap) {
          colCell.value = {
            formula: `IF(${colTarget}${currentRowIdx}>0, ${colGap}${currentRowIdx}/${colTarget}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          colCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };
          return;
        }

        if (col.header === 'Yesterday Progress') {
          colCell.value = isNaN(numVal) ? (rawVal || 0) : numVal;
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'center' };
          const progressColor = getLakhpatiProgressColor(numVal);
          if (progressColor.excelArgb) {
            colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: progressColor.excelArgb } };
            colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: progressColor.excelFontColor || 'FF000000' } };
          }
          return;
        }
      }

      // --------------------------------------------------
      // CELL STYLING FOR VO INDIVIDUAL (YES / NO Captured)
      // --------------------------------------------------
      if (isVoIndividual) {
        if (col.cellStyle === 'vo_yes_no' || col.header.includes('Transactions Captured')) {
          const strVal = String(rawVal || '').trim().toUpperCase();
          colCell.value = strVal || (rawVal || '');
          colCell.alignment = { vertical: 'middle', horizontal: 'center' };
          colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };

          if (strVal === 'YES') {
            colCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF00B050' } // Bright Green as in image
            };
          } else if (strVal === 'NO') {
            colCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF0000' } // Bright Red as in image
            };
          }
          return;
        }

        if (['eBK Mobile Number', 'Transaction Start Date', 'Financial Intermediary'].includes(col.header)) {
          colCell.value = rawVal !== undefined ? rawVal : '';
          colCell.alignment = { vertical: 'middle', horizontal: 'center' };
          return;
        }

        if (['VO Name', 'eBK Name'].includes(col.header)) {
          colCell.value = rawVal !== undefined ? rawVal : '';
          colCell.alignment = { vertical: 'middle', horizontal: 'left' };
          return;
        }
      }

      // --------------------------------------------------
      // FORMULA INJECTION FOR VO (VO Transactions)
      // --------------------------------------------------
      if (isVo && col.header.includes('Percentage')) {
        const match = col.header.match(/^(.*?)\s*-\s*Percentage/i);
        if (match) {
          const monthPrefix = match[1].trim();
          const letterIntermediary = colLetterMap[`${monthPrefix} - VOs Financial-Intermediary`] || colLetterMap['Total VOs'];
          const letterCaptured = colLetterMap[`${monthPrefix} - Transaction Captured`] || colLetterMap[`${monthPrefix} - Transactions Captured`];

          if (letterIntermediary && letterCaptured) {
            // Live Excel Formula: =IF(D5>0, F5/D5, 0)
            colCell.value = {
              formula: `IF(${letterIntermediary}${currentRowIdx}>0, ${letterCaptured}${currentRowIdx}/${letterIntermediary}${currentRowIdx}, 0)`,
              result: isNaN(numVal) ? 0 : numVal / 100
            };
          } else {
            colCell.value = isNaN(numVal) ? 0 : numVal / 100;
          }
        } else {
          colCell.value = isNaN(numVal) ? 0 : numVal / 100;
        }

        colCell.numFmt = '0.00%';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };

        // Conditional Fill Color
        const colorMeta = getVoPctColor(numVal);
        colCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorMeta.excelArgb }
        };
        return;
      }

      // --------------------------------------------------
      // FORMULA INJECTION FOR T01 (SHG Transactions)
      // --------------------------------------------------
      if (isT01 && col.header.includes('Percentage (%)')) {
        const match = col.header.match(/^(.*?)\s*-\s*Percentage \(%\)/i);
        if (match) {
          const monthPrefix = match[1].trim();
          const letterTotal = colLetterMap[`${monthPrefix} - Total SHGs`];
          const letterCaptured = colLetterMap[`${monthPrefix} - Transactions Captured`];

          if (letterTotal && letterCaptured) {
            // Live Excel Formula: =IF(C5>0, E5/C5, 0)
            colCell.value = {
              formula: `IF(${letterTotal}${currentRowIdx}>0, ${letterCaptured}${currentRowIdx}/${letterTotal}${currentRowIdx}, 0)`,
              result: isNaN(numVal) ? 0 : numVal / 100
            };
          } else {
            colCell.value = isNaN(numVal) ? 0 : numVal / 100;
          }
        } else {
          colCell.value = isNaN(numVal) ? 0 : numVal / 100;
        }

        colCell.numFmt = '0.00%';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };

        // Conditional Fill Color
        const colorMeta = getT01PctColor(numVal);
        colCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorMeta.excelArgb }
        };
        return;
      }

      // --------------------------------------------------
      // FORMULA INJECTION FOR S01 (Member KYC Details)
      // --------------------------------------------------
      if (isEkyc) {
        const colTotalMembers = colLetterMap['No. of Members *'];
        const colAadhar = colLetterMap['With Aadhar'];
        const currColObj = columns.find(c => c.isEkycCurr || (c.header.startsWith('With e-KYC Adhaar') && !c.isManualEditable));
        const prevColObj = columns.find(c => c.isEkycPrev || c.isManualEditable || c.manualKey === 'ekyc_prev');

        const colEkycCurr = currColObj ? colLetterMap[currColObj.header] : (colLetterMap['With e-KYC Adhaar 12-10-2026'] || colLetterMap['With e-KYC Adhaar']);
        const colEkycPrev = prevColObj ? colLetterMap[prevColObj.header] : (colLetterMap['With e-KYC Adhaar 10-10-2026'] || colLetterMap['With e-KYC Adhaar Prev']);
        const colMobile = colLetterMap['With Mobile No.'];
        const colMobVer = colLetterMap['With Mobile No. Verified'];

        if (col.header === '% With Aadhar' && colTotalMembers && colAadhar) {
          colCell.value = {
            formula: `IF(${colTotalMembers}${currentRowIdx}>0, ${colAadhar}${currentRowIdx}/${colTotalMembers}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% With e-KYC Adhaar' && colTotalMembers && colEkycCurr) {
          colCell.value = {
            formula: `IF(${colTotalMembers}${currentRowIdx}>0, ${colEkycCurr}${currentRowIdx}/${colTotalMembers}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === 'e-KYC Gap' && colAadhar && colEkycCurr) {
          colCell.value = {
            formula: `${colAadhar}${currentRowIdx}-${colEkycCurr}${currentRowIdx}`,
            result: isNaN(numVal) ? 0 : numVal
          };
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF87171' } };
          return;
        }

        if (col.header === '% e-KYC Gap' && colTotalMembers && colLetterMap['e-KYC Gap']) {
          const colGap = colLetterMap['e-KYC Gap'];
          colCell.value = {
            formula: `IF(${colTotalMembers}${currentRowIdx}>0, ${colGap}${currentRowIdx}/${colTotalMembers}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === 'Yesterday e-KYC Progress' && colEkycCurr && colEkycPrev) {
          colCell.value = {
            formula: `${colEkycCurr}${currentRowIdx}-${colEkycPrev}${currentRowIdx}`,
            result: isNaN(numVal) ? 0 : numVal
          };
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'center' };
          colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
          let progBg = 'FFFDE047';
          if (numVal >= 10) progBg = 'FF4ADE80';
          else if (numVal >= 4) progBg = 'FF86EFAC';
          else if (numVal <= 0) progBg = numVal < 0 ? 'FFF87171' : 'FFFED7AA';
          colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: progBg } };
          return;
        }

        if (col.header === '% With Mobile No.' && colTotalMembers && colMobile) {
          colCell.value = {
            formula: `IF(${colTotalMembers}${currentRowIdx}>0, ${colMobile}${currentRowIdx}/${colTotalMembers}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% With Mobile No. Verified' && colMobile && colMobVer) {
          colCell.value = {
            formula: `IF(${colMobile}${currentRowIdx}>0, ${colMobVer}${currentRowIdx}/${colMobile}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === 'With Mobile No. Not Verified' && colMobile && colMobVer) {
          colCell.value = {
            formula: `${colMobile}${currentRowIdx}-${colMobVer}${currentRowIdx}`,
            result: isNaN(numVal) ? 0 : numVal
          };
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF87171' } };
          return;
        }

        if (col.header === '% With Mobile No. Not Verified' && colMobile && colLetterMap['With Mobile No. Not Verified']) {
          const colNotVer = colLetterMap['With Mobile No. Not Verified'];
          colCell.value = {
            formula: `IF(${colMobile}${currentRowIdx}>0, ${colNotVer}${currentRowIdx}/${colMobile}${currentRowIdx}, 0)`,
            result: isNaN(numVal) ? 0 : numVal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }
      }

      // Default Value Setting
      if (col.format === 'percent' && !isNaN(numVal)) {
        colCell.value = numVal / 100;
        colCell.numFmt = '0.00%';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (col.format === 'number' || col.format === 'integer') {
        colCell.value = isNaN(numVal) ? (rawVal || '') : numVal;
        colCell.numFmt = '#,##0';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (col.format === 'currency') {
        colCell.value = isNaN(numVal) ? (rawVal || '') : numVal;
        colCell.numFmt = '$#,##0.00';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        colCell.value = rawVal || '';
        colCell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Highlights for S01
      if (col.cellStyle === 'green_highlight') {
        colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF86EFAC' } };
      } else if (col.cellStyle === 'red_highlight') {
        colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF87171' } };
      }
    });

    currentRowIdx++;
  });

  const lastDataRowIdx = currentRowIdx - 1;

  // ----------------------------------------------------
  // 5. Total Row: Bold Red Text & Formulas as in Image
  // ----------------------------------------------------
  if (!isVoIndividual && totals && rows.length > 0) {
    const totalRowIdx = currentRowIdx;
    const totalRow = sheet.getRow(totalRowIdx);
    totalRow.height = 24;

    // S.NO empty in total row
    const totalSnoCell = sheet.getCell(totalRowIdx, 1);
    totalSnoCell.value = '';
    totalSnoCell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: isLakhpati ? 'FF000000' : 'FFC00000' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };

    columns.forEach((col, cIdx) => {
      const colCell = sheet.getCell(totalRowIdx, cIdx + 2);
      const colLetter = getColLetter(cIdx + 2);

      colCell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: isLakhpati ? 'FF000000' : 'FFC00000' } // Bold Black for Lakhpati as in image
      };

      colCell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: isLakhpati ? 'FF000000' : 'FFC00000' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      };

      if (isVo || isT01) {
        // Pinkish tint for T01 and VO total row
        colCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' }
        };
      }

      if (cIdx === 0) {
        colCell.value = isP01 ? 'TOTAL' : 'Total';
        colCell.alignment = { vertical: 'middle', horizontal: 'center' };
        return;
      }

      if (!col.summaryOp || col.summaryOp === 'none') {
        colCell.value = '';
        return;
      }

      const totalVal = totals[col.header];
      const numTotal = typeof totalVal === 'number' ? totalVal : Number(String(totalVal || '').replace(/[$,%]/g, '').trim());

      // --------------------------------------------------
      // TOTAL FORMULAS FOR P01 (SHGs and Households)
      // --------------------------------------------------
      if (isP01) {
        if (col.header === 'SHGs in Cumulative') {
          const colShgMarch = colLetterMap['SHGs Till March-23'];
          const shgAprHeader = Object.keys(colLetterMap).find(h => h.startsWith('SHGs April-2023'));
          const colShgApr = shgAprHeader ? colLetterMap[shgAprHeader] : null;
          if (colShgMarch && colShgApr) {
            colCell.value = {
              formula: `${colShgMarch}${totalRowIdx}+${colShgApr}${totalRowIdx}`,
              result: isNaN(numTotal) ? 0 : numTotal
            };
          } else {
            colCell.value = {
              formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
              result: isNaN(numTotal) ? 0 : numTotal
            };
          }
        } else {
          colCell.value = {
            formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
            result: isNaN(numTotal) ? 0 : numTotal
          };
        }
        colCell.numFmt = '#,##0';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
      }

      // --------------------------------------------------
      // TOTAL FORMULAS FOR LAKHPATI DIDI
      // --------------------------------------------------
      if (isLakhpati) {
        const colTarget = colLetterMap['Target'];
        const colTotalEntry = colLetterMap['Total Entry'];
        const colGap = colLetterMap['Gap'];

        if (col.header === '% Entry' && colTarget && colTotalEntry) {
          colCell.value = {
            formula: `IF(${colTarget}${totalRowIdx}>0, ${colTotalEntry}${totalRowIdx}/${colTarget}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === 'Gap' && colTarget && colTotalEntry) {
          colCell.value = {
            formula: `${colTarget}${totalRowIdx}-${colTotalEntry}${totalRowIdx}`,
            result: isNaN(numTotal) ? 0 : numTotal
          };
          colCell.numFmt = '#,##0';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          colCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
          return;
        }

        if (col.header === '% Gap' && colTarget && colGap) {
          colCell.value = {
            formula: `IF(${colTarget}${totalRowIdx}>0, ${colGap}${totalRowIdx}/${colTarget}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        colCell.value = {
          formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
          result: isNaN(numTotal) ? 0 : numTotal
        };
        colCell.numFmt = '#,##0';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
      }

      // --------------------------------------------------
      // TOTAL FORMULAS FOR VO (VO Transactions)
      // --------------------------------------------------
      if (isVo) {
        if (col.header.includes('Percentage')) {
          const match = col.header.match(/^(.*?)\s*-\s*Percentage/i);
          if (match) {
            const monthPrefix = match[1].trim();
            const letterIntermediary = colLetterMap[`${monthPrefix} - VOs Financial-Intermediary`] || colLetterMap['Total VOs'];
            const letterCaptured = colLetterMap[`${monthPrefix} - Transaction Captured`] || colLetterMap[`${monthPrefix} - Transactions Captured`];
            if (letterIntermediary && letterCaptured) {
              colCell.value = {
                formula: `IF(${letterIntermediary}${totalRowIdx}>0, ${letterCaptured}${totalRowIdx}/${letterIntermediary}${totalRowIdx}, 0)`,
                result: isNaN(numTotal) ? 0 : numTotal / 100
              };
            } else {
              colCell.value = isNaN(numTotal) ? 0 : numTotal / 100;
            }
          }
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        colCell.value = {
          formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
          result: isNaN(numTotal) ? 0 : numTotal
        };
        colCell.numFmt = '#,##0';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
      }

      // --------------------------------------------------
      // TOTAL FORMULAS FOR T01 (SHG Transactions)
      // --------------------------------------------------
      if (isT01) {
        if (col.header.includes('Percentage (%)')) {
          const match = col.header.match(/^(.*?)\s*-\s*Percentage \(%\)/i);
          if (match) {
            const monthPrefix = match[1].trim();
            const letterTotal = colLetterMap[`${monthPrefix} - Total SHGs`];
            const letterCaptured = colLetterMap[`${monthPrefix} - Transactions Captured`];
            if (letterTotal && letterCaptured) {
              // Weighted Percentage Formula: =IF(C21>0, E21/C21, 0)
              colCell.value = {
                formula: `IF(${letterTotal}${totalRowIdx}>0, ${letterCaptured}${totalRowIdx}/${letterTotal}${totalRowIdx}, 0)`,
                result: isNaN(numTotal) ? 0 : numTotal / 100
              };
            } else {
              colCell.value = isNaN(numTotal) ? 0 : numTotal / 100;
            }
          }
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        // Sum formula for counts
        colCell.value = {
          formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
          result: isNaN(numTotal) ? 0 : numTotal
        };
        colCell.numFmt = '#,##0';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
      }

      // --------------------------------------------------
      // TOTAL FORMULAS FOR S01 (Member KYC Details)
      // --------------------------------------------------
      if (isEkyc) {
        const colTotalMembers = colLetterMap['No. of Members *'];
        const colAadhar = colLetterMap['With Aadhar'];
        const currColObj = columns.find(c => c.isEkycCurr || (c.header.startsWith('With e-KYC Adhaar') && !c.isManualEditable));
        const colEkycCurr = currColObj ? colLetterMap[currColObj.header] : (colLetterMap['With e-KYC Adhaar 12-10-2026'] || colLetterMap['With e-KYC Adhaar']);
        const colMobile = colLetterMap['With Mobile No.'];
        const colMobVer = colLetterMap['With Mobile No. Verified'];

        if (col.header === '% With Aadhar' && colTotalMembers && colAadhar) {
          colCell.value = {
            formula: `IF(${colTotalMembers}${totalRowIdx}>0, ${colAadhar}${totalRowIdx}/${colTotalMembers}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% With e-KYC Adhaar' && colTotalMembers && colEkycCurr) {
          colCell.value = {
            formula: `IF(${colTotalMembers}${totalRowIdx}>0, ${colEkycCurr}${totalRowIdx}/${colTotalMembers}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% e-KYC Gap' && colTotalMembers && colLetterMap['e-KYC Gap']) {
          const colGap = colLetterMap['e-KYC Gap'];
          colCell.value = {
            formula: `IF(${colTotalMembers}${totalRowIdx}>0, ${colGap}${totalRowIdx}/${colTotalMembers}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% With Mobile No.' && colTotalMembers && colMobile) {
          colCell.value = {
            formula: `IF(${colTotalMembers}${totalRowIdx}>0, ${colMobile}${totalRowIdx}/${colTotalMembers}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% With Mobile No. Verified' && colMobile && colMobVer) {
          colCell.value = {
            formula: `IF(${colMobile}${totalRowIdx}>0, ${colMobVer}${totalRowIdx}/${colMobile}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        if (col.header === '% With Mobile No. Not Verified' && colMobile && colLetterMap['With Mobile No. Not Verified']) {
          const colNotVer = colLetterMap['With Mobile No. Not Verified'];
          colCell.value = {
            formula: `IF(${colMobile}${totalRowIdx}>0, ${colNotVer}${totalRowIdx}/${colMobile}${totalRowIdx}, 0)`,
            result: isNaN(numTotal) ? 0 : numTotal / 100
          };
          colCell.numFmt = '0.00%';
          colCell.alignment = { vertical: 'middle', horizontal: 'right' };
          return;
        }

        // Generic Sum for S01
        colCell.value = {
          formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
          result: isNaN(numTotal) ? 0 : numTotal
        };
        colCell.numFmt = col.format === 'percent' ? '0.00%' : '#,##0';
        colCell.alignment = { vertical: 'middle', horizontal: 'right' };
        return;
      }

      // Default Sum
      if (col.format === 'percent') {
        colCell.value = isNaN(numTotal) ? '' : numTotal / 100;
        colCell.numFmt = '0.00%';
      } else {
        colCell.value = {
          formula: `SUM(${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`,
          result: isNaN(numTotal) ? 0 : numTotal
        };
        colCell.numFmt = '#,##0';
      }
      colCell.alignment = { vertical: 'middle', horizontal: 'right' };
    });

    currentRowIdx++;
  }

  // ----------------------------------------------------
  // 6. Excel Conditional Formatting Rules (Dynamic Colorcoding)
  // ----------------------------------------------------
  if (isLakhpati && lastDataRowIdx >= firstDataRowIdx) {
    const colTotalEntry = colLetterMap['Total Entry'];
    const colGap = colLetterMap['Gap'];
    const colPctGap = colLetterMap['% Gap'];

    // 1. Total Entry: Native Soft Green Data Bar (proportional bar exactly like official sample)
    if (colTotalEntry) {
      try {
        sheet.addConditionalFormatting({
          ref: `${colTotalEntry}${firstDataRowIdx}:${colTotalEntry}${lastDataRowIdx}`,
          rules: [
            {
              type: 'dataBar',
              cfvo: [{ type: 'min' }, { type: 'max' }],
              color: { argb: 'FF63BE7B' } // Excel official soft green
            }
          ]
        });
      } catch (e) {
        console.warn('DataBar formatting failed for Total Entry', e);
      }
    }

    // 2. Gap: Native Soft Red Data Bar (proportional red bar, NOT solid full-cell fill!)
    if (colGap) {
      try {
        sheet.addConditionalFormatting({
          ref: `${colGap}${firstDataRowIdx}:${colGap}${lastDataRowIdx}`,
          rules: [
            {
              type: 'dataBar',
              cfvo: [{ type: 'min' }, { type: 'max' }],
              color: { argb: 'FFF87171' } // Excel official soft red
            }
          ]
        });
      } catch (e) {
        console.warn('DataBar formatting failed for Gap', e);
      }
    }

    // 3. % Gap: Native Traffic Lights / Circular Indicators (Red >=90%, Yellow/Orange 70-89%, Dark <70%)
    if (colPctGap) {
      try {
        sheet.addConditionalFormatting({
          ref: `${colPctGap}${firstDataRowIdx}:${colPctGap}${lastDataRowIdx}`,
          rules: [
            {
              type: 'iconSet',
              iconSet: '3TrafficLights1', // Unrimmed traffic light circles matching sample
              reverse: true, // Higher gap is Red, lower gap is Green/Dark
              cfvo: [
                { type: 'num', value: 0 },
                { type: 'percent', value: 70 },
                { type: 'percent', value: 90 }
              ]
            }
          ]
        });
      } catch (e) {
        console.warn('IconSet formatting failed for % Gap', e);
      }
    }
  }

  if (isT01 && lastDataRowIdx >= firstDataRowIdx) {
    columns.forEach((col, cIdx) => {
      if (col.header.includes('Percentage (%)')) {
        const colLetter = getColLetter(cIdx + 2);
        try {
          sheet.addConditionalFormatting({
            ref: `${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx}`,
            rules: [
              {
                type: 'cellIs',
                operator: 'equal',
                formulae: ['0'],
                style: {
                  fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFF87171' } },
                  font: { bold: true, color: { argb: 'FFFFFFFF' } }
                }
              },
              {
                type: 'cellIs',
                operator: 'between',
                formulae: ['0.0001', '0.0199'],
                style: {
                  fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFEF08A' } },
                  font: { color: { argb: 'FF000000' } }
                }
              },
              {
                type: 'cellIs',
                operator: 'greaterThanOrEqual',
                formulae: ['0.02'],
                style: {
                  fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF86EFAC' } },
                  font: { color: { argb: 'FF000000' } }
                }
              }
            ]
          });
        } catch (e) {
          // Fallback gracefully if conditional formatting fails
        }
      }
    });
  }

  // ----------------------------------------------------
  // 7. Footer: User ID and Downloaded On
  // ----------------------------------------------------
  currentRowIdx++; // spacer
  const footerRow = sheet.getRow(currentRowIdx);
  const footerText = reportMeta.downloadInfo || `User ID: IBR_KOTWA & Downloaded on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at 11:12:08 am`;
  footerRow.values = [footerText];
  footerRow.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  footerRow.alignment = { vertical: 'middle', horizontal: 'left' };
  sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);

  // ----------------------------------------------------
  // 8. Auto-fit column widths
  // ----------------------------------------------------
  sheet.getColumn(1).width = 7; // S.NO
  columns.forEach((col, cIdx) => {
    let maxLength = col.header.length;
    rows.forEach(r => {
      const val = r[col.header];
      if (val !== undefined && val !== null) {
        const strLen = String(val).length;
        if (strLen > maxLength) maxLength = strLen;
      }
    });
    sheet.getColumn(cIdx + 2).width = Math.min(Math.max(maxLength + 4, 12), 35);
  });

  // ----------------------------------------------------
  // 9. Write to buffer and trigger download
  // ----------------------------------------------------
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Quick CSV Export function
 */
export function exportToCSV({ columns, rows, filename = 'Report.csv' }) {
  const headers = ['S.NO', ...columns.map(c => `"${c.header.replace(/"/g, '""')}"`)].join(',');
  const rowLines = rows.map((r, idx) => {
    return [
      idx + 1,
      ...columns.map(c => {
        const val = r[c.header];
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
    ].join(',');
  });

  const csvContent = [headers, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
