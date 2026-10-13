import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Calculator, Info, AlertTriangle } from 'lucide-react';
import { evaluateFormula, formatValue } from '../utils/formulaEngine';

export default function FormulaModal({
  isOpen,
  onClose,
  column,
  rawHeaders,
  sampleRow = {},
  onSave
}) {
  const [formula, setFormula] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (column) {
      setFormula(column.formula || '');
    }
  }, [column]);

  // Test formula whenever it changes or sampleRow changes
  useEffect(() => {
    if (!formula.trim()) {
      setTestResult(null);
      setErrorMsg('');
      return;
    }

    try {
      const res = evaluateFormula(formula, sampleRow);
      setTestResult(res);
      setErrorMsg('');
    } catch (e) {
      setErrorMsg(e.message || 'Evaluation error');
      setTestResult(null);
    }
  }, [formula, sampleRow]);

  if (!isOpen || !column) return null;

  const insertToken = (token) => {
    setFormula(prev => prev + token);
  };

  const handleApplyPreset = (presetFormula) => {
    setFormula(presetFormula);
  };

  const handleSave = () => {
    onSave({
      ...column,
      formula
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Formula Builder: <span className="text-emerald-700">{column.header}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Compose custom mathematical calculations or conditional rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Formula Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Formula Expression</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Use square brackets [ColumnName] for column references
              </span>
            </label>
            <textarea
              rows={3}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. [Units] * [UnitPrice] * (1 - [DiscountPct] / 100)"
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Quick Operator Buttons */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Insert Arithmetic & Symbols:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['+', '-', '*', '/', '(', ')', '%', '>=', '<=', '==', 'IF(', ',', 'ROUND(', 'ABS('].map(op => (
                <button
                  key={op}
                  type="button"
                  onClick={() => insertToken(` ${op} `)}
                  className="px-2.5 py-1 font-mono font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 border border-slate-200 rounded-lg text-slate-700 transition"
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Insert Column Tokens */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Insert Data Columns:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
              {rawHeaders.map(col => (
                <button
                  key={col}
                  type="button"
                  onClick={() => insertToken(`[${col}]`)}
                  className="px-2 py-1 font-mono text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-md transition shadow-2xs"
                >
                  [{col}]
                </button>
              ))}
            </div>
          </div>

          {/* Quick Formula Presets */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Popular Formula Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const numCols = rawHeaders.filter(c => !isNaN(Number(sampleRow[c])));
                  const c1 = numCols[0] || rawHeaders[0];
                  const c2 = numCols[1] || rawHeaders[1] || c1;
                  handleApplyPreset(`[${c1}] * [${c2}]`);
                }}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition"
              >
                <div className="font-semibold text-slate-800">Multiplication / Product</div>
                <div className="font-mono text-[10px] text-slate-500">[ColA] * [ColB]</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const numCols = rawHeaders.filter(c => !isNaN(Number(sampleRow[c])));
                  const c1 = numCols[0] || rawHeaders[0];
                  const c2 = numCols[1] || rawHeaders[1] || c1;
                  handleApplyPreset(`[${c1}] - [${c2}]`);
                }}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition"
              >
                <div className="font-semibold text-slate-800">Difference / Variance</div>
                <div className="font-mono text-[10px] text-slate-500">[ColA] - [ColB]</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const numCols = rawHeaders.filter(c => !isNaN(Number(sampleRow[c])));
                  const c1 = numCols[0] || rawHeaders[0];
                  const c2 = numCols[1] || rawHeaders[1] || c1;
                  handleApplyPreset(`(([${c1}] - [${c2}]) / [${c1}]) * 100`);
                }}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition"
              >
                <div className="font-semibold text-slate-800">Profit Margin %</div>
                <div className="font-mono text-[10px] text-slate-500">(([Revenue] - [Cost]) / [Revenue]) * 100</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const numCols = rawHeaders.filter(c => !isNaN(Number(sampleRow[c])));
                  const c1 = numCols[0] || rawHeaders[0];
                  handleApplyPreset(`IF([${c1}] >= 100, "High Performance", "Standard")`);
                }}
                className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition"
              >
                <div className="font-semibold text-slate-800">Conditional Performance Flag</div>
                <div className="font-mono text-[10px] text-slate-500">IF([Col] &gt;= 100, "High", "Low")</div>
              </button>
            </div>
          </div>

          {/* Real-time Test Preview */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Live Row Preview:
              </div>
              <div className="text-[10px] text-emerald-600">
                Calculated on sample record #1
              </div>
            </div>
            <div className="text-right">
              {errorMsg ? (
                <span className="text-red-600 font-medium text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errorMsg}
                </span>
              ) : testResult !== null ? (
                <span className="font-mono text-sm font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-300 shadow-2xs">
                  {formatValue(testResult, column.format || 'text')}
                </span>
              ) : (
                <span className="text-slate-400 italic">Enter formula</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Formula
          </button>
        </div>
      </div>
    </div>
  );
}
