import React, { useState, useRef } from 'react';
import {
  X,
  Edit3,
  Upload,
  ClipboardPaste,
  Check,
  RefreshCw,
  Sparkles,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { parseExcelFile, parseRawText } from '../utils/excelReader';

export default function ManualDataModal({
  isOpen,
  onClose,
  panchayats = [],
  currentEkycMap = {},
  manualValues = {},
  onSaveManualValues,
  prevDateLabel = '10-10-2026',
  currentDateLabel = '12-10-2026'
}) {
  const [localValues, setLocalValues] = useState({ ...manualValues });
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'paste' | 'upload'
  const [pasteText, setPasteText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleInputChange = (gp, val) => {
    const num = val === '' ? '' : Number(val);
    setLocalValues(prev => ({
      ...prev,
      [gp]: num
    }));
  };

  // Paste a column of 16 numbers directly
  const handleApplyPasteColumn = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText
      .split(/[\r\n,]+/)
      .map(l => l.trim())
      .filter(Boolean);

    const updated = { ...localValues };
    panchayats.forEach((gp, idx) => {
      if (lines[idx] !== undefined) {
        const num = Number(lines[idx].replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          updated[gp] = num;
        }
      }
    });

    setLocalValues(updated);
    setActiveTab('list');
  };

  // Upload yesterday's raw portal file to extract previous numbers
  const handleYesterdayFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadError('');
      const parsed = await parseExcelFile(file);

      const ekycCol = parsed.headers.find(h =>
        h.toLowerCase().includes('ekyc') || h.toLowerCase().includes('e-kyc')
      );
      const gpCol = parsed.headers.find(h => h.toLowerCase().includes('panchayat'));

      if (!ekycCol || !gpCol) {
        throw new Error('Could not find Gram Panchayat and e-KYC columns in uploaded file.');
      }

      const updated = { ...localValues };
      parsed.data.forEach(row => {
        const gpName = String(row[gpCol] || '').trim();
        const val = Number(row[ekycCol]);
        if (gpName && !isNaN(val)) {
          updated[gpName] = val;
        }
      });

      setLocalValues(updated);
      setActiveTab('list');
    } catch (err) {
      setUploadError(err.message);
    }
  };

  // Reset to sample baseline from image
  const handleResetToBaseline = () => {
    const baseline = {
      'MACHHARGAWA': 1516,
      'KARARIYA': 1534,
      'MAHARANI BHOPTA': 1252,
      'JASAULI': 1402,
      'KOTWA': 884,
      'AHIRAULIYA': 1301,
      'BHAHARWA KALA EAST': 1298,
      'BHOPATPUR NORTH': 904,
      'BHOPATPUR SOUTH': 1001,
      'JAGIRAHA': 679,
      'BATHANA': 1254,
      'GOPI CHHAPRA': 1686,
      'POKHARA': 1324,
      'DUMRA': 721,
      'JASAULI PATTI': 832,
      'BHAHARWA KALA WEST': 1027
    };
    setLocalValues(baseline);
  };

  const handleSave = () => {
    onSaveManualValues(localValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Fill Previous Day e-KYC Data ({prevDateLabel})
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Manual Entry
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Calculates <span className="font-semibold text-slate-700">Yesterday e-KYC Progress</span> ({currentDateLabel} minus {prevDateLabel})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Input Method Tabs */}
        <div className="flex items-center border-b border-slate-200 px-4 bg-slate-50/50 text-xs">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-3 font-semibold border-b-2 transition ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 16 Panchayats List
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2 px-3 font-semibold border-b-2 transition flex items-center gap-1 ${
              activeTab === 'paste'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste Numbers Column</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-3 font-semibold border-b-2 transition flex items-center gap-1 ${
              activeTab === 'upload'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Yesterday's Raw File</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'list' && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 border-b border-slate-100 font-semibold uppercase">
                <span className="w-10 text-center">#</span>
                <span className="flex-1">Gram Panchayat</span>
                <span className="w-24 text-right pr-2">Current ({currentDateLabel})</span>
                <span className="w-32 text-center">Previous ({prevDateLabel})</span>
                <span className="w-20 text-right">Progress</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {panchayats.map((gp, idx) => {
                  const currVal = currentEkycMap[gp] || 0;
                  const prevVal = localValues[gp] !== undefined ? localValues[gp] : currVal;
                  const progress = Number(currVal) - Number(prevVal || 0);

                  let badgeColor = 'bg-yellow-100 text-amber-900';
                  if (progress >= 10) badgeColor = 'bg-emerald-500 text-white font-bold';
                  else if (progress >= 4) badgeColor = 'bg-emerald-100 text-emerald-900 font-semibold';
                  else if (progress < 0) badgeColor = 'bg-rose-500 text-white font-bold';

                  return (
                    <div
                      key={gp}
                      className="py-1.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition"
                    >
                      <span className="w-10 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-semibold text-slate-800 truncate" title={gp}>
                        {gp}
                      </span>
                      <span className="w-24 text-right font-mono text-slate-600 pr-2">
                        {currVal.toLocaleString()}
                      </span>
                      <div className="w-32 flex justify-center">
                        <input
                          type="number"
                          value={prevVal === '' ? '' : prevVal}
                          onChange={(e) => handleInputChange(gp, e.target.value)}
                          placeholder="0"
                          className="w-28 text-right font-mono font-bold bg-amber-50/60 focus:bg-white border border-amber-300 focus:border-emerald-500 rounded px-2 py-1 text-xs focus:outline-hidden"
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono ${badgeColor}`}
                        >
                          {progress > 0 ? `+${progress}` : progress}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                Copy a column of 16 numbers from yesterday's spreadsheet or report and paste below. Each line will map to the corresponding Gram Panchayat in order:
              </div>
              <textarea
                rows={9}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"1516\n1534\n1252\n1402\n884\n1301\n..."}
                className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleApplyPasteColumn}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
              >
                Apply Numbers to 16 Panchayats
              </button>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3 text-xs text-center py-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleYesterdayFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 p-8 rounded-xl cursor-pointer bg-slate-50/60 hover:bg-emerald-50/30 transition"
              >
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="font-bold text-slate-800">
                  Select Yesterday's Raw Portal Excel File ({prevDateLabel})
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  The system will automatically match each Gram Panchayat and extract its previous e-KYC count!
                </div>
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold text-xs"
                >
                  Browse File
                </button>
              </div>

              {uploadError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center justify-center gap-1.5 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResetToBaseline}
            className="text-xs text-slate-500 hover:text-emerald-700 font-medium underline"
          >
            Reset to Image Sample Baseline
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Recalculate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
