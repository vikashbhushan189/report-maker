import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Calculator,
  Palette,
  Sparkles,
  Layers,
  Heading,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Info,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { REPORT_HEADING_PRESETS, REPORT_THEMES } from '../utils/reportTemplates';
import FormulaModal from './FormulaModal';

export default function ReportConfig({
  rawHeaders,
  sampleRow,
  reportMeta,
  setReportMeta,
  columns,
  setColumns
}) {
  const [editingFormulaCol, setEditingFormulaCol] = useState(null);

  // Handle Preset Dropdown Selection
  const handlePresetSelect = (presetId) => {
    const preset = REPORT_HEADING_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setReportMeta(prev => ({
      ...prev,
      presetId: preset.id,
      title: preset.title,
      subtitle: preset.subtitle,
      companyName: preset.companyName,
      dateLabel: preset.dateLabel || '',
      theme: preset.theme,
      layoutType: preset.layoutType || 'standard',
      sortByCol: preset.sortByCol || '',
      sortDir: preset.sortDir || 'asc',
      groupBy: preset.groupBy || ''
    }));

    if (preset.columns && preset.columns.length > 0) {
      setColumns(preset.columns);
    }
  };

  // Add new column
  const handleAddColumn = (type = 'formula') => {
    const newColId = `col_${Date.now()}`;
    const newCol = {
      id: newColId,
      header: type === 'formula' ? 'Calculated Metric' : (rawHeaders[0] || 'Column'),
      type: type,
      sourceCol: rawHeaders[0] || '',
      formula: type === 'formula' ? `[${rawHeaders[0] || 'Column'}] * 1` : '',
      format: type === 'formula' ? 'number' : 'text',
      summaryOp: type === 'formula' ? 'sum' : 'none'
    };
    setColumns(prev => [...prev, newCol]);
  };

  // Auto-map all raw columns
  const handleAutoMapRaw = () => {
    const mapped = rawHeaders.map(col => ({
      id: `col_raw_${col}`,
      header: col,
      type: 'source',
      sourceCol: col,
      formula: '',
      format: 'text',
      summaryOp: 'none'
    }));
    setColumns(mapped);
  };

  // Move column order
  const moveColumn = (index, direction) => {
    const newColumns = [...columns];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newColumns.length) return;

    const [removed] = newColumns.splice(index, 1);
    newColumns.splice(targetIndex, 0, removed);
    setColumns(newColumns);
  };

  // Update specific column property
  const updateColumn = (id, updates) => {
    setColumns(prev =>
      prev.map(col => (col.id === id ? { ...col, ...updates } : col))
    );
  };

  // Remove column
  const removeColumn = (id) => {
    setColumns(prev => prev.filter(col => col.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. Report Heading & Style Customization Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Heading className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Report Heading & Dropdown Template Selection
              </h2>
              <p className="text-xs text-slate-500">
                Choose a pre-configured template (such as the S01 e-KYC report) or customize headings and formulas
              </p>
            </div>
          </div>

          {/* Heading Preset Selection Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Select Preset:
            </span>
            <select
              value={reportMeta.presetId || 'ekyc_progress'}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition shadow-2xs"
            >
              {REPORT_HEADING_PRESETS.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Detailed Metadata Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Main Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Report Main Title
            </label>
            <input
              type="text"
              value={reportMeta.title || ''}
              onChange={(e) => setReportMeta({ ...reportMeta, title: e.target.value })}
              placeholder="e.g. S01 - Member KYC Details"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-bold text-red-700"
            />
          </div>

          {/* Subheader Box 1: Block */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Subheader Box 1 (Block / Company)
            </label>
            <input
              type="text"
              value={reportMeta.companyName || ''}
              onChange={(e) => setReportMeta({ ...reportMeta, companyName: e.target.value })}
              placeholder="e.g. Block: KOTWA"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-medium"
            />
          </div>

          {/* Subheader Box 2: Center Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Subheader Box 2 (Panchayat / Scope)
            </label>
            <input
              type="text"
              value={reportMeta.subtitle || ''}
              onChange={(e) => setReportMeta({ ...reportMeta, subtitle: e.target.value })}
              placeholder="e.g. S01 - Member KYC Details Panchayat: All Panchayats"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-medium"
            />
          </div>

          {/* Subheader Box 3: Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Subheader Box 3 (Date Label)</span>
            </label>
            <input
              type="text"
              value={reportMeta.dateLabel || ''}
              onChange={(e) => setReportMeta({ ...reportMeta, dateLabel: e.target.value })}
              placeholder="e.g. Date:-12-10-2026"
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 font-medium"
            />
          </div>

          {/* Sorting Column & Direction (e.g. e-KYC Gap desc) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Rank / Sort Rows By</span>
            </label>
            <div className="flex gap-2">
              <select
                value={reportMeta.sortByCol || ''}
                onChange={(e) => setReportMeta({ ...reportMeta, sortByCol: e.target.value })}
                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
              >
                <option value="">No custom sort</option>
                {columns.map(c => (
                  <option key={c.id} value={c.header}>
                    {c.header}
                  </option>
                ))}
              </select>
              <select
                value={reportMeta.sortDir || 'desc'}
                onChange={(e) => setReportMeta({ ...reportMeta, sortDir: e.target.value })}
                className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden font-medium"
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Report Theme</span>
            </label>
            <div className="flex items-center gap-1.5">
              {Object.entries(REPORT_THEMES).map(([tKey, themeObj]) => (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setReportMeta({ ...reportMeta, theme: tKey })}
                  title={themeObj.name}
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition ${
                    reportMeta.theme === tKey ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: themeObj.primaryColor }}
                >
                  {reportMeta.theme === tKey && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              ))}
              <span className="text-[11px] text-slate-500 ml-1.5 font-medium truncate">
                {REPORT_THEMES[reportMeta.theme]?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Column Formulation & Output Column Builder */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Report Columns & Formula Calculations ({columns.length} columns)
              </h3>
              <p className="text-xs text-slate-500">
                Configure column headers, mapping, formulas (Gap, Progress, %), and summary totals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoMapRaw}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Map Raw Columns
            </button>
            <button
              type="button"
              onClick={() => handleAddColumn('source')}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Source Column
            </button>
            <button
              type="button"
              onClick={() => handleAddColumn('formula')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Formula Column
            </button>
          </div>
        </div>

        {/* Columns Table / List */}
        <div className="space-y-2.5">
          {columns.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                No output columns configured. Choose a preset above to populate.
              </p>
            </div>
          ) : (
            columns.map((col, index) => (
              <div
                key={col.id}
                className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl transition flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                {/* Column Reorder & Index */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveColumn(index, -1)}
                      disabled={index === 0}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveColumn(index, 1)}
                      disabled={index === columns.length - 1}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-20 p-0.5"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="w-5 text-center font-bold text-slate-400">
                    {index + 1}
                  </span>
                </div>

                {/* Header Name Input */}
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Column Header Name
                  </label>
                  <input
                    type="text"
                    value={col.header}
                    onChange={(e) => updateColumn(col.id, { header: e.target.value })}
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Column Type */}
                <div className="w-28 shrink-0">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Type
                  </label>
                  <select
                    value={col.type}
                    onChange={(e) => updateColumn(col.id, { type: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-700 font-medium focus:outline-hidden"
                  >
                    <option value="source">Raw Source</option>
                    <option value="formula">Formula (fx)</option>
                  </select>
                </div>

                {/* Source Mapping or Formula Display */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    {col.type === 'source' ? 'Map to Raw Column' : 'Mathematical Formula'}
                  </label>
                  {col.type === 'source' ? (
                    <select
                      value={col.sourceCol || ''}
                      onChange={(e) => updateColumn(col.id, { sourceCol: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-hidden"
                    >
                      {rawHeaders.map(rh => (
                        <option key={rh} value={rh}>
                          {rh}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 font-mono text-[11px] bg-white px-2 py-1 border border-slate-300 rounded-md text-emerald-800 truncate" title={col.formula}>
                        {col.formula || '<click to set formula>'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingFormulaCol(col)}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-md flex items-center gap-1 font-medium transition"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>fx</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Number Format */}
                <div className="w-24 shrink-0">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Format
                  </label>
                  <select
                    value={col.format || 'text'}
                    onChange={(e) => updateColumn(col.id, { format: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-hidden"
                  >
                    <option value="number">Number (1,234)</option>
                    <option value="percent">Percent (0.00%)</option>
                    <option value="integer">Integer (12)</option>
                    <option value="currency">Currency ($)</option>
                    <option value="text">Plain Text</option>
                  </select>
                </div>

                {/* Summary Operation (Grand Total) */}
                <div className="w-20 shrink-0">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Total (Σ)
                  </label>
                  <select
                    value={col.summaryOp || 'none'}
                    onChange={(e) => updateColumn(col.id, { summaryOp: e.target.value })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-hidden"
                  >
                    <option value="sum">Sum</option>
                    <option value="avg">Avg</option>
                    <option value="none">None</option>
                    <option value="count">Count</option>
                  </select>
                </div>

                {/* Remove Column */}
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() => removeColumn(col.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                    title="Delete column"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Formula Modal */}
      <FormulaModal
        isOpen={Boolean(editingFormulaCol)}
        onClose={() => setEditingFormulaCol(null)}
        column={editingFormulaCol}
        rawHeaders={rawHeaders}
        sampleRow={sampleRow}
        onSave={(updatedCol) => {
          updateColumn(updatedCol.id, updatedCol);
        }}
      />
    </div>
  );
}
