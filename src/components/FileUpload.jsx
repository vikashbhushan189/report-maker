import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Layers, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { SAMPLE_DATASETS } from '../utils/sampleData';

export default function FileUpload({
  fileInfo,
  onFileUpload,
  onSheetChange,
  onLoadSample,
  isLoading
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMsg('');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setErrorMsg('');
      validateAndProcessFile(files[0]);
    }
  };

  const validateAndProcessFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    onFileUpload(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
      {!fileInfo ? (
        <div>
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.005]'
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Drag & Drop your Excel file here
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Supports <span className="font-semibold text-slate-700">.xlsx</span>, <span className="font-semibold text-slate-700">.xls</span>, and <span className="font-semibold text-slate-700">.csv</span> formats. Processed completely in your local browser.
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              Browse Local File
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Sample Dataset Cards */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Or start instantly with sample business data:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(SAMPLE_DATASETS).map(([key, dataset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onLoadSample(key)}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition group flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition">
                      {dataset.name}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {dataset.description}
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                    <span>{dataset.data.length} records</span> • <span>Load Sample →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* File Active State Banner */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  {fileInfo.filename}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Loaded
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>{fileInfo.data.length} Rows</span>
                <span>•</span>
                <span>{fileInfo.headers.length} Columns</span>
                {fileInfo.fileSize && (
                  <>
                    <span>•</span>
                    <span>{(fileInfo.fileSize / 1024).toFixed(1)} KB</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sheet Selector if multiple sheets */}
            {fileInfo.sheetNames && fileInfo.sheetNames.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Sheet:</span>
                <select
                  value={fileInfo.activeSheet}
                  onChange={(e) => onSheetChange(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  {fileInfo.sheetNames.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Replace / Upload Different File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Replace File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
