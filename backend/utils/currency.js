// Central currency formatting utility for backend (Sri Lankan Rupees)
// Converted to ESM exports for consistency with controllers using import syntax.

export const CURRENCY_CODE = 'LKR';
export const CURRENCY_SYMBOL = 'Rs.'; // Local prefix

export function formatCurrency(amount, { decimals = 2, withSymbol = true } = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return withSymbol ? `${CURRENCY_SYMBOL} 0.00` : '0.00';
  }
  const fixed = Number(amount).toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const num = parts.join('.');
  return withSymbol ? `${CURRENCY_SYMBOL} ${num}` : num;
}

export default { CURRENCY_CODE, CURRENCY_SYMBOL, formatCurrency };
