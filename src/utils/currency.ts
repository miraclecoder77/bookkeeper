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
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
