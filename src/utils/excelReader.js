import * as XLSX from 'xlsx';
import { detectT01Months, detectVoMonths } from './reportTemplates.js';

/**
 * Reads an Excel or CSV File object and returns parsed workbook information
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(buffer, {
          type: 'array',
          cellDates: true,
          cellNF: true,
          cellText: false,
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No sheets found in the uploaded workbook.');
        }

        const sheetNames = workbook.SheetNames;
        const activeSheet = sheetNames[0];
        const sheetData = extractSheetData(workbook, activeSheet);

        resolve({
          rawWorkbook: workbook,
          sheetNames,
          activeSheet,
          headers: sheetData.headers,
          data: sheetData.data,
          metadata: sheetData.metadata,
          detectedMonths: sheetData.detectedMonths,
          portalTotals: sheetData.portalTotals,
          totalRowIndex: sheetData.totalRowIndex,
          dataStartRowIndex: sheetData.dataStartRowIndex,
          dataEndRowIndex: sheetData.dataEndRowIndex,
          panchayatCount: sheetData.data.length,
          columnStats: analyzeColumns(sheetData.headers, sheetData.data),
          filename: file.name,
          fileSize: file.size
        });
      } catch (err) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses raw pasted text (tab-separated from Excel copy or comma-separated CSV)
 */
export function parseRawText(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Pasted text is empty.');
  }

  const workbook = XLSX.read(rawText, { type: 'string', raw: true });
  const activeSheet = workbook.SheetNames[0];
  const sheetData = extractSheetData(workbook, activeSheet);

  return {
    rawWorkbook: workbook,
    sheetNames: ['Pasted Sheet'],
    activeSheet: 'Pasted Sheet',
    headers: sheetData.headers,
    data: sheetData.data,
    metadata: sheetData.metadata,
    detectedMonths: sheetData.detectedMonths,
    portalTotals: sheetData.portalTotals,
    totalRowIndex: sheetData.totalRowIndex,
    dataStartRowIndex: sheetData.dataStartRowIndex,
    dataEndRowIndex: sheetData.dataEndRowIndex,
    panchayatCount: sheetData.data.length,
    columnStats: analyzeColumns(sheetData.headers, sheetData.data),
    filename: 'Pasted_Data.xlsx',
    fileSize: rawText.length
  };
}

/**
 * Extract headers, metadata, portal Row 4 totals, and 16 Panchayat records (Rows 5 to 20)
 */
export function extractSheetData(workbook, sheetName) {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return { headers: [], data: [], metadata: {}, portalTotals: null };

  const rawJson = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    blankrows: false,
    defval: ''
  });

  if (!rawJson || rawJson.length === 0) {
    return { headers: [], data: [], metadata: {}, portalTotals: null };
  }

  // 1. Metadata extraction from top rows (Rows 1 & 2)
  const metadata = {
    title: 'S01 - Member KYC Details',
    period: '2026-10',
    state: 'BIHAR',
    district: 'PURBI CHAMPARAN',
    block: 'KOTWA',
    panchayat: 'All Panchayats',
    downloadInfo: ''
  };

  for (let i = 0; i < Math.min(rawJson.length, 5); i++) {
    const rowStr = rawJson[i].map(c => String(c || '').trim()).join(' ');
    if (rowStr.toLowerCase().includes('vo transactions monitoring') || rowStr.toLowerCase().includes('clf name')) {
      metadata.title = 'T01 - VO Transactions Monitoring Status';
      metadata.reportType = 't01_vo';
    } else if (rowStr.toLowerCase().includes('transactions monitoring') || rowStr.toLowerCase().includes('t01')) {
      metadata.title = 'T01 - SHG Transactions Monitoring Status';
      metadata.reportType = 't01';
    } else if (rowStr.toLowerCase().includes('member kyc details')) {
      metadata.title = 'S01 - Member KYC Details';
      metadata.reportType = 's01';
    }
    const blockMatch = rowStr.match(/block:\s*([^,\t]+)/i);
    if (blockMatch) metadata.block = blockMatch[1].trim();

    const districtMatch = rowStr.match(/district:\s*([^,\t]+)/i);
    if (districtMatch) metadata.district = districtMatch[1].trim();

    const stateMatch = rowStr.match(/state:\s*([^,\t]+)/i);
    if (stateMatch) metadata.state = stateMatch[1].trim();

    const periodMatch = rowStr.match(/period:\s*([^,\t]+)/i);
    if (periodMatch) metadata.period = periodMatch[1].trim();

    const panchayatMatch = rowStr.match(/panchayat:\s*([^,\t]+)/i);
    if (panchayatMatch) metadata.panchayat = panchayatMatch[1].trim();
  }

  // Look for bottom footer (e.g. "User ID: IBR_KOTWA & Downloaded on: ...")
  for (let i = rawJson.length - 1; i >= Math.max(0, rawJson.length - 4); i--) {
    const rowStr = rawJson[i].map(c => String(c || '').trim()).join(' ');
    if (rowStr.toLowerCase().includes('downloaded on:')) {
      metadata.downloadInfo = rowStr;
      break;
    }
  }

  // 2. Locate the Header Row (Row 3 in Excel, 0-indexed r = 2)
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(rawJson.length, 10); r++) {
    const row = rawJson[r];
    if (Array.isArray(row)) {
      const rowStrings = row.map(c => String(c || '').trim().toLowerCase());
      if (
        rowStrings.includes('gram panchayat') ||
        rowStrings.includes('panchayat') ||
        rowStrings.includes('clf name') ||
        (rowStrings.includes('state') && rowStrings.includes('district') && rowStrings.includes('block'))
      ) {
        headerRowIndex = r;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const rawHeaders = rawJson[headerRowIndex];
  const cleanHeaders = rawHeaders.map((h, i) => (h ? String(h).trim() : `Column_${i + 1}`));

  // 3. Detect and extract Row 4 (Pre-existing Total Row)
  let portalTotals = null;
  let totalRowIndex = -1;
  let dataStartRowIndex = -1;
  let dataEndRowIndex = -1;

  const data = [];

  for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
    const row = rawJson[r];
    if (!row || row.every(val => val === '' || val === null || val === undefined)) {
      continue;
    }

    const firstCell = String(row[0] || '').trim().toLowerCase();
    const secondCell = String(row[1] || '').trim().toLowerCase();
    const thirdCell = String(row[2] || '').trim().toLowerCase();
    const fourthCell = String(row[3] || '').trim().toLowerCase();

    // Check if this row is the Row 4 Total row
    const isTotalRow =
      firstCell === 'total' ||
      secondCell === 'total' ||
      thirdCell === 'total' ||
      fourthCell === 'total';

    if (isTotalRow) {
      totalRowIndex = r + 1; // 1-indexed Excel row (Row 4)
      const totalObj = { excelRow: r + 1 };
      cleanHeaders.forEach((header, colIdx) => {
        let val = row[colIdx];
        if (typeof val === 'string') {
          const cleanStr = val.replace(/,/g, '').trim();
          if (cleanStr.endsWith('%')) {
            const num = Number(cleanStr.slice(0, -1));
            if (!isNaN(num)) val = num;
          } else if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
            val = Number(cleanStr);
          }
        }
        totalObj[header] = val !== undefined ? val : '';
      });
      portalTotals = totalObj;
      continue; // Do NOT add Total as a Gram Panchayat data row
    }

    // Skip footer rows like "User ID: IBR_KOTWA..."
    if (firstCell.startsWith('user id:') || row.join(' ').toLowerCase().includes('downloaded on:')) {
      continue;
    }

    // This is an actual Gram Panchayat row (e.g. Rows 5 to 20 in Excel)
    if (dataStartRowIndex === -1) {
      dataStartRowIndex = r + 1; // Excel row 5
    }
    dataEndRowIndex = r + 1; // Excel row 20

    const rowObj = {
      _excelRowNumber: r + 1, // e.g. 5, 6, 7... 20
      _sno: data.length + 1    // 1, 2, 3... 16
    };

    cleanHeaders.forEach((header, colIdx) => {
      let val = row[colIdx];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      } else if (typeof val === 'string') {
        const cleanStr = val.replace(/,/g, '').trim();
        if (cleanStr.endsWith('%')) {
          const num = Number(cleanStr.slice(0, -1));
          if (!isNaN(num)) val = num;
        } else if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
          val = Number(cleanStr);
        }
      }
      rowObj[header] = val !== undefined ? val : '';
    });

    data.push(rowObj);
  }

  let detectedMonths = detectT01Months(cleanHeaders);
  if (!detectedMonths || detectedMonths.length === 0) {
    detectedMonths = detectVoMonths(cleanHeaders);
  }

  return {
    headers: cleanHeaders,
    data,
    metadata,
    detectedMonths,
    portalTotals,
    totalRowIndex: totalRowIndex !== -1 ? totalRowIndex : 4,
    dataStartRowIndex: dataStartRowIndex !== -1 ? dataStartRowIndex : 5,
    dataEndRowIndex: dataEndRowIndex !== -1 ? dataEndRowIndex : 20
  };
}

/**
 * Inspect columns and calculate statistics and detected types
 */
export function analyzeColumns(headers, data) {
  const stats = {};

  headers.forEach(col => {
    let numericCount = 0;
    let nonNumericCount = 0;
    let emptyCount = 0;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;

    data.forEach(row => {
      const val = row[col];
      if (val === '' || val === null || val === undefined) {
        emptyCount++;
        return;
      }

      const numVal = typeof val === 'number' ? val : Number(String(val).replace(/[$,%]/g, '').trim());
      if (!isNaN(numVal) && typeof val !== 'boolean') {
        numericCount++;
        sum += numVal;
        if (numVal < min) min = numVal;
        if (numVal > max) max = numVal;
      } else {
        nonNumericCount++;
      }
    });

    const isNumeric = numericCount > 0 && nonNumericCount === 0;
    const avg = numericCount > 0 ? sum / numericCount : 0;

    stats[col] = {
      isNumeric,
      count: data.length,
      numericCount,
      emptyCount,
      sum: isNumeric ? sum : null,
      avg: isNumeric ? avg : null,
      min: isNumeric && min !== Infinity ? min : null,
      max: isNumeric && max !== -Infinity ? max : null,
      type: isNumeric ? 'number' : 'text'
    };
  });

  return stats;
}
