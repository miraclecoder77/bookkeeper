const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  NGN: '₦',
};

export const getCurrencySymbol = (currencyCode?: string) => {
  if (!currencyCode) return '$';
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || '$';
};

export const formatCurrency = (amount: number, currencyCode?: string) => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Use a PDF-safe representation: use the currency code (e.g. "NGN") instead of
// a potentially non-embedded symbol. This avoids missing-glyph issues in jsPDF
// while still showing the user's chosen currency.
export const formatCurrencyForPDF = (amount: number, currencyCode?: string) => {
  const code = currencyCode ? currencyCode.toUpperCase() : 'USD';
  return `${code} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
