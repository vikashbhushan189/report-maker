import React, { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Edit3,
  ArrowUpDown
} from 'lucide-react';
import { formatValue, getT01PctColor, getVoPctColor, getVoYesNoColor } from '../utils/formulaEngine';
import { REPORT_THEMES } from '../utils/reportTemplates';
import ManualDataModal from './ManualDataModal';

export default function ReportViewer({
  reportMeta,
  columns,
  rows,
  totals,
  onExportExcel,
  onExportCSV,
  isExporting,
  manualValues = {},
  onSaveManualValues,
  onUpdateSingleManualValue
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showManualModal, setShowManualModal] = useState(false);

  const theme = REPORT_THEMES[reportMeta.theme] || REPORT_THEMES.ekyc_olive;
  const isVoIndividual = reportMeta.presetId === 't01_vo_individual' || reportMeta.layoutType === 't01_vo_individual_grid';
  const isVo = !isVoIndividual && (reportMeta.presetId === 't01_vo_transactions' || reportMeta.layoutType === 't01_vo_grid');
  const isT01 = !isVoIndividual && !isVo && (reportMeta.presetId === 't01_transactions' || reportMeta.layoutType === 't01_grid');
  const isEkyc = !isVoIndividual && !isVo && !isT01 && (reportMeta.presetId === 'ekyc_progress' || reportMeta.layoutType === 'ekyc_grid');

  const [sortCol, setSortCol] = useState(reportMeta.sortByCol || '');
  const [sortDir, setSortDir] = useState(reportMeta.sortDir || 'asc');

  const handleHeaderClick = (colHeader) => {
    if (sortCol === colHeader) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colHeader);
      setSortDir('asc');
    }
  };

  // Search filter
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row => {
      return columns.some(col => {
        const val = row[col.header];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
      });
    });
  }, [rows, columns, searchTerm]);

  // Sort rows
  const sortedRows = useMemo(() => {
    let result = [...filteredRows];
    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        const numA = typeof valA === 'number' ? valA : Number(String(valA || '').replace(/[$,%]/g, '').trim());
        const numB = typeof valB === 'number' ? valB : Number(String(valB || '').replace(/[$,%]/g, '').trim());
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA;
        }
        return sortDir === 'asc'
          ? String(valA || '').localeCompare(String(valB || ''))
          : String(valB || '').localeCompare(String(valA || ''));
      });
    }
    return result;
  }, [filteredRows, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // List of Gram Panchayats and current e-KYC map for the modal
  const { panchayatsList, currentEkycMap } = useMemo(() => {
    const list = [];
    const map = {};
    const currColObj = columns.find(c => c.isEkycCurr || (c.header.startsWith('With e-KYC Adhaar') && !c.isManualEditable));
    const currHeader = currColObj ? currColObj.header : 'With e-KYC Adhaar';

    rows.forEach(r => {
      const gp = String(r['Gram Panchayat'] || '').trim();
      if (gp && !list.includes(gp)) {
        list.push(gp);
        const currVal = r[currHeader] !== undefined ? r[currHeader] : (r['With e-KYC Adhaar 12-10-2026'] || r['With e-KYC Adhaar'] || 0);
        map[gp] = Number(currVal);
      }
    });
    return { panchayatsList: list, currentEkycMap: map };
  }, [rows, columns]);

  // Helper for progress cell color in e-KYC report
  const getProgressBg = (val) => {
    const num = Number(val);
    if (isNaN(num)) return '';
    if (num >= 10) return 'bg-[#4ade80] text-emerald-950 font-bold'; // Rich green
    if (num >= 4) return 'bg-[#86efac] text-emerald-900 font-semibold'; // Light green
    if (num >= 1) return 'bg-[#fde047] text-amber-950 font-semibold'; // Yellow
    if (num === 0) return 'bg-[#fed7aa] text-amber-900 font-semibold'; // Light orange
    return 'bg-[#f87171] text-white font-bold'; // Negative red
  };

  // Helper for arrow indicators
  const renderIndicator = (col, val) => {
    const num = Number(String(val).replace(/[%,]/g, ''));
    if (isNaN(num)) return null;

    if (col.indicator === 'arrow_gap') {
      if (num >= 30) {
        return <span className="inline-block text-red-600 font-bold ml-1">⬇</span>;
      } else if (num >= 20) {
        return <span className="inline-block text-amber-500 font-bold ml-1">➡</span>;
      } else {
        return <span className="inline-block text-emerald-600 font-bold ml-1">⬆</span>;
      }
    }

    if (col.indicator === 'arrow_not_ver') {
      if (num >= 85) {
        return <span className="inline-block text-red-600 font-bold ml-1">▼</span>;
      } else if (num >= 70) {
        return <span className="inline-block text-amber-500 font-bold ml-1">➡</span>;
      } else {
        return <span className="inline-block text-emerald-600 font-bold ml-1">▲</span>;
      }
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* 1. Action & Export Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in report..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Quick Manual Entry Button */}
          {isEkyc && (
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition shrink-0 shadow-2xs"
              title="Manually fill or paste previous day e-KYC counts"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-700" />
              <span>Fill Previous Day e-KYC ({reportMeta.dayBeforeYesterdayDate || reportMeta.prevDate || '10-10-2026'})</span>
            </button>
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onExportExcel}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 bg-[#15803d] hover:bg-[#166534]"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download Exact Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2. Official Report Container (Exact image replica) */}
      <div className="bg-white border-2 border-slate-300 shadow-lg rounded-xl overflow-hidden">
        {isVo || isVoIndividual ? (
          <div>
            {/* VO Top Title: Red Centered on Gray/Beige Background */}
            <div className="py-2.5 px-4 text-center border-b border-slate-300 bg-slate-200">
              <h1 className="text-base sm:text-lg font-bold text-[#c00000] tracking-wide uppercase">
                {reportMeta.title || 'T01 - VO Transactions Monitoring Status'}
              </h1>
            </div>

            {/* VO 3-Box Subheader Row: District, Block, Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 border-b-2 border-slate-400 bg-slate-50 text-xs font-bold text-[#c00000]">
              <div className="py-2 px-3 text-center border-b md:border-b-0 border-r border-slate-300 flex items-center justify-center">
                <span>District: {reportMeta.district || 'PURBI CHAMPARAN'}</span>
              </div>
              <div className="py-2 px-3 text-center border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center">
                <span>Block: {reportMeta.companyName?.replace(/^Block:\s*/i, '').trim() || 'KOTWA'}</span>
              </div>
              <div className="py-2 px-3 text-center flex items-center justify-center">
                <span>Date:-{reportMeta.currentDate || (isVoIndividual ? '12-10-2026' : '13-10-2026')}</span>
              </div>
            </div>
          </div>
        ) : isT01 ? (
          <div>
            {/* T01 Top Title: Red Centered on Gray/Beige Background */}
            <div className="py-2.5 px-4 text-center border-b border-slate-300 bg-slate-200">
              <h1 className="text-base sm:text-lg font-bold text-[#c00000] tracking-wide uppercase">
                {reportMeta.title || 'T01 - SHG Transactions Monitoring Status'}
              </h1>
            </div>

            {/* T01 4-Box Subheader Row: District, Block, Panchayat, Date */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b-2 border-slate-400 bg-slate-50 text-xs font-bold text-[#c00000]">
              <div className="py-2 px-3 text-center border-b md:border-b-0 border-r border-slate-300 flex items-center justify-center">
                <span>District: {reportMeta.district || 'PURBI CHAMPARAN'}</span>
              </div>
              <div className="py-2 px-3 text-center border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center">
                <span>Block: {reportMeta.companyName?.replace(/^Block:\s*/i, '').trim() || 'KOTWA'}</span>
              </div>
              <div className="py-2 px-3 text-center border-r border-slate-300 flex items-center justify-center">
                <span>Panchayat: {reportMeta.panchayat || 'All Panchayats'}</span>
              </div>
              <div className="py-2 px-3 text-center flex items-center justify-center">
                <span>Date:-{reportMeta.currentDate || '10-10-2026'}</span>
              </div>
            </div>
          </div>
        ) : isEkyc ? (
          <div>
            {/* S01 Top Title: Red Centered */}
            <div className="py-2.5 px-4 text-center border-b border-slate-300 bg-white">
              <h1 className="text-base sm:text-lg font-bold text-[#c00000] tracking-wide">
                {reportMeta.title || 'S01 - Member KYC Details'}
              </h1>
            </div>

            {/* S01 3-Part Subheader Row as in Image */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-400 bg-white text-xs font-bold text-[#c00000]">
              <div className="md:col-span-3 py-2 px-4 text-center border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center">
                <span>{reportMeta.companyName || 'Block: KOTWA'}</span>
              </div>
              <div className="md:col-span-6 py-2 px-4 text-center border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center">
                <span>{reportMeta.subtitle || 'S01 - Member KYC Details Panchayat: All Panchayats'}</span>
              </div>
              <div className="md:col-span-3 py-2 px-4 text-center flex items-center justify-center">
                <span>{reportMeta.dateLabel || `Date:-${reportMeta.yesterdayDate || '12-10-2026'}`}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-200" style={{ borderTop: `4px solid ${theme.primaryColor}` }}>
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <div className="text-xs font-bold uppercase text-slate-400">
                  {reportMeta.companyName || 'Enterprise Corporation'}
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {reportMeta.title || 'Executive Report'}
                </h2>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5 sm:text-right font-mono">
                <div>Date: {new Date().toLocaleDateString('en-US')}</div>
                <div>Records: {rows.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto min-h-[360px] max-h-[650px]">
          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            {/* Table Header: Olive Green Background as in Image */}
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: theme.primaryColor, color: theme.headerText }}>
                <th className="py-2 px-2 font-bold text-center border border-slate-400 w-10 select-none">
                  S.No
                </th>
                {columns.map(col => {
                  const isRedHeader = col.headerColor === '#c00000' || col.header.includes('Gap') || col.header.includes('Not Verified');
                  const isManual = col.isManualEditable || col.type === 'manual';
                  const isSorted = sortCol === col.header;

                  return (
                    <th
                      key={col.id}
                      onClick={() => handleHeaderClick(col.header)}
                      className={`py-2 px-2 font-bold text-center border border-slate-400 whitespace-nowrap cursor-pointer hover:bg-black/5 select-none transition ${
                        isRedHeader ? 'text-[#c00000]' : 'text-slate-900'
                      }`}
                      title="Click to sort by this column"
                    >
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <div className="flex items-center gap-1">
                          <span>{col.header}</span>
                          {isSorted && (
                            <span className="text-xs text-emerald-900 font-extrabold">
                              {sortDir === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                          {isManual && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowManualModal(true); }}
                              className="text-amber-800 hover:text-amber-950 p-0.5 rounded hover:bg-amber-200/50"
                              title="Click to edit / paste previous day numbers"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 font-sans text-[11px]">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                    No data rows available.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rIdx) => {
                  const actualRowNumber = (currentPage - 1) * pageSize + rIdx + 1;
                  const gpName = String(row['Gram Panchayat'] || '').trim();

                  return (
                    <tr key={rIdx} className="hover:bg-amber-50/40 transition">
                      {/* S.No */}
                      <td className="py-1.5 px-2 text-center border border-slate-300 text-slate-600 font-medium">
                        {actualRowNumber}
                      </td>

                      {/* Columns */}
                      {columns.map((col, cIdx) => {
                        const rawVal = row[col.header];
                        const isFirstText = cIdx === 0 && col.format === 'text';
                        const isManual = col.isManualEditable || col.type === 'manual';

                        // If this column is manual editable, render an inline interactive input!
                        if (isManual) {
                          const manualVal = manualValues[gpName] !== undefined ? manualValues[gpName] : rawVal;

                          return (
                            <td key={col.id} className="border border-slate-300 p-0.5 text-center bg-amber-50/40">
                              <input
                                type="number"
                                value={manualVal === '' ? '' : manualVal}
                                onChange={(e) => onUpdateSingleManualValue(gpName, e.target.value)}
                                className="w-full text-right font-mono font-bold bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-amber-400 focus:border-emerald-500 rounded px-1.5 py-1 text-slate-900 text-xs focus:outline-hidden"
                                placeholder="0"
                                title={`Edit previous e-KYC count for ${gpName}`}
                              />
                            </td>
                          );
                        }

                        // Check special cell styles as in the image
                        let cellClass = 'border border-slate-300 py-1.5 px-2 whitespace-nowrap ';

                        if (col.cellStyle === 'vo_yes_no' || (isVoIndividual && col.header.includes('Transactions Captured'))) {
                          const colorMeta = getVoYesNoColor(rawVal);
                          cellClass += `${colorMeta.bg} ${colorMeta.text} text-center font-bold `;
                        } else if (isVoIndividual && ['eBK Mobile Number', 'Transaction Start Date', 'Financial Intermediary'].includes(col.header)) {
                          cellClass += 'text-center font-medium text-slate-800 ';
                        } else if (col.cellStyle === 'vo_pct' || (isVo && col.header.includes('Percentage'))) {
                          const colorMeta = getVoPctColor(rawVal);
                          cellClass += `${colorMeta.bg} ${colorMeta.text} text-right `;
                        } else if (col.cellStyle === 't01_pct' || col.header.includes('Percentage (%)')) {
                          const colorMeta = getT01PctColor(rawVal);
                          cellClass += `${colorMeta.bg} ${colorMeta.text} text-right `;
                        } else if (col.cellStyle === 'green_highlight') {
                          cellClass += 'bg-[#86efac]/80 font-medium text-slate-900 text-right ';
                        } else if (col.cellStyle === 'red_highlight') {
                          cellClass += 'bg-[#f87171]/80 font-medium text-slate-900 text-right ';
                        } else if (col.cellStyle === 'progress_badge') {
                          cellClass += `${getProgressBg(rawVal)} text-center font-bold `;
                        } else if (isFirstText) {
                          cellClass += 'text-left font-semibold text-slate-800 ';
                        } else if (col.format !== 'text') {
                          cellClass += 'text-right font-medium text-slate-900 ';
                        } else {
                          cellClass += 'text-left text-slate-700 ';
                        }

                        const formatted = formatValue(rawVal, col.format);

                        return (
                          <td key={col.id} className={cellClass}>
                            <div className="flex items-center justify-between gap-1">
                              <span className={isFirstText ? 'text-left' : 'w-full text-right'}>
                                {formatted}
                              </span>
                              {renderIndicator(col, rawVal)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Row: Bold Red Text as in Image (Omitted for Individual VO reports) */}
            {!isVoIndividual && totals && rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-10">
                <tr className={`font-bold border-t-2 border-slate-400 border-b-2 border-slate-400 ${
                  isVo || isT01 ? 'bg-rose-100/80 text-slate-900' : 'bg-white text-[#c00000]'
                }`}>
                  <td className="py-2 px-2 text-center border border-slate-300">
                    —
                  </td>
                  {columns.map((col, cIdx) => {
                    const isFirst = cIdx === 0;
                    const totalVal = totals[col.header];

                    let displayVal = '';
                    if (isFirst) {
                      displayVal = 'Total';
                    } else if (totalVal !== undefined && totalVal !== '') {
                      displayVal = formatValue(totalVal, col.format);
                    }

                    return (
                      <td
                        key={col.id}
                        className={`py-2 px-2 border border-slate-300 whitespace-nowrap ${
                          isFirst ? 'text-center font-extrabold text-sm' : 'text-right font-bold'
                        }`}
                      >
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Footer: User ID & Download info as in Image */}
        <div className="px-4 py-2 text-[10px] text-slate-500 italic bg-white border-t border-slate-200">
          {reportMeta.downloadInfo || (isVoIndividual ? 'User ID: IBR_KOTWA & Downloaded on: 12 October 2026 at 11:44:59 am' : `User ID: IBR_KOTWA & Downloaded on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at 11:12:08 am`)}
        </div>

        {/* Table Pagination */}
        <div className="p-2.5 border-t border-slate-300 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-hidden"
            >
              <option value={16}>16 (Panchayats)</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={60}>60 (All VOs)</option>
              <option value={100}>100</option>
            </select>
            <span>• Total {rows.length} records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-slate-700 px-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Data Fill Modal */}
      <ManualDataModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        panchayats={panchayatsList}
        currentEkycMap={currentEkycMap}
        manualValues={manualValues}
        onSaveManualValues={onSaveManualValues}
        prevDateLabel={reportMeta.dayBeforeYesterdayDate || reportMeta.prevDate || '10-10-2026'}
        currentDateLabel={reportMeta.yesterdayDate || reportMeta.currentDate || '12-10-2026'}
      />
    </div>
  );
}
