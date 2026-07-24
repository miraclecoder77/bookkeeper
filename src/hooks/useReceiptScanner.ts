import { useRef, useState } from 'react';
import * as dal from '../services/dal';
import { CapturedDocument } from '../types';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const useReceiptScanner = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CapturedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scan = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) { setError('Please choose a PDF, JPG, or PNG receipt.'); return; }
    setProcessing(true); setError(null); setResult(null);
    try {
      const created = await dal.capture.create({ imageBlob: file, documentTypeHint: 'receipt' });
      if (!created.ok || !created.data) throw new Error(created.error?.message || 'Could not save receipt.');
      const extracted = await dal.capture.extract(created.data.id, { method: 'cloud_enhanced' });
      if (!extracted.ok || !extracted.data) throw new Error(extracted.error?.message || 'Could not read receipt.');
      setResult(extracted.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Receipt scanning failed.'); }
    finally { setProcessing(false); }
  };
  return { inputRef, processing, result, error, scan, clear: () => { setResult(null); setError(null); } };
};
