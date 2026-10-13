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
  Edit3
} from 'lucide-react';
import { formatValue } from '../utils/formulaEngine';
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
  const isEkyc = reportMeta.presetId === 'ekyc_progress' || reportMeta.layoutType === 'ekyc_grid';

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

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // List of Gram Panchayats and current e-KYC map for the modal
  const { panchayatsList, currentEkycMap } = useMemo(() => {
    const list = [];
    const map = {};
    rows.forEach(r => {
      const gp = String(r['Gram Panchayat'] || '').trim();
      if (gp && !list.includes(gp)) {
        list.push(gp);
        const currVal = r['With e-KYC Adhaar 12-10-2026'] || r['With e-KYC Adhaar'] || 0;
        map[gp] = Number(currVal);
      }
    });
    return { panchayatsList: list, currentEkycMap: map };
  }, [rows]);

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
              <span>Fill Previous Day e-KYC ({reportMeta.prevDate || '10-10-2026'})</span>
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

      {/* 2. Official S01 Report Container (Exact image replica) */}
      <div className="bg-white border-2 border-slate-300 shadow-lg rounded-xl overflow-hidden">
        {isEkyc ? (
          <div>
            {/* Top Title: Red Centered */}
            <div className="py-2.5 px-4 text-center border-b border-slate-300 bg-white">
              <h1 className="text-base sm:text-lg font-bold text-[#c00000] tracking-wide">
                {reportMeta.title || 'S01 - Member KYC Details'}
              </h1>
            </div>

            {/* 3-Part Subheader Row as in Image */}
            <div className="grid grid-cols-1 md:grid-cols-12 border-b-2 border-slate-400 bg-white text-xs font-bold text-[#c00000]">
              <div className="md:col-span-3 py-2 px-4 text-center border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center">
                <span>{reportMeta.companyName || 'Block: KOTWA'}</span>
              </div>
              <div className="md:col-span-6 py-2 px-4 text-center border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center">
                <span>{reportMeta.subtitle || 'S01 - Member KYC Details Panchayat: All Panchayats'}</span>
              </div>
              <div className="md:col-span-3 py-2 px-4 text-center flex items-center justify-center">
                <span>{reportMeta.dateLabel || 'Date:-12-10-2026'}</span>
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

                  return (
                    <th
                      key={col.id}
                      className={`py-2 px-2 font-bold text-center border border-slate-400 whitespace-nowrap ${
                        isRedHeader ? 'text-[#c00000]' : 'text-slate-900'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <div className="flex items-center gap-1">
                          <span>{col.header}</span>
                          {isManual && (
                            <button
                              onClick={() => setShowManualModal(true)}
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

                        if (col.cellStyle === 'green_highlight') {
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

            {/* Total Row: Bold Red Text as in Image */}
            {totals && rows.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-white">
                <tr className="font-bold border-t-2 border-slate-400 border-b-2 border-slate-400 text-[#c00000]">
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
              <option value={16}>16 (All Panchayats)</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
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
        prevDateLabel={reportMeta.prevDate || '10-10-2026'}
        currentDateLabel={reportMeta.currentDate || '12-10-2026'}
      />
    </div>
  );
}
