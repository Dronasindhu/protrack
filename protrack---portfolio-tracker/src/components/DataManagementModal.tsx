import React, { useRef, useState } from 'react';
import { Holding } from '../types/portfolio';
import { storageService } from '../services/storageService';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  FileJson, 
  FileSpreadsheet, 
  AlertTriangle 
} from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
  onImportSuccess: (imported: Holding[]) => void;
  onResetToDemo: () => void;
  onClearAll: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  holdings,
  onImportSuccess,
  onResetToDemo,
  onClearAll
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    storageService.exportAsJSON(holdings);
  };

  const handleExportCSV = () => {
    storageService.exportAsCSV(holdings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = storageService.parseImportJSON(text);
        onImportSuccess(parsed);
        setImportError(null);
        onClose();
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Data & Portfolio Management</h2>
            <p className="text-xs text-slate-400">Backup, restore, and manage your portfolio holdings</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {importError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
              {importError}
            </div>
          )}

          {/* Section 1: Backup & Export */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Export Portfolio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportJSON}
                disabled={holdings.length === 0}
                className="flex items-center gap-3 p-3.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors disabled:opacity-40"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Download JSON</div>
                  <div className="text-[11px] text-slate-500">Full backup & reloadable</div>
                </div>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={holdings.length === 0}
                className="flex items-center gap-3 p-3.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors disabled:opacity-40"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Download CSV</div>
                  <div className="text-[11px] text-slate-500">Excel & Sheets ready</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Import Backup */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Import & Restore
            </h3>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Upload JSON Portfolio File
                  </div>
                  <div className="text-[11px] text-slate-500">Restore from previously exported file</div>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
            </button>
          </div>

          {/* Section 3: Reset or Clear */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Danger & Demo Controls
            </h3>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onResetToDemo();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset to Sample Holdings</span>
              </button>

              {showClearConfirm ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAll();
                      setShowClearConfirm(false);
                      onClose();
                    }}
                    className="flex-1 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                  >
                    Yes, Delete All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={holdings.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Holdings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
