import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { getDB } from '../../services/indexeddb';
import { ShieldCheck, Smartphone, Cloud, HardDrive, Lock } from 'lucide-react';

const STORE_META: { store: string; label: string; alwaysLocal: boolean }[] = [
  { store: 'transactions',       label: 'Transactions',        alwaysLocal: true  },
  { store: 'invoices',           label: 'Invoices',            alwaysLocal: true  },
  { store: 'clients',            label: 'Clients',             alwaysLocal: true  },
  { store: 'categories',         label: 'Categories',          alwaysLocal: true  },
  { store: 'userProfile',        label: 'User Profile',        alwaysLocal: true  },
  { store: 'attachments',        label: 'Attachments',         alwaysLocal: false },
  { store: 'capturedDocuments',  label: 'Scanned Documents',   alwaysLocal: false },
  { store: 'insights',           label: 'AI Insights',         alwaysLocal: false },
  { store: 'syncMeta',           label: 'Sync Metadata',       alwaysLocal: false },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}

interface StoreStat { store: string; label: string; count: number; sizeBytes: number; alwaysLocal: boolean }

interface PrivacySheetProps {
  open: boolean;
  onClose: () => void;
}

export const PrivacySheet: React.FC<PrivacySheetProps> = ({ open, onClose }) => {
  const [stats, setStats] = useState<StoreStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const compute = async () => {
      const db = getDB();
      const results: StoreStat[] = [];
      for (const { store, label, alwaysLocal } of STORE_META) {
        try {
          const records = await db.getAll(store as any);
          const sizeBytes = new TextEncoder().encode(JSON.stringify(records)).length;
          results.push({ store, label, count: records.length, sizeBytes, alwaysLocal });
        } catch {
          results.push({ store, label, count: 0, sizeBytes: 0, alwaysLocal });
        }
      }
      setStats(results);
      setLoading(false);
    };
    compute();
  }, [open]);

  const totalBytes = stats.reduce((s, r) => s + r.sizeBytes, 0);

  return (
    <Modal open={open} onClose={onClose} title="Privacy Controls">
      <div className="space-y-5">
        {/* Hero */}
        <div className="rounded-2xl p-4 bg-green-500/5 border border-green-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-primary">Private by design</p>
            <p className="text-xs text-secondary mt-0.5">
              Bookkeeper operates on a local-first model. Your financial data never leaves your device without your explicit action.
            </p>
          </div>
        </div>

        {/* Data boundary breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">Data Boundary</p>
          <div className="rounded-2xl border border-default overflow-hidden">
            {/* On-device always */}
            <div className="px-4 py-2.5 bg-surface-2 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-bold text-green-600 dark:text-green-400">Always On-Device Only</span>
            </div>
            {stats.filter(s => s.alwaysLocal).map(s => (
              <div key={s.store} className="flex items-center justify-between px-4 py-2.5 border-t border-default">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-secondary" />
                  <span className="text-sm text-primary">{s.label}</span>
                  <span className="text-xs text-secondary">{s.count} records</span>
                </div>
                <span className="text-xs text-secondary">{formatBytes(s.sizeBytes)}</span>
              </div>
            ))}

            {/* Synced if Drive connected */}
            <div className="px-4 py-2.5 bg-surface-2 flex items-center gap-2 border-t border-default">
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Synced when Drive is connected</span>
            </div>
            {stats.filter(s => !s.alwaysLocal).map(s => (
              <div key={s.store} className="flex items-center justify-between px-4 py-2.5 border-t border-default">
                <div className="flex items-center gap-2">
                  <Cloud className="w-3 h-3 text-secondary" />
                  <span className="text-sm text-primary">{s.label}</span>
                  <span className="text-xs text-secondary">{s.count} records</span>
                </div>
                <span className="text-xs text-secondary">{formatBytes(s.sizeBytes)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Storage summary */}
        {loading ? (
          <div className="h-10 rounded-xl bg-surface-2 animate-pulse" />
        ) : (
          <div className="rounded-2xl border border-default p-4 flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-secondary" />
            <div>
              <p className="font-bold text-sm text-primary">Total Local Storage</p>
              <p className="text-xs text-secondary">{formatBytes(totalBytes)} across all stores</p>
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn btn-ghost w-full rounded-xl">Close</button>
      </div>
    </Modal>
  );
};
