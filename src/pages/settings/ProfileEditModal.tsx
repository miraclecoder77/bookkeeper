import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UserProfile } from '../../types';
import { Check, AlertCircle } from 'lucide-react';

interface ProfileEditModalProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (patch: Partial<UserProfile>) => Promise<void>;
}

function validateEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  open,
  onClose,
  profile,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when profile changes or modal opens
  useEffect(() => {
    if (open && profile) {
      setName(profile.displayName || '');
      setEmail(profile.email || '');
      setSaved(false);
      setError(null);
    }
  }, [open, profile]);

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  const nameError = name.trim().length > 0 && name.trim().length < 2 ? 'Name must be at least 2 characters.' : null;
  const emailError = email.trim() && !validateEmail(email.trim()) ? 'Please enter a valid email address.' : null;
  const canSave = name.trim().length >= 2 && !emailError && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ displayName: name.trim(), email: email.trim() || undefined });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 900);
    } catch (e: any) {
      setError(e?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" position="center" size="sm">
      <div className="space-y-5">
        {/* Avatar preview */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center shadow-sm">
            <span className="font-display font-bold text-white text-xl">{initials}</span>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="profile-name">
            Display Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className="field"
            autoComplete="name"
          />
          {nameError && (
            <p className="text-xs text-expense flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />{nameError}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="profile-email">
            Email Address
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="field"
            autoComplete="email"
          />
          {emailError && (
            <p className="text-xs text-expense flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />{emailError}
            </p>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl p-3 bg-expense/10 border border-expense/20 text-expense text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn btn-ghost flex-1 rounded-xl">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn btn-primary flex-1 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : saved ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Saved
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
