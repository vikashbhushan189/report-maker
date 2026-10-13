import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ClipboardPaste,
  CheckCircle2,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Info
} from 'lucide-react';
import { REPORT_TOPICS } from '../utils/reportTemplates';

export default function FastReportGenerator({
  selectedTopicId,
  onSelectTopic,
  onFileUpload,
  onPasteData,
  onExportExcel,
  isExporting,
  reportMeta,
  setReportMeta,
  rowCount,
  fileName,
  activeTab,
  setActiveTab
}) {
  const fileInputRef = useRef(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const currentTopic = REPORT_TOPICS.find(t => t.id === selectedTopicId) || REPORT_TOPICS[0];

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    onPasteData(pasteText);
    setShowPasteModal(false);
    setPasteText('');
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-500/20 shadow-md p-5 space-y-4">
      {/* Top Banner: Fast 2-Step Workflow */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Fast Report Generator
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                Staff Quick Mode
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Select your report topic, drop your portal Excel data, and download the exact styled report.
            </p>
          </div>
        </div>

        {/* Big Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#15803d] hover:bg-[#166534] active:bg-[#14532d] rounded-xl shadow-md shadow-emerald-700/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download Exact Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Control Grid: 3 Simple Fields for Staff */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Step 1: Select Topic Dropdown (Span 5 cols) */}
        <div className="md:col-span-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Select Report Topic:
            </span>
            <span className="text-[10px] text-slate-400 font-normal">All formulas auto-applied</span>
          </label>

          <select
            value={selectedTopicId}
            onChange={(e) => onSelectTopic(e.target.value)}
            className="w-full bg-white border-2 border-emerald-500/30 hover:border-emerald-500 focus:border-emerald-600 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden transition shadow-2xs cursor-pointer"
          >
            {REPORT_TOPICS.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.topicName}
              </option>
            ))}
          </select>

          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic">
            {currentTopic.description}
          </p>
        </div>

        {/* Step 2: Provide Raw Data Buttons (Span 4 cols) */}
        <div className="md:col-span-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              Raw Data File:
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">
              {rowCount ? `${rowCount} Panchayats` : 'Ready'}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Upload Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition"
              title="Paste CSV or Tab-separated table directly"
            >
              <ClipboardPaste className="w-4 h-4 text-slate-600" />
              <span>Paste</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 mt-1 truncate">
            Current: <span className="font-semibold text-slate-700">{fileName || 'S01_Member_KYC_Details_Kotwa.xlsx'}</span>
          </div>
        </div>

        {/* Step 3: Date & Block Details (Span 3 cols) */}
        <div className="md:col-span-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
              Date & Block:
            </span>
          </label>

          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <span className="text-[9px] text-slate-400 block truncate">Current Date</span>
              <input
                type="text"
                value={reportMeta.currentDate || '12-10-2026'}
                onChange={(e) => setReportMeta({ ...reportMeta, currentDate: e.target.value, dateLabel: `Date:-${e.target.value}` })}
                className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] font-bold text-slate-800 focus:outline-hidden"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block truncate">Prev Date</span>
              <input
                type="text"
                value={reportMeta.prevDate || '10-10-2026'}
                onChange={(e) => setReportMeta({ ...reportMeta, prevDate: e.target.value })}
                className="w-full bg-white border border-amber-300 rounded px-1.5 py-1 text-[11px] font-bold text-amber-950 focus:outline-hidden bg-amber-50/50"
              />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block truncate">Block</span>
              <input
                type="text"
                value={reportMeta.companyName || 'Block: KOTWA'}
                onChange={(e) => setReportMeta({ ...reportMeta, companyName: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[11px] font-bold text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Pills */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">View Display:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'report' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Generated Report
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'raw' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 Raw Data
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                activeTab === 'split' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔄 Side-by-Side
            </button>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('builder')}
          className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium underline"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Advanced Formula Settings</span>
        </button>
      </div>

      {/* Paste Data Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-emerald-600" />
                Paste Raw Data from Portal or Excel
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Copy table directly from your browser, Excel, or CSV and paste below:
            </p>
            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste raw CSV or Tab-separated data here..."
              className="w-full font-mono text-[11px] p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPaste}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                Generate Report from Paste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
