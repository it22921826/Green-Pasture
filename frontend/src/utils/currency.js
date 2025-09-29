export const CURRENCY_CODE = 'LKR';
export const CURRENCY_SYMBOL = 'Rs.';

export function formatCurrency(amount, { decimals = 2, symbol = CURRENCY_SYMBOL } = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) return `${symbol}0.00`;
  const fixed = Number(amount).toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${parts.join('.')}`;
}
