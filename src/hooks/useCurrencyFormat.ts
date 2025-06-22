
import { useMemo } from 'react';

export const useCurrencyFormat = (currency: string) => {
  const formatPrice = useMemo(() => {
    return (price: number) => {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return formatter.format(price);
    };
  }, [currency]);

  const getCurrencySymbol = useMemo(() => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return symbols[currency] || '$';
  }, [currency]);

  return { formatPrice, getCurrencySymbol };
};
