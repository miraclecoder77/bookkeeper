import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'center' | 'sheet';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable modal / bottom-sheet with:
 * - Focus trap
 * - Escape key dismiss
 * - Backdrop click dismiss
 * - animate-sheet-up / animate-scale-in entrance
 * - Proper ARIA attributes
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  position = 'sheet',
  size = 'md',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`;

  // Focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [open, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-focus first focusable element on open
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const maxW =
    size === 'sm' ? 'max-w-sm' :
    size === 'lg' ? 'max-w-2xl' :
    'max-w-lg';

  if (position === 'center') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-modal="true"
        role="dialog"
        aria-labelledby={titleId}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
        {/* Panel */}
        <div
          ref={panelRef}
          className={`relative w-full ${maxW} bg-surface border border-default rounded-2xl shadow-elevated animate-scale-in overflow-hidden`}
        >
          <div className="flex items-center justify-between p-5 border-b border-default">
            <h2 id={titleId} className="font-display font-bold text-base text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:bg-surface-2 hover:text-primary transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    );
  }

  // Bottom sheet (default)
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      aria-modal="true"
      role="dialog"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl mx-auto bg-surface border border-default border-b-0 rounded-t-3xl shadow-sheet animate-sheet-up max-h-[92dvh] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-strong" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <h2 id={titleId} className="font-display font-bold text-lg text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary hover:bg-surface-2 hover:text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
};
