// Report Heading Presets, Themes, and Default Configurations

export const REPORT_THEMES = {
  ekyc_olive: {
    id: 'ekyc_olive',
    name: 'e-KYC Govt Olive (Official Format)',
    primaryColor: '#c5d9a4', // Olive/pistachio green header from image
    primaryColorDark: '#8fa86d',
    accentBg: '#f6f9f0',
    headerText: '#000000',
    titleColor: '#c00000', // Red title as in image
    summaryBg: '#ffffff',
    summaryText: '#c00000', // Bold red total row text as in image
    borderColor: '#94a3b8',
    badgeClass: 'bg-lime-100 text-lime-800 border-lime-300'
  },
  emerald: {
    id: 'emerald',
    name: 'Excel Emerald',
    primaryColor: '#107c41',
    primaryColorDark: '#0b5a2e',
    accentBg: '#e8f5e9',
    headerText: '#ffffff',
    titleColor: '#1e293b',
    summaryBg: '#d1e7dd',
    summaryText: '#0b5a2e',
    borderColor: '#a3cfbb',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  navy: {
    id: 'navy',
    name: 'Corporate Navy',
    primaryColor: '#1e3a8a',
    primaryColorDark: '#172554',
    accentBg: '#eff6ff',
    headerText: '#ffffff',
    titleColor: '#1e3a8a',
    summaryBg: '#dbeafe',
    summaryText: '#172554',
    borderColor: '#bfdbfe',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  slate: {
    id: 'slate',
    name: 'Executive Slate',
    primaryColor: '#334155',
    primaryColorDark: '#1e293b',
    accentBg: '#f8fafc',
    headerText: '#ffffff',
    titleColor: '#1e293b',
    summaryBg: '#e2e8f0',
    summaryText: '#1e293b',
    borderColor: '#cbd5e1',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300'
  }
};

/**
 * Detect all monthly groups present in column headers (e.g. "September 2026", "August 2026", "July 2026")
 */
export function detectT01Months(headers = []) {
  const months = [];
  headers.forEach(h => {
    const match = String(h || '').match(/^(.*?)\s*-\s*(Total SHGs|SHGs Started Transactions|Transactions Captured|Percentage \(%\))/i);
    if (match) {
      const mName = match[1].trim();
      if (!months.includes(mName)) {
        months.push(mName);
      }
    }
  });
  return months;
}

/**
 * Dynamically builds column definitions for selected T01 months
 */
export function generateT01Columns(selectedMonths = ['September 2026', 'August 2026']) {
  const cols = [
    {
      id: 'col_gp',
      header: 'Gram Panchayat',
      type: 'source',
      sourceCol: 'Gram Panchayat',
      format: 'text',
      summaryOp: 'none'
    }
  ];

  selectedMonths.forEach(m => {
    cols.push({
      id: `col_${m.replace(/\s+/g, '_')}_total`,
      header: `${m} - Total SHGs`,
      type: 'source',
      sourceCol: `${m} - Total SHGs`,
      format: 'number',
      summaryOp: 'sum',
      monthGroup: m
    });
    cols.push({
      id: `col_${m.replace(/\s+/g, '_')}_started`,
      header: `${m} - SHGs Started Transactions`,
      type: 'source',
      sourceCol: `${m} - SHGs Started Transactions`,
      format: 'number',
      summaryOp: 'sum',
      monthGroup: m
    });
    cols.push({
      id: `col_${m.replace(/\s+/g, '_')}_captured`,
      header: `${m} - Transactions Captured`,
      type: 'source',
      sourceCol: `${m} - Transactions Captured`,
      format: 'number',
      summaryOp: 'sum',
      monthGroup: m
    });
    cols.push({
      id: `col_${m.replace(/\s+/g, '_')}_pct`,
      header: `${m} - Percentage (%)`,
      type: 'formula',
      formula: `([${m} - Transactions Captured] / [${m} - Total SHGs]) * 100`,
      sourceCol: `${m} - Percentage (%)`,
      format: 'percent',
      summaryOp: 'weighted_pct',
      cellStyle: 't01_pct',
      monthGroup: m
    });
  });

  return cols;
}

export const REPORT_TOPICS = [
  {
    id: 't01_transactions',
    topicName: 'T01 - SHG Transactions Monitoring Status (Official Image Format)',
    badge: 'Official SHG Monitoring Format',
    isPrimary: false,
    title: 'T01 - SHG Transactions Monitoring Status',
    subtitle: 'T01 - SHG Transactions Monitoring Status',
    companyName: 'Block: KOTWA',
    district: 'PURBI CHAMPARAN',
    block: 'KOTWA',
    panchayat: 'All Panchayats',
    dateLabel: 'Date:-10-10-2026',
    currentDate: '10-10-2026',
    theme: 'ekyc_olive',
    layoutType: 't01_grid',
    sortByCol: 'August 2026 - Percentage (%)',
    sortDir: 'asc',
    allMonths: ['September 2026', 'August 2026', 'July 2026'],
    defaultMonths: ['September 2026', 'August 2026'],
    description: 'Official T01 SHG Transaction Monitoring format with dynamic month toggles (remove/add Jul, Aug, Sep), auto-calculated formulas, and conditional percentage color scale.',
    columns: generateT01Columns(['September 2026', 'August 2026'])
  },
  {
    id: 'ekyc_progress',
    topicName: 'e-KYC Progress & Gap Ranking (Official Image Format)',
    badge: 'Official Jeevika / NRLM Format',
    isPrimary: true,
    title: 'S01 - Member KYC Details',
    subtitle: 'S01 - Member KYC Details Panchayat: All Panchayats',
    companyName: 'Block: KOTWA',
    dateLabel: 'Date:-12-10-2026',
    currentDate: '12-10-2026',
    prevDate: '10-10-2026',
    theme: 'ekyc_olive',
    layoutType: 'ekyc_grid',
    sortByCol: 'e-KYC Gap',
    sortDir: 'desc',
    description: 'Exact replica of the S01 report: ranks Gram Panchayats by e-KYC Gap, calculates progress deltas, mobile verification ratios, and red total summary row.',
    columns: [
      { id: 'col_gp', header: 'Gram Panchayat', type: 'source', sourceCol: 'Gram Panchayat', format: 'text', summaryOp: 'none' },
      { id: 'col_members', header: 'No. of Members *', type: 'source', sourceCol: 'No. of Members *', format: 'number', summaryOp: 'sum' },
      { id: 'col_aadhar', header: 'With Aadhar', type: 'source', sourceCol: 'With Aadhar', format: 'number', summaryOp: 'sum' },
      { id: 'col_pct_aadhar', header: '% With Aadhar', type: 'formula', formula: '([With Aadhar] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_ekyc_curr', header: 'With e-KYC Adhaar 12-10-2026', type: 'source', sourceCol: 'With e-KYC Adhaar', format: 'number', summaryOp: 'sum', cellStyle: 'green_highlight' },
      {
        id: 'col_ekyc_prev',
        header: 'With e-KYC Adhaar 10-10-2026',
        type: 'manual', // Manual editable column
        isManualEditable: true,
        manualKey: 'ekyc_prev',
        sourceCol: 'With e-KYC Adhaar Prev',
        fallbackCol: 'With e-KYC Adhaar',
        format: 'number',
        summaryOp: 'sum',
        helpText: 'Click to edit or upload yesterday file'
      },
      { id: 'col_pct_ekyc', header: '% With e-KYC Adhaar', type: 'formula', formula: '([With e-KYC Adhaar 12-10-2026] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_gap', header: 'e-KYC Gap', type: 'formula', formula: '[With Aadhar] - [With e-KYC Adhaar 12-10-2026]', format: 'number', summaryOp: 'sum', cellStyle: 'red_highlight', headerColor: '#c00000' },
      { id: 'col_pct_gap', header: '% e-KYC Gap', type: 'formula', formula: '([e-KYC Gap] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg', indicator: 'arrow_gap', headerColor: '#c00000' },
      { id: 'col_progress', header: 'Yesterday e-KYC Progress', type: 'formula', formula: '[With e-KYC Adhaar 12-10-2026] - [With e-KYC Adhaar 10-10-2026]', format: 'integer', summaryOp: 'sum', cellStyle: 'progress_badge' },
      { id: 'col_mob', header: 'With Mobile No.', type: 'source', sourceCol: 'With Mobile No.', format: 'number', summaryOp: 'sum' },
      { id: 'col_pct_mob', header: '% With Mobile No.', type: 'formula', formula: '([With Mobile No.] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_mob_ver', header: 'With Mobile No. Verified', type: 'source', sourceCol: 'With Mobile No. Verified', format: 'number', summaryOp: 'sum', cellStyle: 'green_highlight' },
      { id: 'col_pct_mob_ver', header: '% With Mobile No. Verified', type: 'formula', formula: '([With Mobile No. Verified] / [With Mobile No.]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_mob_not_ver', header: 'With Mobile No. Not Verified', type: 'formula', formula: '[With Mobile No.] - [With Mobile No. Verified]', format: 'number', summaryOp: 'sum', cellStyle: 'red_highlight' },
      { id: 'col_pct_mob_not_ver', header: '% With Mobile No. Not Verified', type: 'formula', formula: '([With Mobile No. Not Verified] / [With Mobile No.]) * 100', format: 'percent', summaryOp: 'avg', indicator: 'arrow_not_ver', headerColor: '#c00000' }
    ]
  },
  {
    id: 'bank_seeding',
    topicName: 'Bank Account & Aadhaar Seeding Gap Audit',
    badge: 'Bank A/c & Aadhaar Focus',
    title: 'S01 - Bank Account & Aadhaar Seeding Audit',
    subtitle: 'S01 - Member Bank Account Coverage Panchayat: All Panchayats',
    companyName: 'Block: KOTWA',
    dateLabel: 'Date:-12-10-2026',
    currentDate: '12-10-2026',
    prevDate: '10-10-2026',
    theme: 'ekyc_olive',
    layoutType: 'ekyc_grid',
    sortByCol: 'Bank A/c Gap',
    sortDir: 'desc',
    description: 'Tracks bank account coverage gaps and Aadhaar seeding rates per Gram Panchayat, ranked by highest remaining bank seeding gap.',
    columns: [
      { id: 'col_gp', header: 'Gram Panchayat', type: 'source', sourceCol: 'Gram Panchayat', format: 'text', summaryOp: 'none' },
      { id: 'col_members', header: 'No. of Members *', type: 'source', sourceCol: 'No. of Members *', format: 'number', summaryOp: 'sum' },
      { id: 'col_bank', header: 'With Bank A/c *', type: 'source', sourceCol: 'With Bank A/c *', format: 'number', summaryOp: 'sum', cellStyle: 'green_highlight' },
      { id: 'col_pct_bank', header: '% With Bank A/c', type: 'formula', formula: '([With Bank A/c *] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_bank_gap', header: 'Bank A/c Gap', type: 'formula', formula: '[No. of Members *] - [With Bank A/c *]', format: 'number', summaryOp: 'sum', cellStyle: 'red_highlight', headerColor: '#c00000' },
      { id: 'col_pct_bank_gap', header: '% Bank A/c Gap', type: 'formula', formula: '(([No. of Members *] - [With Bank A/c *]) / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg', headerColor: '#c00000' },
      { id: 'col_aadhar', header: 'With Aadhar', type: 'source', sourceCol: 'With Aadhar', format: 'number', summaryOp: 'sum' },
      { id: 'col_pct_aadhar', header: '% With Aadhar', type: 'formula', formula: '([With Aadhar] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_aadhar_gap', header: 'Aadhaar Gap', type: 'formula', formula: '[No. of Members *] - [With Aadhar]', format: 'number', summaryOp: 'sum', cellStyle: 'red_highlight', headerColor: '#c00000' },
      { id: 'col_ekyc_curr', header: 'With e-KYC Adhaar', type: 'source', sourceCol: 'With e-KYC Adhaar', format: 'number', summaryOp: 'sum', cellStyle: 'green_highlight' },
      { id: 'col_pct_ekyc', header: '% With e-KYC Adhaar', type: 'formula', formula: '([With e-KYC Adhaar] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg' }
    ]
  },
  {
    id: 'mobile_audit',
    topicName: 'Mobile Number Verification & Pending Audit',
    badge: 'Mobile Number Focus',
    title: 'S01 - Mobile Number Verification Audit Report',
    subtitle: 'S01 - Member Mobile Verification Status: All Panchayats',
    companyName: 'Block: KOTWA',
    dateLabel: 'Date:-12-10-2026',
    currentDate: '12-10-2026',
    prevDate: '10-10-2026',
    theme: 'ekyc_olive',
    layoutType: 'ekyc_grid',
    sortByCol: 'With Mobile No. Not Verified',
    sortDir: 'desc',
    description: 'Pinpoints Panchayats with high numbers of pending unverified mobile numbers to guide ground-level mobilization.',
    columns: [
      { id: 'col_gp', header: 'Gram Panchayat', type: 'source', sourceCol: 'Gram Panchayat', format: 'text', summaryOp: 'none' },
      { id: 'col_members', header: 'No. of Members *', type: 'source', sourceCol: 'No. of Members *', format: 'number', summaryOp: 'sum' },
      { id: 'col_mob', header: 'With Mobile No.', type: 'source', sourceCol: 'With Mobile No.', format: 'number', summaryOp: 'sum' },
      { id: 'col_pct_mob', header: '% With Mobile No.', type: 'formula', formula: '([With Mobile No.] / [No. of Members *]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_no_mob', header: 'Without Mobile No.', type: 'formula', formula: '[No. of Members *] - [With Mobile No.]', format: 'number', summaryOp: 'sum', cellStyle: 'red_highlight', headerColor: '#c00000' },
      { id: 'col_mob_ver', header: 'With Mobile No. Verified', type: 'source', sourceCol: 'With Mobile No. Verified', format: 'number', summaryOp: 'sum', cellStyle: 'green_highlight' },
      { id: 'col_pct_mob_ver', header: '% With Mobile No. Verified', type: 'formula', formula: '([With Mobile No. Verified] / [With Mobile No.]) * 100', format: 'percent', summaryOp: 'avg' },
      { id: 'col_mob_not_ver', header: 'With Mobile No. Not Verified', type: 'formula', formula: '[With Mobile No.] - [With Mobile No. Verified]', format: 'number', summaryOp: 'sum', cellStyle: 'red_highlight', headerColor: '#c00000' },
      { id: 'col_pct_mob_not_ver', header: '% With Mobile No. Not Verified', type: 'formula', formula: '([With Mobile No. Not Verified] / [With Mobile No.]) * 100', format: 'percent', summaryOp: 'avg', indicator: 'arrow_not_ver', headerColor: '#c00000' }
    ]
  },
  {
    id: 'master_kyc',
    topicName: 'Complete S01 KYC Master Portal Sheet',
    badge: 'Clean Portal View',
    title: 'S01 - Member KYC Details Master Sheet',
    subtitle: 'S01 - Member KYC Details Panchayat: All Panchayats',
    companyName: 'Block: KOTWA',
    dateLabel: 'Date:-12-10-2026',
    currentDate: '12-10-2026',
    prevDate: '10-10-2026',
    theme: 'ekyc_olive',
    layoutType: 'ekyc_grid',
    sortByCol: '',
    sortDir: 'asc',
    description: 'Formatted and printable view of all raw portal columns with calculated totals.',
    columns: [
      { id: 'col_state', header: 'State', type: 'source', sourceCol: 'State', format: 'text', summaryOp: 'none' },
      { id: 'col_dist', header: 'District', type: 'source', sourceCol: 'District', format: 'text', summaryOp: 'none' },
      { id: 'col_block', header: 'Block', type: 'source', sourceCol: 'Block', format: 'text', summaryOp: 'none' },
      { id: 'col_gp', header: 'Gram Panchayat', type: 'source', sourceCol: 'Gram Panchayat', format: 'text', summaryOp: 'none' },
      { id: 'col_members', header: 'No. of Members *', type: 'source', sourceCol: 'No. of Members *', format: 'number', summaryOp: 'sum' },
      { id: 'col_bank', header: 'With Bank A/c *', type: 'source', sourceCol: 'With Bank A/c *', format: 'number', summaryOp: 'sum' },
      { id: 'col_pct_bank', header: '% With Bank A/c', type: 'source', sourceCol: '% With Bank A/c', format: 'percent', summaryOp: 'avg' },
      { id: 'col_aadhar', header: 'With Aadhar', type: 'source', sourceCol: 'With Aadhar', format: 'number', summaryOp: 'sum' },
      { id: 'col_pct_aadhar', header: '% With Aadhar', type: 'source', sourceCol: '% With Aadhar', format: 'percent', summaryOp: 'avg' },
      { id: 'col_ekyc', header: 'With e-KYC Adhaar', type: 'source', sourceCol: 'With e-KYC Adhaar', format: 'number', summaryOp: 'sum', cellStyle: 'green_highlight' },
      { id: 'col_pct_ekyc', header: '% With e-KYC Adhaar', type: 'source', sourceCol: '% With e-KYC Adhaar', format: 'percent', summaryOp: 'avg' },
      { id: 'col_mob', header: 'With Mobile No.', type: 'source', sourceCol: 'With Mobile No.', format: 'number', summaryOp: 'sum' },
      { id: 'col_pct_mob', header: '% With Mobile No.', type: 'source', sourceCol: '% With Mobile No.', format: 'percent', summaryOp: 'avg' },
      { id: 'col_mob_ver', header: 'With Mobile No. Verified', type: 'source', sourceCol: 'With Mobile No. Verified', format: 'number', summaryOp: 'sum', cellStyle: 'green_highlight' },
      { id: 'col_pct_mob_ver', header: '% With Mobile No. Verified', type: 'source', sourceCol: '% With Mobile No. Verified', format: 'percent', summaryOp: 'avg' }
    ]
  }
];

export const REPORT_HEADING_PRESETS = REPORT_TOPICS;
