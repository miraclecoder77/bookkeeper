import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Badge } from '../components/Badge';
import { Camera, FileUp, Sparkles, Loader2, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import * as dal from '../services/dal';
import { CapturedDocument, Category, Client } from '../types';
import { getDB } from '../services/indexeddb';

export const Capture: React.FC = () => {
  const [documents, setDocuments] = useState<CapturedDocument[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Selection / uploading states
  const [loading, setLoading] = useState(false);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<CapturedDocument | null>(null);
  
  // Correction fields state
  const [vendorName, setVendorName] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState(''); // text input for simple decimal editing
  const [currency, setCurrency] = useState('NGN');
  const [categoryId, setCategoryId] = useState('');
  const [clientId, setClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_money' | 'cash' | 'card' | 'other'>('cash');
  const [extractionMethod, setExtractionMethod] = useState<'on_device' | 'cloud_enhanced'>('cloud_enhanced');

  const loadInitialData = async () => {
    try {
      const db = getDB();
      // Load categories
      const cats = await db.getAll('categories');
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);

      // Load clients
      const clsRes = await dal.clients.list({ archived: false });
      if (clsRes.ok && clsRes.data) setClients(clsRes.data);

      // Load captured documents
      const allDocs = await db.getAll('capturedDocuments');
      // Sort by createdAt descending
      allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDocuments(allDocs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 1. Create CapturedDocument entry
      const createRes = await dal.capture.create({
        imageBlob: file,
        documentTypeHint: 'receipt'
      });

      if (createRes.ok && createRes.data) {
        const doc = createRes.data;
        setProcessingDocId(doc.id);
        
        // 2. Perform OCR Extraction
        const extractRes = await dal.capture.extract(doc.id, { method: extractionMethod });
        if (extractRes.ok && extractRes.data) {
          const finishedDoc = extractRes.data;
          setActiveDoc(finishedDoc);
          
          // Populate review fields
          const fields = finishedDoc.extractedFields;
          setVendorName(fields.vendorName || '');
          setDate(fields.date || new Date().toISOString().split('T')[0]);
          setAmount(fields.amountMinorUnits ? (fields.amountMinorUnits / 100).toString() : '0');
          setCurrency(fields.currency || 'NGN');
        } else {
          alert(extractRes.error || 'Failed to extract document fields.');
        }
      } else {
        alert(createRes.error || 'Failed to capture document.');
      }
    } catch (err: any) {
      alert(err.message || 'Capture failed');
    } finally {
      setLoading(false);
      setProcessingDocId(null);
      loadInitialData();
    }
  };

  const handleConfirmReview = async () => {
    if (!activeDoc) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      alert('Please enter a valid amount');
      return;
    }

    const minorUnits = Math.round(parsedAmount * 100);

    try {
      // 1. Confirm fields in Document capture store
      const confirmedFields = {
        vendorName,
        date,
        amountMinorUnits: minorUnits,
        currency,
      };

      const confRes = await dal.capture.confirm(activeDoc.id, confirmedFields);
      if (!confRes.ok) {
        alert(confRes.error || 'Failed to confirm receipt details.');
        return;
      }

      // 2. Automatically create a transaction in the ledger
      const txPayload = {
        type: 'expense' as const,
        date,
        amountMinorUnits: minorUnits,
        currency,
        categoryId,
        clientId: clientId || null,
        paymentMethod,
        notes: `Extracted from receipt: ${vendorName}`,
        sourceCapturedDocumentId: activeDoc.id
      };

      const txRes = await dal.transactions.create(txPayload);
      if (txRes.ok) {
        alert('Transaction created successfully from receipt!');
        setActiveDoc(null);
        loadInitialData();
      } else {
        alert(txRes.error || 'Failed to create ledger entry.');
      }
    } catch (e: any) {
      alert(e.message || 'An error occurred during verification.');
    }
  };

  const handleDiscard = async (id: string) => {
    const res = await dal.capture.discard(id);
    if (res.ok) {
      if (activeDoc?.id === id) {
        setActiveDoc(null);
      }
      loadInitialData();
    }
  };

  const handleReprocess = async (id: string) => {
    setLoading(true);
    setProcessingDocId(id);
    try {
      const res = await dal.capture.reprocess(id);
      if (res.ok && res.data) {
        setActiveDoc(res.data);
        const fields = res.data.extractedFields;
        setVendorName(fields.vendorName || '');
        setDate(fields.date || new Date().toISOString().split('T')[0]);
        setAmount(fields.amountMinorUnits ? (fields.amountMinorUnits / 100).toString() : '0');
        setCurrency(fields.currency || 'NGN');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setProcessingDocId(null);
      loadInitialData();
    }
  };

  const selectDocForReview = (doc: CapturedDocument) => {
    setActiveDoc(doc);
    const fields = doc.extractedFields;
    setVendorName(fields.vendorName || '');
    setDate(fields.date || new Date().toISOString().split('T')[0]);
    setAmount(fields.amountMinorUnits ? (fields.amountMinorUnits / 100).toString() : '0');
    setCurrency(fields.currency || 'NGN');
  };

  const getStatusBadge = (status: CapturedDocument['extractionStatus']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>;
      case 'discarded':
        return <Badge variant="gray">Discarded</Badge>;
      case 'needs_review':
        return <Badge variant="warning">Needs Review</Badge>;
      case 'processing':
        return <Badge variant="primary" dot>Processing</Badge>;
      default:
        return <Badge variant="gray">Pending</Badge>;
    }
  };

  const getConfidenceColor = (conf?: number) => {
    if (!conf) return 'text-slate-500';
    if (conf >= 0.85) return 'text-green-400 font-semibold';
    if (conf >= 0.6) return 'text-yellow-400 font-semibold';
    return 'text-red-400 font-semibold';
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div>
        <h1 className="text-3xl font-bold text-white font-display flex items-center gap-2">
          <Camera className="w-8 h-8 text-brand-400" />
          Receipt & Document OCR Scanner
        </h1>
        <p className="text-slate-400 text-sm">
          Snap or upload files to automatically parse transaction details using AI OCR
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Uploader & Review form */}
        <div className="lg:col-span-2 space-y-6">
          {activeDoc ? (
            /* Review Panel */
            <Card className="bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                    Review Extracted Document
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Confirm extracted fields to generate transaction record
                  </p>
                </div>
                <button
                  onClick={() => setActiveDoc(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 underline"
                >
                  Cancel Review
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Vendor Name</label>
                    <span className={`text-[10px] ${getConfidenceColor(activeDoc.fieldConfidence?.vendorName)}`}>
                      Conf: {Math.round((activeDoc.fieldConfidence?.vendorName || 0) * 100)}%
                    </span>
                  </div>
                  <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} required />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Receipt Date</label>
                    <span className={`text-[10px] ${getConfidenceColor(activeDoc.fieldConfidence?.date)}`}>
                      Conf: {Math.round((activeDoc.fieldConfidence?.date || 0) * 100)}%
                    </span>
                  </div>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Amount</label>
                    <span className={`text-[10px] ${getConfidenceColor(activeDoc.fieldConfidence?.amountMinorUnits)}`}>
                      Conf: {Math.round((activeDoc.fieldConfidence?.amountMinorUnits || 0) * 100)}%
                    </span>
                  </div>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>

                <Select
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: 'NGN', label: 'NGN (₦)' },
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'EUR', label: 'EUR (€)' },
                  ]}
                />

                <Select
                  label="Ledger Expense Category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: `${cat.name} (${cat.type})`,
                  }))}
                />

                <Select
                  label="Associated Client (Optional)"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  options={[{ value: '', label: 'None' }, ...clients.map((cl) => ({
                    value: cl.id,
                    label: cl.name,
                  }))]}
                />

                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'mobile_money', label: 'Mobile Money' },
                    { value: 'card', label: 'Card' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button
                  onClick={() => handleDiscard(activeDoc.id)}
                  variant="secondary"
                  className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/5"
                >
                  Discard Document
                </Button>
                <Button onClick={handleConfirmReview} className="bg-gradient-brand text-white font-semibold">
                  Confirm & Save Expense
                </Button>
              </div>
            </Card>
          ) : (
            /* Upload Zone */
            <Card className="bg-slate-900 border border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-4 relative border-dashed">
              <div className="p-4 bg-slate-800/60 rounded-full border border-slate-700 text-slate-400">
                {loading ? (
                  <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
                ) : (
                  <FileUp className="w-10 h-10" />
                )}
              </div>
              <div className="max-w-xs">
                <p className="font-semibold text-white">Upload receipt document</p>
                <p className="text-xs text-slate-400 mt-1">
                  Drag and drop your image, or click to browse files (JPEG, PNG, PDF supported)
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">OCR Strategy:</span>
                <button
                  type="button"
                  onClick={() => setExtractionMethod('on_device')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    extractionMethod === 'on_device'
                      ? 'bg-slate-800 text-white border border-slate-750'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Local Regex
                </button>
                <button
                  type="button"
                  onClick={() => setExtractionMethod('cloud_enhanced')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    extractionMethod === 'cloud_enhanced'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Cloud Gemini OCR
                </button>
              </div>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Card>
          )}
        </div>

        {/* History Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Processing History</h2>
          
          {documents.length === 0 ? (
            <Card className="bg-slate-900 border border-slate-850 p-6 text-center text-slate-500 text-sm">
              No documents processed yet.
            </Card>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  onClick={() => doc.extractionStatus === 'needs_review' && selectDocForReview(doc)}
                  className={`bg-slate-900 border p-3 flex flex-col justify-between gap-2 transition-all ${
                    doc.extractionStatus === 'needs_review'
                      ? 'border-yellow-500/20 hover:border-yellow-500/40 cursor-pointer hover:bg-slate-850'
                      : 'border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white text-sm truncate max-w-[140px]">
                        {doc.extractedFields?.vendorName || 'Processing doc...'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString()} at {new Date(doc.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {getStatusBadge(doc.extractionStatus)}
                  </div>

                  {doc.extractedFields?.amountMinorUnits && (
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800/40">
                      <span className="text-slate-400">Parsed Amount:</span>
                      <span className="font-semibold text-slate-300">
                        {doc.extractedFields.currency} {(doc.extractedFields.amountMinorUnits / 100).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {doc.extractionStatus === 'needs_review' && (
                    <div className="bg-yellow-500/5 text-yellow-400 text-[10px] px-2 py-1 rounded border border-yellow-500/10 flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Click to review parsed fields</span>
                    </div>
                  )}

                  {doc.extractionStatus !== 'confirmed' && doc.extractionStatus !== 'discarded' && (
                    <div className="flex justify-end gap-1.5 mt-1 pt-1.5 border-t border-slate-800/40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReprocess(doc.id);
                        }}
                        disabled={loading}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded"
                      >
                        <RefreshCw className="w-3 h-3" /> Reprocess
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscard(doc.id);
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 bg-red-500/5 px-2 py-1 rounded"
                      >
                        Discard
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
