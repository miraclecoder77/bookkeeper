import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { getDB } from '../../services/indexeddb';
import {
  Download, Upload, Trash2, CheckCircle2, AlertCircle,
  FileJson, ShieldAlert,
} from 'lucide-react';

const EXPORT_STORES = [
  'userProfile', 'clients', 'categories', 'transactions',
  'invoices', 'invoiceLineItems', 'attachments', 'syncMeta',
  'capturedDocuments', 'insights', 'aiConsent',
] as const;

interface DataBackupsSheetProps {
  open: boolean;
  onClose: () => void;
}

export const DataBackupsSheet: React.FC<DataBackupsSheetProps> = ({ open, onClose }) => {
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [purgeStep, setPurgeStep] = useState<0 | 1 | 2>(0); // 0=hidden,1=confirm,2=done
  const [purgeInput, setPurgeInput] = useState('');
  const [purging, setPurging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const db = getDB();
      const snapshot: Record<string, any[]> = {};
      for (const store of EXPORT_STORES) {
        try {
          snapshot[store] = await db.getAll(store as any);
        } catch {
          snapshot[store] = [];
        }
      }
      const json = JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, data: snapshot }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookkeeper-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch (e: any) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  // ── Import ───────────────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Basic schema validation
      if (!parsed.data || typeof parsed.data !== 'object' || !parsed.version) {
        throw new Error('Invalid backup file. Expected Bookkeeper JSON export.');
      }

      const db = getDB();
      let restored = 0;
      for (const store of EXPORT_STORES) {
        const records = parsed.data[store];
        if (!Array.isArray(records)) continue;
        const tx = db.transaction(store as any, 'readwrite');
        await tx.store.clear();
        for (const record of records) {
          if (record?.id) await tx.store.put(record);
        }
        await tx.done;
        restored += records.length;
      }

      setImportResult({ ok: true, message: `Restored ${restored} records. Refresh to reload the app.` });
    } catch (err: any) {
      setImportResult({ ok: false, message: err?.message || 'Failed to import backup.' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Purge ────────────────────────────────────────────────────────────────
  const handlePurge = async () => {
    if (purgeInput !== 'RESET') return;
    setPurging(true);
    try {
      const db = getDB();
      for (const store of EXPORT_STORES) {
        try { await db.clear(store as any); } catch {}
      }
      localStorage.clear();
      setPurgeStep(2);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error('Purge failed:', e);
      setPurging(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Data & Backups">
      <div className="space-y-5">

        {/* Export */}
        <div className="rounded-2xl border border-default p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-secondary" />
            <p className="font-bold text-sm text-primary">Export Data</p>
          </div>
          <p className="text-xs text-secondary">
            Download a full JSON backup of all your local data — transactions, invoices, clients, and settings.
          </p>
          {exportDone && (
            <div className="rounded-xl p-2.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs flex items-center gap-1.5 animate-slide-down">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Backup downloaded successfully!
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn btn-ghost w-full rounded-xl text-sm"
          >
            {exporting ? (
              <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />Preparing…</>
            ) : (
              <><Download className="w-4 h-4" />Download Backup (JSON)</>
            )}
          </button>
        </div>

        {/* Import */}
        <div className="rounded-2xl border border-default p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-secondary" />
            <p className="font-bold text-sm text-primary">Import / Restore</p>
          </div>
          <p className="text-xs text-secondary">
            Restore data from a previous Bookkeeper JSON export. Existing data will be overwritten store by store.
          </p>
          {importResult && (
            <div className={`rounded-xl p-2.5 border text-xs flex items-start gap-1.5 animate-slide-down ${
              importResult.ok
                ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-expense/10 border-expense/20 text-expense'
            }`}>
              {importResult.ok
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              {importResult.message}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="btn btn-ghost w-full rounded-xl text-sm"
          >
            {importing ? (
              <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />Validating…</>
            ) : (
              <><Upload className="w-4 h-4" />Select Backup File</>
            )}
          </button>
        </div>

        {/* Purge */}
        <div className="rounded-2xl border border-expense/30 bg-expense/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-expense" />
            <p className="font-bold text-sm text-expense">Purge All Local Data</p>
          </div>
          <p className="text-xs text-secondary">
            Permanently deletes all data from this device. This cannot be undone. Export a backup first if needed.
          </p>

          {purgeStep === 0 && (
            <button
              onClick={() => { setPurgeStep(1); setPurgeInput(''); }}
              className="btn btn-danger w-full rounded-xl text-sm"
            >
              <Trash2 className="w-4 h-4" />Reset & Wipe Device Data
            </button>
          )}

          {purgeStep === 1 && (
            <div className="space-y-3 animate-slide-down">
              <p className="text-xs font-semibold text-primary">
                Type <code className="bg-surface-2 px-1.5 py-0.5 rounded font-mono">RESET</code> to confirm
              </p>
              <input
                type="text"
                value={purgeInput}
                onChange={e => setPurgeInput(e.target.value)}
                placeholder="RESET"
                className="field font-mono"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setPurgeStep(0); setPurgeInput(''); }}
                  className="btn btn-ghost flex-1 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurge}
                  disabled={purgeInput !== 'RESET' || purging}
                  className="btn btn-danger flex-1 rounded-xl text-sm disabled:opacity-50"
                >
                  {purging ? 'Wiping…' : 'Confirm Wipe'}
                </button>
              </div>
            </div>
          )}

          {purgeStep === 2 && (
            <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs flex items-center gap-2 animate-slide-down">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />Data wiped. Reloading…
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
