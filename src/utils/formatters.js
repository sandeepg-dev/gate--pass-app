/**
 * Utility string and date formatting helpers
 */

/**
 * Returns a human-readable Indian Standard Time (IST) timestamp.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
function getISTTimeString(date = new Date()) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Normalizes class section input to single uppercase letter (A-D), default 'A'.
 * @param {string|any} val
 * @returns {string}
 */
function extractSection(val) {
  if (!val) return 'A';
  const clean = String(val).trim().toUpperCase();
  const match = clean.match(/(?:SEC|SECTION)?\s*([A-D])\b/) || clean.match(/\b([A-D])\b/);
  return match ? match[1] : 'A';
}

/**
 * Normalizes academic year input to canonical format ('1 Year', '2 Year', '3 Year', '4 Year').
 * @param {string|any} val
 * @returns {string}
 */
function extractYear(val) {
  if (!val) return '3 Year';
  const clean = String(val).trim().toUpperCase();
  if (clean.includes('IV') || clean === '4') return '4 Year';
  if (clean.includes('III') || clean === '3') return '3 Year';
  if (clean.includes('II') || clean === '2') return '2 Year';
  if (clean.includes('I') || clean === '1') return '1 Year';
  return clean;
}

/**
 * Extracts digits from a roll number string into BigInt for comparison.
 * @param {string|number|any} val
 * @returns {bigint}
 */
function extractRollNumber(val) {
  if (!val) return 0n;
  const digits = String(val).replace(/\D/g, '');
  try {
    return digits ? BigInt(digits) : 0n;
  } catch {
    return 0n;
  }
}

module.exports = {
  getISTTimeString,
  extractSection,
  extractYear,
  extractRollNumber
};
