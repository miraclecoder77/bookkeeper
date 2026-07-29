import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Toggle } from './SettingsRow';
import * as dal from '../../services/dal';
import { SyncMeta, AppPreferences } from '../../types';
import {
  Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle,
  Unlink, Wifi, Clock,
} from 'lucide-react';

interface GoogleDriveSheetProps {
  open: boolean;
  onClose: () => void;
  conflictStrategy: AppPreferences['conflictStrategy'];
  onUpdateConflictStrategy: (s: AppPreferences['conflictStrategy']) => void;
}

function timeAgo(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return 'Never';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hr ago`;
  return d.toLocaleDateString();
}

export const GoogleDriveSheet: React.FC<GoogleDriveSheetProps> = ({
  open, onClose, conflictStrategy, onUpdateConflictStrategy,
}) => {
  const [meta, setMeta] = useState<SyncMeta | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'success' | 'error' | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMeta = async () => {
    const res = await dal.sync.status();
    if (res.ok && res.data) setMeta(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSyncResult(null);
      setShowDisconnectConfirm(false);
      loadMeta();
    }
  }, [open]);

  const isConnected = meta?.syncMode === 'electric_cloud';

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await dal.sync.pushNow();
    setSyncing(false);
    if (res.ok) {
      setSyncResult('success');
      await loadMeta();
      setTimeout(() => setSyncResult(null), 3000);
    } else {
      setSyncResult('error');
    }
  };

  const handleConnect = async () => {
    await dal.sync.upgradeToCloud();
    await loadMeta();
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await dal.sync.downgradeToLocal();
    await loadMeta();
    setDisconnecting(false);
    setShowDisconnectConfirm(false);
  };

  const handleConflictChange = (strategy: AppPreferences['conflictStrategy']) => {
    onUpdateConflictStrategy(strategy);
    dal.sync.resolveConflict(strategy);
  };

  const dataMB = meta?.estimatedDataUsageBytes
    ? (meta.estimatedDataUsageBytes / 1024 / 1024).toFixed(2)
    : '0.00';

  return (
    <Modal open={open} onClose={onClose} title="Google Drive Sync">
      <div className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-border border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Status card */}
            <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
              isConnected
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-surface-2 border-default'
            }`}>
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <CloudOff className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary">
                  {isConnected ? 'Connected to Google Drive' : 'Not connected'}
                </p>
                {isConnected ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last synced: {timeAgo(meta?.lastSyncedAt)}
                    </span>
                    <span className="text-xs text-secondary flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      {dataMB} MB synced
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-secondary mt-1">
                    Your data is stored locally only. Connect to back it up to your Google Drive.
                  </p>
                )}
              </div>
            </div>

            {/* Sync result feedback */}
            {syncResult === 'success' && (
              <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2 animate-slide-down">
                <CheckCircle2 className="w-4 h-4 shrink-0" />Sync complete — everything is up to date.
              </div>
            )}
            {syncResult === 'error' && (
              <div className="rounded-xl p-3 bg-expense/10 border border-expense/20 text-expense text-sm flex items-center gap-2 animate-slide-down">
                <AlertCircle className="w-4 h-4 shrink-0" />Sync failed. Check your connection and try again.
              </div>
            )}

            {/* Primary CTA */}
            {isConnected ? (
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="btn btn-primary w-full rounded-xl disabled:opacity-70"
              >
                {syncing ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Syncing…</>
                ) : (
                  <><RefreshCw className="w-4 h-4" />Sync Now</>
                )}
              </button>
            ) : (
              <button onClick={handleConnect} className="btn btn-primary w-full rounded-xl">
                <Cloud className="w-4 h-4" />Connect Google Drive
              </button>
            )}

            {/* Conflict resolution */}
            {isConnected && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Conflict Resolution
                </p>
                <div className="bg-surface-2 rounded-2xl border border-default p-1 flex gap-1">
                  {(['keep_local', 'keep_cloud'] as const).map(strategy => (
                    <button
                      key={strategy}
                      onClick={() => handleConflictChange(strategy)}
                      className={`flex-1 rounded-xl py-2 px-3 text-sm font-semibold transition-all ${
                        conflictStrategy === strategy
                          ? 'bg-surface shadow-sm text-primary'
                          : 'text-secondary hover:text-primary'
                      }`}
                    >
                      {strategy === 'keep_local' ? '📱 Local Wins' : '☁️ Cloud Wins'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-secondary">
                  {conflictStrategy === 'keep_local'
                    ? 'When conflicts occur, your on-device version will be kept.'
                    : 'When conflicts occur, the cloud version will overwrite local data.'}
                </p>
              </div>
            )}

            {/* Disconnect */}
            {isConnected && (
              <div className="pt-2 border-t border-default">
                {showDisconnectConfirm ? (
                  <div className="rounded-2xl p-4 bg-expense/5 border border-expense/20 space-y-3">
                    <p className="text-sm font-semibold text-primary">Disconnect from Google Drive?</p>
                    <p className="text-xs text-secondary">
                      Your data will remain on this device. No data will be deleted from Google Drive.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDisconnectConfirm(false)}
                        className="btn btn-ghost flex-1 rounded-xl text-sm"
                      >Cancel</button>
                      <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="btn btn-danger flex-1 rounded-xl text-sm"
                      >
                        {disconnecting ? 'Disconnecting…' : 'Yes, Disconnect'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDisconnectConfirm(true)}
                    className="flex items-center gap-2 text-sm text-secondary hover:text-expense transition-colors"
                  >
                    <Unlink className="w-4 h-4" />Disconnect Google Drive
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
