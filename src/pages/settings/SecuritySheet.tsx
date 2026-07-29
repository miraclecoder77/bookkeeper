import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Toggle } from './SettingsRow';
import { AppPreferences } from '../../types';
import { Lock, Fingerprint, Timer, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

const AUTO_LOCK_OPTIONS: { value: number | null; label: string }[] = [
  { value: 0,    label: 'Immediately' },
  { value: 5,    label: '5 minutes'   },
  { value: 15,   label: '15 minutes'  },
  { value: 60,   label: '1 hour'      },
  { value: null, label: 'Never'       },
];

// SHA-256 via WebCrypto
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const PASSCODE_KEY = 'bk_passcode_hash';

interface SecuritySheetProps {
  open: boolean;
  onClose: () => void;
  prefs: AppPreferences;
  onUpdate: (patch: Partial<AppPreferences>) => void;
}

type PinStep = 'idle' | 'set' | 'confirm' | 'done';

export const SecuritySheet: React.FC<SecuritySheetProps> = ({ open, onClose, prefs, onUpdate }) => {
  // PIN setup flow
  const [pinStep, setPinStep] = useState<PinStep>('idle');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  // Biometric
  const biometricAvailable = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  // Reset pin flow when sheet closes
  useEffect(() => {
    if (!open) {
      setPinStep('idle');
      setPin('');
      setPinConfirm('');
      setPinError(null);
    }
  }, [open]);

  const handlePasscodeToggle = async () => {
    if (prefs.passcodeEnabled) {
      // Disable: remove stored hash
      localStorage.removeItem(PASSCODE_KEY);
      onUpdate({ passcodeEnabled: false, biometricEnabled: false });
    } else {
      // Enter setup flow
      setPinStep('set');
      setPin('');
      setPinConfirm('');
      setPinError(null);
    }
  };

  const handlePinNext = async () => {
    if (pin.length !== 4) { setPinError('PIN must be 4 digits.'); return; }
    setPinStep('confirm');
    setPinConfirm('');
    setPinError(null);
  };

  const handlePinConfirm = async () => {
    if (pinConfirm !== pin) {
      setPinError('PINs do not match. Try again.');
      setPinConfirm('');
      return;
    }
    const hash = await sha256(pin);
    localStorage.setItem(PASSCODE_KEY, hash);
    onUpdate({ passcodeEnabled: true });
    setPinStep('done');
    setTimeout(() => setPinStep('idle'), 1500);
  };

  const handleBiometricToggle = async () => {
    if (!biometricAvailable) return;
    if (prefs.biometricEnabled) {
      onUpdate({ biometricEnabled: false });
    } else {
      // Trigger a WebAuthn registration to confirm biometric capability
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'Bookkeeper' },
            user: {
              id: new Uint8Array(16),
              name: 'bookkeeper-user',
              displayName: 'Bookkeeper User',
            },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        });
        onUpdate({ biometricEnabled: true });
      } catch (e) {
        console.warn('Biometric setup cancelled or unsupported:', e);
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Security">
      <div className="space-y-5">

        {/* Passcode Lock */}
        <div className="rounded-2xl border border-default overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-2 border border-default flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-sm text-primary">Passcode Lock</p>
                <p className="text-xs text-secondary">4-digit PIN to access the app</p>
              </div>
            </div>
            <Toggle
              checked={prefs.passcodeEnabled}
              onChange={handlePasscodeToggle}
              label="Toggle passcode lock"
            />
          </div>

          {/* PIN setup inline */}
          {pinStep === 'set' && (
            <div className="border-t border-default px-4 py-4 space-y-3 animate-slide-down">
              <p className="text-sm font-semibold text-primary">Set a 4-digit PIN</p>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(null); }}
                  placeholder="••••"
                  className="field pr-10 tracking-[0.4em] text-center text-xl font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && <p className="text-xs text-expense flex items-center gap-1"><AlertCircle className="w-3 h-3" />{pinError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setPinStep('idle')} className="btn btn-ghost flex-1 rounded-xl text-sm">Cancel</button>
                <button onClick={handlePinNext} disabled={pin.length !== 4} className="btn btn-primary flex-1 rounded-xl text-sm disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {pinStep === 'confirm' && (
            <div className="border-t border-default px-4 py-4 space-y-3 animate-slide-down">
              <p className="text-sm font-semibold text-primary">Confirm your PIN</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinConfirm}
                onChange={e => { setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(null); }}
                placeholder="••••"
                className="field tracking-[0.4em] text-center text-xl font-mono"
                autoFocus
              />
              {pinError && <p className="text-xs text-expense flex items-center gap-1"><AlertCircle className="w-3 h-3" />{pinError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setPinStep('set')} className="btn btn-ghost flex-1 rounded-xl text-sm">Back</button>
                <button onClick={handlePinConfirm} disabled={pinConfirm.length !== 4} className="btn btn-primary flex-1 rounded-xl text-sm disabled:opacity-50">Set PIN</button>
              </div>
            </div>
          )}

          {pinStep === 'done' && (
            <div className="border-t border-default px-4 py-3 animate-slide-down">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />PIN set successfully!
              </p>
            </div>
          )}
        </div>

        {/* Biometric Unlock */}
        <div className="rounded-2xl border border-default">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-2 border border-default flex items-center justify-center shrink-0">
                <Fingerprint className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-sm text-primary">Biometric Unlock</p>
                <p className="text-xs text-secondary">
                  {biometricAvailable
                    ? prefs.passcodeEnabled
                      ? 'Use fingerprint or face to unlock'
                      : 'Enable passcode first'
                    : 'Not available on this device or browser'}
                </p>
              </div>
            </div>
            <Toggle
              checked={prefs.biometricEnabled}
              onChange={handleBiometricToggle}
              disabled={!biometricAvailable || !prefs.passcodeEnabled}
              label="Toggle biometric unlock"
            />
          </div>
          {!biometricAvailable && (
            <div className="border-t border-default px-4 py-2.5">
              <p className="text-[11px] text-secondary">WebAuthn / platform authenticator is not supported in this browser or requires HTTPS.</p>
            </div>
          )}
        </div>

        {/* Auto-lock */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-secondary" />
            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Auto-Lock Timer</p>
          </div>
          <div className="rounded-2xl border border-default overflow-hidden divide-y divide-default">
            {AUTO_LOCK_OPTIONS.map(opt => {
              const active = prefs.autoLockMinutes === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => onUpdate({ autoLockMinutes: opt.value })}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${
                    active ? 'bg-brand/5' : 'hover:bg-surface-2'
                  }`}
                >
                  <span className={`text-sm font-semibold ${active ? 'text-primary' : 'text-secondary'}`}>{opt.label}</span>
                  {active && <CheckCircle2 className="w-4 h-4 text-brand" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl p-3 bg-surface-2 border border-default flex items-start gap-2">
          <KeyRound className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <p className="text-xs text-secondary">
            PIN is hashed with SHA-256 and stored locally. Bookkeeper never transmits your passcode.
          </p>
        </div>

        <button onClick={onClose} className="btn btn-ghost w-full rounded-xl">Done</button>
      </div>
    </Modal>
  );
};
