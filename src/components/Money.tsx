import React from 'react';

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  GHS: '₵',
  KES: 'KSh',
};

interface MoneyProps {
  amountMinorUnits: number;
  currency: string;
  showBadge?: boolean;
  className?: string;
}

export const CurrencyBadge: React.FC<{ currency: string; className?: string }> = ({ currency, className }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 ${className || ''}`}>
      {currency}
    </span>
  );
};

export const Money: React.FC<MoneyProps> = ({ amountMinorUnits, currency, showBadge = false, className = '' }) => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  const mainAmount = (amountMinorUnits / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`inline-flex items-center gap-1.5 font-display font-semibold ${className}`}>
      <span>{symbol}{mainAmount}</span>
      {showBadge && <CurrencyBadge currency={currency} />}
    </span>
  );
};
