import ExcelJS from 'exceljs';
import { REPORT_THEMES } from './reportTemplates';

/**
 * Generates and downloads a professionally styled Excel (.xlsx) report
 * exactly matching the layout, colors, and headers in the official report image.
 */
export async function exportToStyledExcel({
  reportMeta,
  columns,
  rows,
  totals,
  filename = 'eKYC_Progress_Report.xlsx'
}) {
  const theme = REPORT_THEMES[reportMeta.theme] || REPORT_THEMES.ekyc_olive;
  const isEkyc = reportMeta.presetId === 'ekyc_progress' || reportMeta.layoutType === 'ekyc_grid';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Report Studio';
  workbook.lastModifiedBy = 'Report Studio';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('KYC Progress Report', {
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

  if (isEkyc) {
    // 1. Top Title: Red Bold Centered ("S01 - Member KYC Details")
    const titleRow = sheet.getRow(currentRowIdx);
    titleRow.values = [reportMeta.title || 'S01 - Member KYC Details'];
    titleRow.height = 28;
    titleRow.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFC00000' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.mergeCells(currentRowIdx, 1, currentRowIdx, totalColsCount);
    currentRowIdx++;

    // 2. 3-Box Subheader Row as in the image:
    // Box 1 (Cols 1-4): Block: KOTWA
    // Box 2 (Cols 5-13): S01 - Member KYC Details Panchayat: All Panchayats
    // Box 3 (Cols 14-17): Date:-12-10-2026
    const subheaderRow = sheet.getRow(currentRowIdx);
    subheaderRow.height = 24;

    const blockText = reportMeta.companyName || 'Block: KOTWA';
    const centerText = reportMeta.subtitle || 'S01 - Member KYC Details Panchayat: All Panchayats';
    const dateText = reportMeta.dateLabel || 'Date:-12-10-2026';

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

    // Apply borders to subheader cells
    for (let c = 1; c <= totalColsCount; c++) {
      sheet.getCell(currentRowIdx, c).border = borderThin;
    }
    currentRowIdx++;
  } else {
    // Standard banner for other templates
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

    currentRowIdx++; // spacer
  }

  // 3. Table Column Header Row: Olive Green Background (#C5D9A4)
  const headerRowIdx = currentRowIdx;
  const headerRow = sheet.getRow(headerRowIdx);
  headerRow.values = ['S.No', ...columns.map(col => col.header)];
  headerRow.height = 36;

  const headerBgArgb = hexToArgb(theme.primaryColor || '#c5d9a4');

  headerRow.eachCell((cell, colIdx) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerBgArgb }
    };

    const colObj = colIdx > 1 ? columns[colIdx - 2] : null;
    const isRed = colObj && (colObj.headerColor === '#c00000' || colObj.header.includes('Gap') || colObj.header.includes('Not Verified'));

    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: isRed ? 'FFC00000' : 'FF000000' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = borderThin;
  });
  currentRowIdx++;

  const firstDataRowIdx = currentRowIdx;

  // 4. Data Rows
  rows.forEach((row, rowIdx) => {
    const dataRow = sheet.getRow(currentRowIdx);
    dataRow.height = 20;

    const rowValues = [
      rowIdx + 1, // S.No
      ...columns.map(col => {
        const val = row[col.header];
        if (val === null || val === undefined || val === '') return '';
        const num = typeof val === 'number' ? val : Number(String(val).replace(/[$,%]/g, '').trim());
        if (col.format === 'percent' && !isNaN(num)) {
          return num / 100; // in Excel, 95.08% is 0.9508
        }
        if (col.format !== 'text' && !isNaN(num) && typeof val !== 'boolean') {
          return num;
        }
        return val;
      })
    ];

    dataRow.values = rowValues;

    dataRow.eachCell((cell, colIdx) => {
      cell.border = borderThin;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF000000' } };

      if (colIdx === 1) {
        // S.No
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        return;
      }

      const col = columns[colIdx - 2];
      if (!col) return;

      // Special cell highlight fills as in image
      if (col.cellStyle === 'green_highlight') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF86EFAC' } // Soft light green
        };
      } else if (col.cellStyle === 'red_highlight') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF87171' } // Soft coral red
        };
      } else if (col.cellStyle === 'progress_badge') {
        const numVal = Number(cell.value);
        let progBg = 'FFFDE047'; // yellow default
        if (numVal >= 10) progBg = 'FF4ADE80';
        else if (numVal >= 4) progBg = 'FF86EFAC';
        else if (numVal <= 0) progBg = numVal < 0 ? 'FFF87171' : 'FFFED7AA';

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: progBg }
        };
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF000000' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Excel Number Formats
      if (col.format === 'currency') {
        cell.numFmt = '$#,##0.00;($#,##0.00);"-"';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (col.format === 'percent') {
        cell.numFmt = '0.00%';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (col.format === 'number') {
        cell.numFmt = '#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (col.format === 'integer') {
        cell.numFmt = '#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    currentRowIdx++;
  });

  const lastDataRowIdx = currentRowIdx - 1;

  // 5. Total Row: Bold Red Text as in Image
  if (totals && rows.length > 0) {
    const totalRow = sheet.getRow(currentRowIdx);
    totalRow.height = 24;

    const totalValues = [
      '', // S.No blank or dash
      ...columns.map((col, cIdx) => {
        if (cIdx === 0) return 'Total';
        if (!col.summaryOp || col.summaryOp === 'none') return '';

        const val = totals[col.header];
        if (val === null || val === undefined || val === '') return '';

        if (col.format === 'percent') {
          const num = typeof val === 'number' ? val : Number(String(val).replace(/[%,]/g, '').trim());
          return isNaN(num) ? '' : num / 100;
        }

        const num = typeof val === 'number' ? val : Number(String(val).replace(/[$,%]/g, '').trim());
        return isNaN(num) ? val : num;
      })
    ];

    totalRow.values = totalValues;

    totalRow.eachCell((cell, colIdx) => {
      // Bold Red Font as in Image
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFC00000' } // Exact red from image
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'double', color: { argb: 'FFC00000' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      };

      if (colIdx === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        return;
      }

      const col = columns[colIdx - 2];
      if (col) {
        if (col.format === 'percent') {
          cell.numFmt = '0.00%';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (col.format === 'number' || col.format === 'integer') {
          cell.numFmt = '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (colIdx === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      }
    });
  }

  // 6. Auto-fit column widths
  sheet.getColumn(1).width = 7; // S.No
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

  // 7. Write to buffer and trigger browser download
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
export function exportToCSV({ columns, rows, filename = 'KYC_Report.csv' }) {
  const headers = ['S.No', ...columns.map(c => `"${c.header.replace(/"/g, '""')}"`)].join(',');
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
