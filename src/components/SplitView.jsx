import React from 'react';
import RawDataViewer from './RawDataViewer';
import ReportViewer from './ReportViewer';
import { Eye, FileSpreadsheet } from 'lucide-react';

export default function SplitView({
  headers,
  rawData,
  columnStats,
  portalTotals,
  totalRowIndex,
  dataStartRowIndex,
  reportMeta,
  columns,
  reportRows,
  totals,
  onExportExcel,
  onExportCSV,
  isExporting,
  manualValues = {},
  onSaveManualValues,
  onUpdateSingleManualValue,
  selectedTargetBlockId,
  onSelectTargetBlock,
  savedBlockTargets,
  onOpenTargetModal
}) {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="font-bold flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-700" /> Raw Excel Input (Rows 5-20: 16 Panchayats)
          </span>
          <span className="text-slate-400">vs</span>
          <span className="font-bold flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Generated Report (Ranked by Gap)
          </span>
        </div>
        <span className="text-[11px] text-emerald-700">
          Side-by-side comparison of source records and computed output
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side: Raw Data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Raw Input Data ({rawData.length} Panchayats)
            </h3>
          </div>
          <RawDataViewer
            headers={headers}
            data={rawData}
            columnStats={columnStats}
            portalTotals={portalTotals}
            totalRowIndex={totalRowIndex}
            dataStartRow={dataStartRowIndex}
          />
        </div>

        {/* Right Side: Generated Report */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Generated Report View ({reportRows.length} Panchayats)
            </h3>
          </div>
          <ReportViewer
            reportMeta={reportMeta}
            columns={columns}
            rows={reportRows}
            totals={totals}
            onExportExcel={onExportExcel}
            onExportCSV={onExportCSV}
            isExporting={isExporting}
            manualValues={manualValues}
            onSaveManualValues={onSaveManualValues}
            onUpdateSingleManualValue={onUpdateSingleManualValue}
            selectedTargetBlockId={selectedTargetBlockId}
            onSelectTargetBlock={onSelectTargetBlock}
            savedBlockTargets={savedBlockTargets}
            onOpenTargetModal={onOpenTargetModal}
          />
        </div>
      </div>
    </div>
  );
}
