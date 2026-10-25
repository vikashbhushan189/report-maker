import React, { useState, useMemo } from 'react';
import {
  X,
  Save,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  ClipboardPaste,
  Target,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import {
  DEFAULT_BLOCK_TARGETS,
  getSavedBlockTargets,
  saveBlockTargetPreset,
  resetBlockTargetsToDefault
} from '../utils/targetPresets';

export default function TargetPresetModal({
  isOpen,
  onClose,
  currentBlockId = 'KOTWA',
  onApplyTargets,
  currentPanchayats = []
}) {
  if (!isOpen) return null;

  const [allPresets, setAllPresets] = useState(() => getSavedBlockTargets());
  const [selectedBlockId, setSelectedBlockId] = useState(() => {
    return allPresets[currentBlockId] ? currentBlockId : Object.keys(allPresets)[0] || 'KOTWA';
  });
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active editing state for the selected block
  const currentPreset = allPresets[selectedBlockId] || {
    blockId: selectedBlockId,
    blockName: selectedBlockId,
    displayName: `${selectedBlockId} Block`,
    district: 'PURBI CHAMPARAN',
    totalTarget: 0,
    panchayats: {}
  };

  const [editingBlockName, setEditingBlockName] = useState(currentPreset.blockName || selectedBlockId);
  const [editingDistrict, setEditingDistrict] = useState(currentPreset.district || 'PURBI CHAMPARAN');
  const [panchayatEntries, setPanchayatEntries] = useState(() => {
    const entries = Object.entries(currentPreset.panchayats || {}).map(([gp, val]) => ({
      gp,
      val: val ?? ''
    }));

    // If preset is empty but report has panchayats, pre-populate them
    if (entries.length === 0 && currentPanchayats && currentPanchayats.length > 0) {
      return currentPanchayats.map(gp => ({ gp, val: '' }));
    }
    return entries;
  });

  // Switch block
  const handleSelectBlock = (newBlockId) => {
    if (newBlockId === '__new__') {
      const newId = `BLOCK_${Date.now()}`;
      setSelectedBlockId(newId);
      setEditingBlockName('NEW BLOCK');
      setEditingDistrict('PURBI CHAMPARAN');
      setPanchayatEntries(
        currentPanchayats.length > 0
          ? currentPanchayats.map(gp => ({ gp, val: '' }))
          : [{ gp: '', val: '' }]
      );
      return;
    }

    setSelectedBlockId(newBlockId);
    const p = allPresets[newBlockId];
    if (p) {
      setEditingBlockName(p.blockName || newBlockId);
      setEditingDistrict(p.district || 'PURBI CHAMPARAN');
      setPanchayatEntries(
        Object.entries(p.panchayats || {}).map(([gp, val]) => ({ gp, val: val ?? '' }))
      );
    }
  };

  // Live total sum
  const liveTotal = useMemo(() => {
    return panchayatEntries.reduce((sum, item) => sum + (Number(item.val) || 0), 0);
  }, [panchayatEntries]);

  // Handle row changes
  const handleUpdateGp = (index, field, value) => {
    setPanchayatEntries(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddRow = () => {
    setPanchayatEntries(prev => [...prev, { gp: '', val: '' }]);
  };

  const handleDeleteRow = (index) => {
    setPanchayatEntries(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Excel paste parsing
  const handleParsePaste = () => {
    setPasteError('');
    if (!pasteText.trim()) {
      setPasteError('Please paste some data first.');
      return;
    }

    const lines = pasteText.trim().split(/\r?\n/);
    const parsed = [];

    lines.forEach((line) => {
      // Split by tab (Excel copy) or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      if (parts.length >= 2) {
        const gp = parts[0].trim();
        const rawNum = parts[1].replace(/[$,%]/g, '').trim();
        const num = Number(rawNum);
        if (gp && !isNaN(num)) {
          parsed.push({ gp, val: num });
        }
      } else if (parts.length === 1) {
        // Just number or just text
        const rawNum = parts[0].replace(/[$,%]/g, '').trim();
        const num = Number(rawNum);
        if (!isNaN(num)) {
          parsed.push({ gp: `Panchayat_${parsed.length + 1}`, val: num });
        }
      }
    });

    if (parsed.length === 0) {
      setPasteError('Could not find Panchayat name and numeric target in pasted text.');
      return;
    }

    setPanchayatEntries(parsed);
    setActiveTab('table');
    setPasteText('');
  };

  // Save changes to localStorage
  const handleSave = () => {
    const panchayatObj = {};
    panchayatEntries.forEach(item => {
      const trimmedGp = String(item.gp || '').trim();
      if (trimmedGp) {
        panchayatObj[trimmedGp] = Number(item.val) || 0;
      }
    });

    const blockKey = editingBlockName.trim().toUpperCase() || selectedBlockId;
    const presetData = {
      blockId: blockKey,
      blockName: editingBlockName.trim() || blockKey,
      displayName: `${editingBlockName.trim()} Block (${Object.keys(panchayatObj).length} Panchayats • Target: ${liveTotal.toLocaleString('en-IN')})`,
      district: editingDistrict.trim() || 'PURBI CHAMPARAN',
      totalTarget: liveTotal,
      panchayats: panchayatObj
    };

    const updatedPresets = saveBlockTargetPreset(blockKey, presetData);
    setAllPresets(updatedPresets);
    setSelectedBlockId(blockKey);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    if (onApplyTargets) {
      onApplyTargets(presetData);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm('Reset all saved targets to official factory defaults (Kotwa: 6,963 and Chakia-Pipra: 9,340)?')) {
      const defaults = resetBlockTargetsToDefault();
      setAllPresets(defaults);
      handleSelectBlock(Object.keys(defaults)[0] || 'KOTWA');
    }
  };

  // Apply directly to active report
  const handleApply = () => {
    handleSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Target className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Lakhpati Didi Target Presets Manager
              </h3>
              <p className="text-xs text-emerald-100">
                Select, edit, and save Panchayat targets for Kotwa, Chakia-Pipra, or custom blocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Block Selector Toolbar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Block:
            </span>
            <select
              value={selectedBlockId}
              onChange={(e) => handleSelectBlock(e.target.value)}
              className="bg-white border-2 border-emerald-500/40 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-emerald-600 cursor-pointer"
            >
              {Object.entries(allPresets).map(([bId, p]) => (
                <option key={bId} value={bId}>
                  {p.blockName || bId} (Target: {Number(p.totalTarget || 0).toLocaleString('en-IN')})
                </option>
              ))}
              <option value="__new__">+ Add New Block...</option>
            </select>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded-md transition ${activeTab === 'table' ? 'bg-white text-emerald-950 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition ${activeTab === 'paste' ? 'bg-white text-emerald-950 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Excel Data</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Block Metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Block Name
              </label>
              <input
                type="text"
                value={editingBlockName}
                onChange={(e) => setEditingBlockName(e.target.value)}
                placeholder="e.g. KOTWA or CHAKIA-PIPRA"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                District
              </label>
              <input
                type="text"
                value={editingDistrict}
                onChange={(e) => setEditingDistrict(e.target.value)}
                placeholder="PURBI CHAMPARAN"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Total Target Sum
              </label>
              <div className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-sm font-extrabold text-[#c00000] flex items-center justify-between">
                <span>{liveTotal.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  {panchayatEntries.length} Panchayats
                </span>
              </div>
            </div>
          </div>

          {activeTab === 'table' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Gram Panchayat Targets List:</span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-semibold transition cursor-pointer text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Panchayat</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-[350px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FFFF00] text-[#c00000] font-bold sticky top-0 z-10 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center border-r border-slate-300 text-black">#</th>
                      <th className="py-2 px-4 border-r border-slate-300">Gram Panchayat</th>
                      <th className="py-2 px-4 w-40 text-right border-r border-slate-300">Target</th>
                      <th className="py-2 px-2 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {panchayatEntries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 font-sans italic">
                          No panchayats configured. Click "Add Panchayat" or paste from Excel.
                        </td>
                      </tr>
                    ) : (
                      panchayatEntries.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-1 px-3 text-center text-slate-500 font-sans text-[11px] border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="text"
                              value={row.gp}
                              onChange={(e) => handleUpdateGp(idx, 'gp', e.target.value)}
                              placeholder="e.g. POKHARA"
                              className="w-full px-2 py-1 text-xs font-bold text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded focus:outline-hidden uppercase"
                            />
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <input
                              type="number"
                              value={row.val}
                              onChange={(e) => handleUpdateGp(idx, 'val', e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1 text-xs font-bold text-right text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded focus:outline-hidden"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {panchayatEntries.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs sticky bottom-0">
                      <tr>
                        <td colSpan={2} className="py-2 px-4 text-right text-slate-700">
                          Total Target:
                        </td>
                        <td className="py-2 px-4 text-right text-[#c00000] font-extrabold">
                          {liveTotal.toLocaleString('en-IN')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">How to paste from Excel:</span> Copy 2 columns in Excel (Column A: <code className="bg-amber-100 px-1 rounded">Gram Panchayat</code>, Column B: <code className="bg-amber-100 px-1 rounded">Target</code>) and paste below.
                </div>
              </div>

              {pasteError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}

              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste tab-separated columns from Excel here...&#10;Example:&#10;POKHARA	595&#10;MAHARANI BHOPTA	549&#10;MACHHARGAWA	554"
                rows={10}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-500 bg-slate-50 focus:bg-white"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasteText('')}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Parse & Apply to Table
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Official Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Saved!</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Preset</span>
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Apply to Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
