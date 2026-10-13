import React from 'react';
import { FileSpreadsheet, Eye, Sliders, Split, Download, Sparkles, RefreshCw } from 'lucide-react';
import { SAMPLE_DATASETS } from '../utils/sampleData';

export default function Header({
  activeTab,
  setActiveTab,
  hasData,
  onLoadSample,
  onExportExcel,
  isExporting
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Excel Report Studio
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Local Pro
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Transform raw Excel data into executive formula-driven reports
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('raw')}
              disabled={!hasData}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'raw'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Raw Data
            </button>

            <button
              onClick={() => setActiveTab('builder')}
              disabled={!hasData}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'builder'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Report Builder
            </button>

            <button
              onClick={() => setActiveTab('report')}
              disabled={!hasData}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'report'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Generated Report
            </button>

            <button
              onClick={() => setActiveTab('split')}
              disabled={!hasData}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'split'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              Split View
            </button>
          </div>

          {/* Right actions: Sample Data & Export */}
          <div className="flex items-center space-x-2">
            {/* Quick Sample Selector Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Sample</span>
              </button>

              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 hidden group-hover:block hover:block z-40">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Datasets
                </div>
                {Object.entries(SAMPLE_DATASETS).map(([key, sample]) => (
                  <button
                    key={key}
                    onClick={() => onLoadSample(key)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 hover:text-emerald-700 flex flex-col transition"
                  >
                    <span className="font-medium">{sample.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{sample.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Export button */}
            {hasData && (
              <button
                onClick={onExportExcel}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export Excel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
