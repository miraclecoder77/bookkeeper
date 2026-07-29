import React, { useState } from 'react';
import { Modal } from './Modal';
import { HelpCircle, Bug, ExternalLink, CheckCircle2, Paperclip } from 'lucide-react';

const FAQ_ITEMS = [
  { q: 'How do I add a new transaction?', a: 'Go to Activity → tap the + button in the bottom right corner.' },
  { q: 'Can I use Bookkeeper offline?',   a: 'Yes! All core features work offline. Data syncs to Google Drive when you reconnect.' },
  { q: 'How do I export my invoices?',    a: 'Open any invoice → tap ⋯ → "Download PDF". You can also bulk-export from Data & Backups.' },
  { q: 'Is my data encrypted?',          a: 'Data is stored in IndexedDB on your device. Drive backups are JSON files in your personal Drive folder.' },
];

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'] as const;
type Severity = typeof SEVERITY_OPTIONS[number];

const SEVERITY_COLORS: Record<Severity, string> = {
  Low:      'bg-surface-2 text-secondary border-default',
  Medium:   'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  High:     'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Critical: 'bg-expense/10 text-expense border-expense/20',
};

interface HelpFeedbackSheetProps {
  open: boolean;
  onClose: () => void;
}

function buildDiagnostics() {
  return {
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    online: navigator.onLine,
    dbName: 'bookkeeper',
    dbVersion: 2,
    localStorage: Object.keys(localStorage).filter(k => k.startsWith('bk') || k.startsWith('bookkeeper')),
    screen: `${window.screen.width}x${window.screen.height}`,
    colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  };
}

export const HelpFeedbackSheet: React.FC<HelpFeedbackSheetProps> = ({ open, onClose }) => {
  const [tab, setTab] = useState<'faq' | 'bug'>('faq');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('Medium');
  const [attachDiagnostics, setAttachDiagnostics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const payload = {
      subject: subject.trim(),
      description: description.trim(),
      severity,
      diagnostics: attachDiagnostics ? buildDiagnostics() : null,
      submittedAt: new Date().toISOString(),
    };
    // Simulate submission (log to console; in production, POST to your support endpoint)
    console.info('[Bookkeeper Bug Report]', payload);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
    setSubject('');
    setDescription('');
    setSeverity('Medium');
  };

  return (
    <Modal open={open} onClose={onClose} title="Help & Feedback">
      <div className="space-y-5">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-surface-2 rounded-xl border border-default">
          <button
            onClick={() => setTab('faq')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'faq' ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4" />FAQ
            </span>
          </button>
          <button
            onClick={() => { setTab('bug'); setSubmitted(false); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'bug' ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <Bug className="w-4 h-4" />Report a Bug
            </span>
          </button>
        </div>

        {/* FAQ tab */}
        {tab === 'faq' && (
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl border border-default overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-2 transition-colors"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm text-primary">{item.q}</span>
                  <span className={`text-secondary text-lg leading-none transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3 pt-0 text-sm text-secondary animate-slide-down">
                    {item.a}
                  </div>
                )}
              </div>
            ))}

            <a
              href="https://bookkeeper.docs.example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand hover:underline px-1 pt-1"
            >
              <ExternalLink className="w-4 h-4" />Full Documentation
            </a>
          </div>
        )}

        {/* Bug report tab */}
        {tab === 'bug' && (
          submitted ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center animate-scale-in">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-bold text-primary">Thank you for the report!</p>
              <p className="text-sm text-secondary max-w-xs">We'll look into this as soon as possible. Your feedback helps make Bookkeeper better.</p>
              <button onClick={onClose} className="btn btn-ghost rounded-xl mt-2">Close</button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="bug-subject">Subject</label>
                <input
                  id="bug-subject"
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief description of the issue"
                  className="field"
                />
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">Severity</p>
                <div className="flex gap-2">
                  {SEVERITY_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        severity === s ? SEVERITY_COLORS[s] : 'bg-surface-2 text-secondary border-default'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider" htmlFor="bug-desc">Steps to Reproduce</label>
                <textarea
                  id="bug-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="1. Open the invoices page&#10;2. Tap the + button&#10;3. The app crashes"
                  rows={5}
                  className="field resize-none py-2.5"
                />
              </div>

              {/* Attach diagnostics */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={attachDiagnostics}
                  onChange={e => setAttachDiagnostics(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span className="flex items-center gap-1.5 text-sm text-secondary group-hover:text-primary transition-colors">
                  <Paperclip className="w-4 h-4 shrink-0" />
                  Attach system diagnostics (browser, OS, DB version)
                </span>
              </label>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn btn-primary w-full rounded-xl disabled:opacity-50"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
                ) : (
                  <>Send Report</>
                )}
              </button>
            </div>
          )
        )}
      </div>
    </Modal>
  );
};
