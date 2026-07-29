import React, { useState } from 'react';
import { Modal } from './Modal';
import { Toggle } from './SettingsRow';
import { AppPreferences } from '../../types';
import { Bell, Eye } from 'lucide-react';

type ReminderTiming = AppPreferences['reminderSchedule'][number];

const TIMING_OPTIONS: { value: ReminderTiming; label: string; description: string }[] = [
  { value: '3_days_before', label: '3 days before', description: 'Sent 3 days before due date' },
  { value: 'day_of',        label: 'Day of due',    description: 'Sent on the due date'        },
  { value: '7_days_overdue',label: '7 days overdue',description: 'Sent 7 days after due date'  },
];

const TOKEN_PILLS = ['{{client_name}}', '{{invoice_number}}', '{{due_date}}', '{{amount}}', '{{business_name}}'];

interface PaymentRemindersSheetProps {
  open: boolean;
  onClose: () => void;
  prefs: AppPreferences;
  onUpdate: (patch: Partial<AppPreferences>) => void;
}

function renderPreview(template: string, businessName: string) {
  return template
    .replace(/{{client_name}}/g, 'Alex Johnson')
    .replace(/{{invoice_number}}/g, 'INV-2026-0042')
    .replace(/{{due_date}}/g, 'Aug 15, 2026')
    .replace(/{{amount}}/g, '$3,250.00')
    .replace(/{{business_name}}/g, businessName || 'Your Business');
}

export const PaymentRemindersSheet: React.FC<PaymentRemindersSheetProps> = ({
  open, onClose, prefs, onUpdate,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const toggleTiming = (val: ReminderTiming) => {
    const current = prefs.reminderSchedule;
    const next = current.includes(val)
      ? current.filter(v => v !== val)
      : [...current, val];
    onUpdate({ reminderSchedule: next });
  };

  const insertToken = (token: string) => {
    onUpdate({ emailTemplate: prefs.emailTemplate + token });
  };

  return (
    <Modal open={open} onClose={onClose} title="Payment Reminders">
      <div className="space-y-5">
        {/* Master toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-default">
          <div className="flex items-center gap-3">
            <Bell className={`w-5 h-5 ${prefs.remindersEnabled ? 'text-brand' : 'text-secondary'}`} />
            <div>
              <p className="font-bold text-sm text-primary">Automated Reminders</p>
              <p className="text-xs text-secondary">Nudge clients before invoices are due</p>
            </div>
          </div>
          <Toggle
            checked={prefs.remindersEnabled}
            onChange={() => onUpdate({ remindersEnabled: !prefs.remindersEnabled })}
            label="Toggle automated reminders"
          />
        </div>

        {/* Timing schedule */}
        <div className={`space-y-2 transition-opacity ${prefs.remindersEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <p className="text-xs font-bold text-secondary uppercase tracking-wider">When to Send</p>
          <div className="space-y-2">
            {TIMING_OPTIONS.map(opt => {
              const active = prefs.reminderSchedule.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleTiming(opt.value)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    active
                      ? 'bg-brand/5 border-brand/30'
                      : 'bg-surface-2 border-default hover:border-border-strong'
                  }`}
                  aria-pressed={active}
                >
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-primary' : 'text-secondary'}`}>{opt.label}</p>
                    <p className="text-xs text-secondary">{opt.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    active ? 'border-brand bg-brand' : 'border-border-strong'
                  }`}>
                    {active && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email template */}
        <div className={`space-y-2 transition-opacity ${prefs.remindersEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Email Template</p>
            <button
              onClick={() => setShowPreview(p => !p)}
              className="flex items-center gap-1 text-xs text-brand hover:underline"
            >
              <Eye className="w-3 h-3" />{showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {/* Token pills */}
          <div className="flex flex-wrap gap-1.5">
            {TOKEN_PILLS.map(token => (
              <button
                key={token}
                onClick={() => insertToken(token)}
                className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-mono hover:bg-indigo-500/20 transition-colors"
              >
                {token}
              </button>
            ))}
          </div>

          {showPreview ? (
            <div className="bg-surface-2 rounded-xl border border-default p-3 text-sm text-primary whitespace-pre-wrap font-sans leading-relaxed">
              {renderPreview(prefs.emailTemplate, '')}
            </div>
          ) : (
            <textarea
              value={prefs.emailTemplate}
              onChange={e => onUpdate({ emailTemplate: e.target.value })}
              rows={8}
              className="field resize-none py-2.5 font-sans text-sm leading-relaxed"
              placeholder="Write your reminder email template…"
            />
          )}
          <p className="text-[11px] text-secondary">
            Tokens in <span className="font-mono">{'{{braces}}'}</span> will be replaced with real values when the reminder is sent.
          </p>
        </div>

        <button onClick={onClose} className="btn btn-ghost w-full rounded-xl">Done</button>
      </div>
    </Modal>
  );
};
