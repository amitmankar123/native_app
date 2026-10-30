/**
 * Formats paise (integer) to Indian Rupee (₹) currency string
 * e.g., 1500000 paise -> ₹15,000
 */
export function formatINR(paise = 0, options = { showDecimals: false, showSymbol: true }) {
  const safePaise = typeof paise === 'number' && !isNaN(paise) ? paise : 0;
  const isNegative = safePaise < 0;
  const absRupees = Math.abs(safePaise) / 100;

  let formatted = absRupees.toLocaleString('en-IN', {
    minimumFractionDigits: options.showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const symbol = options.showSymbol !== false ? '₹' : '';
  const sign = isNegative ? '-' : '';

  return `${sign}${symbol}${formatted}`;
}

/**
 * Convert rupee input string or number to integer paise
 */
export function rupeesToPaise(rupees) {
  if (!rupees) return 0;
  const cleaned = String(rupees).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Convert paise to plain rupee string for input editing
 */
export function paiseToRupees(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) return '';
  const val = paise / 100;
  return val % 1 === 0 ? val.toString() : val.toFixed(2);
}

/**
 * Format ISO date string to human-readable date
 */
export function formatDisplayDate(dateString, format = 'DD/MM/YYYY') {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[date.getMonth()];

  if (format === 'readable') {
    return `${day} ${monthName} ${year}`;
  }

  if (format === 'short') {
    return `${day} ${monthName}`;
  }

  if (format === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  return `${day}/${month}/${year}`;
}

/**
 * Calculate human friendly relative time
 */
export function getRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDisplayDate(dateString, 'short');
}

