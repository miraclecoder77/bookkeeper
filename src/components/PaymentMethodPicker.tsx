import React from 'react';
import { Smartphone, Building, Coins, CreditCard, MoreHorizontal } from 'lucide-react';

export type PaymentMethod = 'bank_transfer' | 'mobile_money' | 'cash' | 'card' | 'other';

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  className?: string;
}

const METHODS: { value: PaymentMethod; label: string; icon: any; description: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building, description: 'Direct bank transfer / wire' },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone, description: 'M-Pesa, OPay, MoMo, etc.' },
  { value: 'cash', label: 'Cash', icon: Coins, description: 'Physical cash payment' },
  { value: 'card', label: 'Card Payment', icon: CreditCard, description: 'Debit or credit card transaction' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, description: 'Alternative payment channel' },
];

export const PaymentMethodPicker: React.FC<PaymentMethodPickerProps> = ({ value, onChange, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-5 gap-3 ${className}`}>
      {METHODS.map(m => {
        const Icon = m.icon;
        const isSelected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all ${
              isSelected
                ? 'bg-brand-600/10 border-brand-500 text-brand-400 shadow-md shadow-brand-500/5'
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-brand-400 animate-pulse-slow' : 'text-slate-500'}`} />
            <span className="font-semibold text-xs leading-none">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
