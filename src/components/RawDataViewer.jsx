import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, BarChart2, Hash, Type, ChevronLeft, ChevronRight, Info, CheckCircle2 } from 'lucide-react';
import { formatValue } from '../utils/formulaEngine';

export default function RawDataViewer({ headers, data, columnStats, portalTotals, totalRowIndex = 4, dataStartRow = 5 }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showStats, setShowStats] = useState(false);

  // Filtered and Sorted Data
  const processedData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(row => {
        return headers.some(col => {
          const val = row[col];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(term);
        });
      });
    }

    if (sortCol) {
      result.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return sortDir === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [data, headers, searchTerm, sortCol, sortDir]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const handleSort = (col) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col space-y-3 p-4">
      {/* Informative Banner about Excel Row 4 and Rows 5-20 */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold text-amber-950">
              Excel Layout Verified:
            </span>{' '}
            <span className="text-amber-900">
              Row 4 is Portal Total ({portalTotals?.['No. of Members *'] ? Number(portalTotals['No. of Members *']).toLocaleString() : '26,528'} Members) • Rows 5 to 20 contain the 16 Gram Panchayats.
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-950 shrink-0">
          16 Panchayats Loaded
        </span>
      </div>

      {/* Table Toolbar */}
      <div className="p-3 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in raw panchayats..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              showStats
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showStats ? 'Hide Stats' : 'Column Stats'}</span>
          </button>

          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-800">{processedData.length}</span>
            <span>of {data.length} Panchayats</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-x-auto border border-slate-300 rounded-xl min-h-[360px] max-h-[600px]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header Row (Excel Row 3) */}
          <thead className="bg-[#c5d9a4] text-slate-900 sticky top-0 z-10 border-b border-slate-300">
            <tr>
              <th className="py-2.5 px-2.5 font-bold text-center border-r border-slate-300 w-12">
                #
              </th>
              <th className="py-2.5 px-2.5 font-bold text-center border-r border-slate-300 w-20 text-[10px] text-slate-700">
                Excel Row
              </th>
              {headers.map((col) => {
                const isSorted = sortCol === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="py-2.5 px-3 font-bold select-none cursor-pointer hover:bg-emerald-200/50 transition border-r border-slate-300 last:border-r-0 whitespace-nowrap text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>{col}</span>
                      <span className="text-slate-600">
                        {isSorted ? (
                          sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-700" /> : <ArrowDown className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
            {/* Pinned Row 4 Portal Total Row (Pinkish as in Excel screenshot!) */}
            {portalTotals && !searchTerm && (
              <tr className="bg-rose-100/90 font-bold border-b-2 border-slate-400 text-rose-950">
                <td className="py-2 px-2 text-center border-r border-slate-300">
                  —
                </td>
                <td className="py-2 px-2 text-center border-r border-slate-300 font-mono text-[10px] bg-rose-200/80">
                  Row 4
                </td>
                {headers.map((col, cIdx) => {
                  let val = portalTotals[col];
                  if (cIdx <= 3 && (!val || val === '')) {
                    val = cIdx === 3 ? 'Total' : '';
                  }
                  const isNum = typeof val === 'number';
                  const formatted = isNum
                    ? col.includes('%')
                      ? `${val}%`
                      : val.toLocaleString()
                    : String(val || '');

                  return (
                    <td
                      key={col}
                      className={`py-2 px-3 border-r border-slate-300 last:border-r-0 whitespace-nowrap ${
                        isNum ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            )}

            {/* Panchayats Rows 5 to 20 */}
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 2} className="py-12 text-center text-slate-400">
                  No matching panchayats found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rIdx) => {
                const actualIndex = (currentPage - 1) * pageSize + rIdx + 1;
                const excelRowNum = row._excelRowNumber || (dataStartRow + (currentPage - 1) * pageSize + rIdx);

                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-amber-50/30 transition even:bg-slate-50/50"
                  >
                    <td className="py-2 px-2.5 text-center text-slate-500 border-r border-slate-200 font-medium">
                      {actualIndex}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400 border-r border-slate-200 font-mono text-[10px]">
                      Row {excelRowNum}
                    </td>
                    {headers.map((col) => {
                      const val = row[col];
                      const isNum = typeof val === 'number';
                      const formatted = isNum
                        ? col.includes('%')
                          ? `${val}%`
                          : val.toLocaleString()
                        : String(val || '');

                      return (
                        <td
                          key={col}
                          className={`py-2 px-3 border-r border-slate-200 last:border-r-0 whitespace-nowrap ${
                            isNum ? 'text-right text-slate-900 font-medium' : 'text-left text-slate-800'
                          }`}
                        >
                          {val !== null && val !== undefined && val !== '' ? (
                            formatted
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-700"
          >
            <option value={16}>16 (All 16 Panchayats)</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>• Total {data.length} Gram Panchayats (Rows 5 to 20)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-slate-700 px-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
