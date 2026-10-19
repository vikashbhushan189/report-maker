/**
 * Formula Evaluation & Report Generation Engine
 * Safely parses and calculates column formulas, summaries, and transformations.
 */

/**
 * Format a numeric value according to column formatting rules
 */
export function formatValue(val, format = 'text', decimals = 2) {
  if (val === null || val === undefined || val === '') return '—';

  if (typeof val === 'string' && isNaN(Number(val.replace(/[$,]/g, '')))) {
    return val;
  }

  const num = typeof val === 'number' ? val : Number(String(val).replace(/[$,%]/g, '').trim());

  if (isNaN(num)) return String(val);

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);

    case 'percent':
      return `${(num).toFixed(decimals)}%`;

    case 'number':
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(Math.round(num));

    case 'decimal':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);

    case 'integer':
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(Math.round(num));

    default:
      return typeof val === 'number' ? val.toLocaleString('en-US') : String(val);
  }
}

/**
 * Safe evaluator for mathematical formulas with column references
 */
export function evaluateFormula(formulaStr, contextRow) {
  if (!formulaStr || typeof formulaStr !== 'string') return 0;
  let expr = formulaStr.trim();

  try {
    // 1. Handle IF condition
    const ifRegex = /^IF\s*\((.+?),\s*(.+?),\s*(.+?)\)$/i;
    const ifMatch = expr.match(ifRegex);
    if (ifMatch) {
      const condExpr = ifMatch[1].trim();
      const trueVal = ifMatch[2].trim().replace(/^["']|["']$/g, '');
      const falseVal = ifMatch[3].trim().replace(/^["']|["']$/g, '');

      const condEvaluated = evaluateCondition(condExpr, contextRow);
      return condEvaluated ? trueVal : falseVal;
    }

    // 2. Replace column tokens [Column Name] with numeric values from contextRow
    expr = expr.replace(/\[([^\]]+)\]/g, (match, colName) => {
      const trimmedCol = colName.trim();
      const val = contextRow[trimmedCol];
      if (val === undefined || val === null || val === '') {
        return '0';
      }
      if (typeof val === 'number') {
        return String(val);
      }
      const cleanNum = Number(String(val).replace(/[$,%]/g, '').trim());
      if (!isNaN(cleanNum)) {
        return String(cleanNum);
      }
      return JSON.stringify(String(val));
    });

    // 3. Helper functions: ROUND(x, decimals), ABS(x)
    expr = expr.replace(/ROUND\s*\(([^,]+),\s*(\d+)\)/gi, (m, valExp, dec) => {
      const evaluated = evaluateMathExpression(valExp);
      return String(Number(evaluated.toFixed(Number(dec))));
    });

    expr = expr.replace(/ABS\s*\(([^)]+)\)/gi, (m, valExp) => {
      const evaluated = evaluateMathExpression(valExp);
      return String(Math.abs(evaluated));
    });

    // 4. Safe arithmetic evaluation
    return evaluateMathExpression(expr);
  } catch (err) {
    return 0;
  }
}

function evaluateCondition(condStr, contextRow) {
  const resolvedCond = condStr.replace(/\[([^\]]+)\]/g, (match, colName) => {
    const val = contextRow[colName.trim()];
    if (val === undefined || val === null) return '0';
    const num = Number(String(val).replace(/[$,%]/g, '').trim());
    return isNaN(num) ? JSON.stringify(String(val)) : String(num);
  });

  const operators = ['>=', '<=', '!=', '==', '=', '>', '<'];
  for (const op of operators) {
    if (resolvedCond.includes(op)) {
      const parts = resolvedCond.split(op);
      if (parts.length === 2) {
        const leftVal = evaluateMathExpression(parts[0]);
        const rightVal = evaluateMathExpression(parts[1]);

        switch (op) {
          case '>=': return leftVal >= rightVal;
          case '<=': return leftVal <= rightVal;
          case '!=': return leftVal !== rightVal;
          case '==':
          case '=':  return leftVal === rightVal;
          case '>':  return leftVal > rightVal;
          case '<':  return leftVal < rightVal;
        }
      }
    }
  }

  return Boolean(evaluateMathExpression(resolvedCond));
}

function evaluateMathExpression(expression) {
  if (typeof expression === 'number') return expression;
  let str = String(expression).trim();

  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return Number(str);
  }

  if (/^".*"$/.test(str) || /^'.*'$/.test(str)) {
    return str.replace(/^["']|["']$/g, '');
  }

  const sanitized = str.replace(/[^0-9+\-*/().% ]/g, '');
  if (!sanitized) return 0;

  try {
    const calc = new Function(`return (${sanitized});`);
    const res = calc();
    if (typeof res === 'number' && isFinite(res)) {
      return res;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Generate the report rows by applying column mappings, formulas, manual overrides, and ranking
 */
export function generateReportData(
  rawData,
  columnConfigs,
  groupByCol = '',
  sortByCol = '',
  sortDir = 'desc',
  manualValues = {}
) {
  if (!rawData || rawData.length === 0) return { rows: [], totals: {} };
  if (!columnConfigs || columnConfigs.length === 0) return { rows: [], totals: {} };

  // 1. Process each row to compute all requested columns
  let calculatedRows = rawData.map((rawRow, rowIndex) => {
    const panchayatName = String(rawRow['Gram Panchayat'] || '').trim();
    const context = { ...rawRow, _index: rowIndex + 1 };

    columnConfigs.forEach(col => {
      let rawVal = 0;

      // Handle Manual Editable Columns (e.g. Previous day e-KYC 10-10-2026, Target, Yesterday Progress)
      if (col.isManualEditable || col.type === 'manual') {
        const keyWithColId = col.id ? `${col.id}_${panchayatName}` : null;
        const keyWithManualKey = col.manualKey ? `${col.manualKey}_${panchayatName}` : null;

        if (keyWithColId && manualValues && manualValues[keyWithColId] !== undefined && manualValues[keyWithColId] !== '') {
          rawVal = Number(manualValues[keyWithColId]);
        } else if (keyWithManualKey && manualValues && manualValues[keyWithManualKey] !== undefined && manualValues[keyWithManualKey] !== '') {
          rawVal = Number(manualValues[keyWithManualKey]);
        } else if (manualValues && manualValues[panchayatName] !== undefined && manualValues[panchayatName] !== '' && !col.id?.startsWith('col_target') && !col.id?.startsWith('col_yesterday')) {
          rawVal = Number(manualValues[panchayatName]);
        } else if (rawRow[col.sourceCol] !== undefined && rawRow[col.sourceCol] !== '') {
          rawVal = Number(rawRow[col.sourceCol]);
        } else if (col.fallbackCol && rawRow[col.fallbackCol] !== undefined && rawRow[col.fallbackCol] !== '') {
          rawVal = Number(rawRow[col.fallbackCol]);
        } else if ((col.id === 'col_target' || col.header === 'Target') && rawRow['Active Approved Potential Lakhpati Didi']) {
          rawVal = Math.round(Number(rawRow['Active Approved Potential Lakhpati Didi']) * 0.625);
        } else {
          rawVal = 0;
        }
      } else if (col.type === 'source') {
        if (rawRow[col.sourceCol] !== undefined && rawRow[col.sourceCol] !== '') {
          rawVal = rawRow[col.sourceCol];
        } else if (col.fallbackCol && rawRow[col.fallbackCol] !== undefined) {
          rawVal = rawRow[col.fallbackCol];
        } else {
          rawVal = '';
        }
      } else if (col.type === 'formula') {
        rawVal = evaluateFormula(col.formula, context);
      }

      context[col.header] = rawVal;
      context[col.id] = rawVal;
      if (col.sourceCol) {
        context[col.sourceCol] = rawVal;
      }
    });

    return context;
  });

  // 2. Handle optional Grouping & Aggregation
  if (typeof groupByCol === 'string' && groupByCol.trim() !== '') {
    calculatedRows = aggregateByGroup(calculatedRows, columnConfigs, groupByCol);
  }

  // 3. Sort rows if sort column is specified (e.g. e-KYC Gap descending)
  if (typeof sortByCol === 'string' && sortByCol.trim() !== '') {
    calculatedRows.sort((a, b) => {
      const valA = a[sortByCol];
      const valB = b[sortByCol];
      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }
      return sortDir === 'asc'
        ? String(valA || '').localeCompare(String(valB || ''))
        : String(valB || '').localeCompare(String(valA || ''));
    });
  }

  // 4. Compute Grand Totals
  const totals = {};
  columnConfigs.forEach((col, idx) => {
    if (idx === 0) {
      totals[col.header] = 'Total';
      return;
    }

    if (!col.summaryOp || col.summaryOp === 'none') {
      totals[col.header] = '';
      return;
    }

    const numericValues = calculatedRows
      .map(r => {
        const v = r[col.header];
        const num = typeof v === 'number' ? v : Number(String(v).replace(/[$,%]/g, '').trim());
        return isNaN(num) ? null : num;
      })
      .filter(v => v !== null);

    if (numericValues.length === 0) {
      totals[col.header] = '—';
      return;
    }

    if (col.summaryOp === 'sum') {
      totals[col.header] = numericValues.reduce((acc, v) => acc + v, 0);
    } else if (col.summaryOp === 'avg') {
      totals[col.header] = numericValues.reduce((acc, v) => acc + v, 0) / numericValues.length;
    } else if (col.summaryOp === 'min') {
      totals[col.header] = Math.min(...numericValues);
    } else if (col.summaryOp === 'max') {
      totals[col.header] = Math.max(...numericValues);
    } else if (col.summaryOp === 'count') {
      totals[col.header] = numericValues.length;
    }
  });

  // 5. Accurate Weighted Ratio Totals for Percentages
  const totalMembers = totals['No. of Members *'];
  const totalWithAadhar = totals['With Aadhar'];
  const ekycCurrCol = columnConfigs.find(c => c.isEkycCurr || (c.header.startsWith('With e-KYC Adhaar') && !c.isManualEditable));
  const totalEkycCurr = ekycCurrCol ? totals[ekycCurrCol.header] : (totals['With e-KYC Adhaar 12-10-2026'] || totals['With e-KYC Adhaar']);
  const totalGap = totals['e-KYC Gap'];
  const totalMobile = totals['With Mobile No.'];
  const totalMobileVerified = totals['With Mobile No. Verified'];
  const totalMobileNotVerified = totals['With Mobile No. Not Verified'];

  if (totalMembers && totalMembers > 0) {
    if (totalWithAadhar !== undefined && totals['% With Aadhar'] !== undefined) {
      totals['% With Aadhar'] = (totalWithAadhar / totalMembers) * 100;
    }
    if (totalEkycCurr !== undefined && totals['% With e-KYC Adhaar'] !== undefined) {
      totals['% With e-KYC Adhaar'] = (totalEkycCurr / totalMembers) * 100;
    }
    if (totalGap !== undefined && totals['% e-KYC Gap'] !== undefined) {
      totals['% e-KYC Gap'] = (totalGap / totalMembers) * 100;
    }
    if (totalMobile !== undefined && totals['% With Mobile No.'] !== undefined) {
      totals['% With Mobile No.'] = (totalMobile / totalMembers) * 100;
    }
  }

  if (totalMobile && totalMobile > 0) {
    if (totalMobileVerified !== undefined && totals['% With Mobile No. Verified'] !== undefined) {
      totals['% With Mobile No. Verified'] = (totalMobileVerified / totalMobile) * 100;
    }
    if (totalMobileNotVerified !== undefined && totals['% With Mobile No. Not Verified'] !== undefined) {
      totals['% With Mobile No. Not Verified'] = (totalMobileNotVerified / totalMobile) * 100;
    }
  }

  // 6. Weighted Percentage Totals for T01 Monthly Transaction Columns (SHG & VO)
  columnConfigs.forEach(col => {
    if (col.summaryOp === 'weighted_pct_vo' || col.cellStyle === 'vo_pct' || (col.format === 'percent' && col.header.includes('Percentage') && !col.header.includes('SHGs'))) {
      const match = col.header.match(/^(.*?)\s*-\s*Percentage/i);
      if (match) {
        const monthPrefix = match[1].trim();
        const intermediary = totals[`${monthPrefix} - VOs Financial-Intermediary`] ?? totals['Total VOs'];
        const captured = totals[`${monthPrefix} - Transaction Captured`] ?? totals[`${monthPrefix} - Transactions Captured`];
        if (intermediary !== undefined && intermediary !== null && Number(intermediary) > 0 && captured !== undefined && captured !== null) {
          totals[col.header] = (Number(captured) / Number(intermediary)) * 100;
        } else if (intermediary !== undefined && intermediary !== null && Number(intermediary) === 0) {
          totals[col.header] = 0;
        }
      }
    } else if (col.summaryOp === 'weighted_pct' || (col.format === 'percent' && col.header.includes('Percentage (%)'))) {
      const match = col.header.match(/^(.*?)\s*-\s*Percentage \(%\)/i);
      if (match) {
        const monthPrefix = match[1].trim();
        const totalSHGs = totals[`${monthPrefix} - Total SHGs`];
        const captured = totals[`${monthPrefix} - Transactions Captured`];
        if (totalSHGs !== undefined && totalSHGs !== null && Number(totalSHGs) > 0 && captured !== undefined && captured !== null) {
          totals[col.header] = (Number(captured) / Number(totalSHGs)) * 100;
        } else if (totalSHGs !== undefined && totalSHGs !== null && Number(totalSHGs) === 0) {
          totals[col.header] = 0;
        }
      }
    }
  });

  // 7. Weighted Percentage Totals for Lakhpati Didi Columns (% Entry & % Gap)
  const targetTotal = totals['Target'];
  const totalEntryTotal = totals['Total Entry'] ?? totals['Aajeevika Register for Potential Lakhpati Didi PLD Entered'];
  const gapTotal = totals['Gap'];

  if (targetTotal && Number(targetTotal) > 0) {
    if (totalEntryTotal !== undefined && totals['% Entry'] !== undefined) {
      totals['% Entry'] = (Number(totalEntryTotal) / Number(targetTotal)) * 100;
    }
    if (gapTotal !== undefined && totals['% Gap'] !== undefined) {
      totals['% Gap'] = (Number(gapTotal) / Number(targetTotal)) * 100;
    }
  }

  return {
    rows: calculatedRows,
    totals
  };
}

/**
 * Returns the exact color palette for Lakhpati Didi Yesterday Progress cells
 * 0 -> Coral Red (#f87171)
 * 1-19 -> Soft Yellow (#fef08a)
 * 20-30 -> Soft Green (#86efac)
 * >30 -> Rich Green (#4ade80)
 */
export function getLakhpatiProgressColor(val) {
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[%,]/g, '').trim());
  if (isNaN(num) || num <= 0.0001) {
    return {
      bg: 'bg-[#f87171]',
      text: 'text-white font-bold',
      excelArgb: 'FFF87171',
      excelFontColor: 'FFFFFFFF'
    };
  }
  if (num >= 1 && num < 20) {
    return {
      bg: 'bg-[#fef08a]',
      text: 'text-amber-950 font-bold',
      excelArgb: 'FFFEF08A',
      excelFontColor: 'FF000000'
    };
  }
  if (num >= 20 && num <= 30) {
    return {
      bg: 'bg-[#86efac]',
      text: 'text-emerald-950 font-bold',
      excelArgb: 'FF86EFAC',
      excelFontColor: 'FF000000'
    };
  }
  return {
    bg: 'bg-[#4ade80]',
    text: 'text-emerald-950 font-bold',
    excelArgb: 'FF4ADE80',
    excelFontColor: 'FF000000'
  };
}

/**
 * Returns the exact color palette for VO Transaction Percentage cells
 * 100% -> Rich Green (#86efac)
 * 90-99.9% -> Soft Yellow (#fef08a)
 * 50-89.9% -> Light Orange (#fed7aa)
 * <50% -> Soft Red (#fca5a5)
 * 0% -> Red (#f87171)
 */
export function getVoPctColor(val) {
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[%,]/g, '').trim());
  if (isNaN(num) || num <= 0.0001) {
    return {
      bg: 'bg-[#f87171]',
      text: 'text-white font-bold',
      excelArgb: 'FFF87171'
    };
  }
  if (num >= 99.99) {
    return {
      bg: 'bg-[#86efac]',
      text: 'text-emerald-950 font-bold',
      excelArgb: 'FF86EFAC'
    };
  }
  if (num >= 90.0) {
    return {
      bg: 'bg-[#fef08a]',
      text: 'text-amber-950 font-bold',
      excelArgb: 'FFFEF08A'
    };
  }
  if (num >= 50.0) {
    return {
      bg: 'bg-[#fed7aa]',
      text: 'text-amber-900 font-semibold',
      excelArgb: 'FFFED7AA'
    };
  }
  return {
    bg: 'bg-[#fca5a5]',
    text: 'text-red-950 font-semibold',
    excelArgb: 'FFFCA5A5'
  };
}

/**
 * Returns the exact color palette for VO Yes/No Captured cells:
 * YES -> Bright Green (#00b050 / text-black font-bold)
 * NO -> Bright Red (#ff0000 / text-black font-bold)
 */
export function getVoYesNoColor(val) {
  const str = String(val || '').trim().toUpperCase();
  if (str === 'YES') {
    return {
      bg: 'bg-[#00b050]',
      text: 'text-black font-bold',
      excelArgb: 'FF00B050',
      excelFontColor: 'FF000000'
    };
  }
  if (str === 'NO') {
    return {
      bg: 'bg-[#ff0000]',
      text: 'text-black font-bold',
      excelArgb: 'FFFF0000',
      excelFontColor: 'FF000000'
    };
  }
  return {
    bg: '',
    text: 'text-slate-700',
    excelArgb: null,
    excelFontColor: 'FF000000'
  };
}

/**
 * Returns the exact color palette for T01 Transaction Percentage cells
 * Red for 0%, Yellow for <2%, Soft Green for 2%-5%, Rich Green for >=5%
 */
export function getT01PctColor(val) {
  const num = typeof val === 'number' ? val : Number(String(val).replace(/[%,]/g, '').trim());
  if (isNaN(num) || num <= 0.0001) {
    return {
      bg: 'bg-[#f87171]',
      text: 'text-white font-bold',
      excelArgb: 'FFF87171'
    };
  }
  if (num > 0 && num < 2.0) {
    return {
      bg: 'bg-[#fef08a]',
      text: 'text-amber-950 font-semibold',
      excelArgb: 'FFFEF08A'
    };
  }
  if (num >= 2.0 && num < 5.0) {
    return {
      bg: 'bg-[#86efac]',
      text: 'text-emerald-950 font-semibold',
      excelArgb: 'FF86EFAC'
    };
  }
  return {
    bg: 'bg-[#4ade80]',
    text: 'text-emerald-950 font-bold',
    excelArgb: 'FF4ADE80'
  };
}

function aggregateByGroup(rows, columnConfigs, groupByCol) {
  const groups = {};

  rows.forEach(row => {
    const key = String(row[groupByCol] || 'Other');
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });

  return Object.entries(groups).map(([groupKey, groupRows]) => {
    const aggregatedRow = {};

    columnConfigs.forEach(col => {
      if (col.sourceCol === groupByCol || col.header === groupByCol) {
        aggregatedRow[col.header] = `${groupKey} (${groupRows.length})`;
        return;
      }

      const numericVals = groupRows
        .map(r => {
          const v = r[col.header];
          const num = typeof v === 'number' ? v : Number(String(v).replace(/[$,%]/g, '').trim());
          return isNaN(num) ? null : num;
        })
        .filter(v => v !== null);

      if (numericVals.length > 0) {
        if (col.summaryOp === 'avg' || col.format === 'percent') {
          aggregatedRow[col.header] = numericVals.reduce((a, b) => a + b, 0) / numericVals.length;
        } else {
          aggregatedRow[col.header] = numericVals.reduce((a, b) => a + b, 0);
        }
      } else {
        const uniqueValues = [...new Set(groupRows.map(r => r[col.header]).filter(Boolean))];
        aggregatedRow[col.header] = uniqueValues.length === 1 ? uniqueValues[0] : `${uniqueValues.length} distinct`;
      }
    });

    return aggregatedRow;
  });
}
