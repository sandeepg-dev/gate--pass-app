/**
 * UI Utilities and Data Formatters
 */

/**
 * Escapes HTML characters to prevent XSS in template strings
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely serializes objects into HTML attribute values
 * @param {object} obj
 * @returns {string}
 */
function escapeAttr(obj) {
  return JSON.stringify(obj).replace(/"/g, '&quot;');
}

/**
 * Standardizes display of Department, Section, and Academic Year
 * @param {string} dept
 * @param {string} rawSec
 * @param {string} academicYear
 * @returns {string}
 */
function formatClassSection(dept, rawSec, academicYear) {
  const yearStr = academicYear || 'I Year';
  if (!rawSec) return `${yearStr} • ${dept || 'CSE'} - Sec A`;
  const match = String(rawSec).trim().toUpperCase().match(/\b([A-D])\b/);
  const letter = match ? match[1] : 'A';
  return `${yearStr} • ${dept || 'CSE'} - Sec ${letter}`;
}

/**
 * Calculates remaining validity countdown for approved gate passes
 * @param {string|Date} expiresAt
 * @returns {string}
 */
function formatRemainingTime(expiresAt) {
  if (!expiresAt) return 'Pending Clearance';
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  if (diff <= 0) return 'Expired';
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `⏱️ ${m}m ${s}s left`;
}

/**
 * Formats accommodation status badge (Hosteller vs Day Scholar)
 * @param {string} accommodation
 * @returns {string} HTML badge markup
 */
function formatAccommodationBadge(accommodation) {
  // Never display "Day Scholar" anywhere under a Warden portal/dashboard
  if (
    typeof loggedUser !== 'undefined' &&
    loggedUser &&
    (loggedUser.role === 'boys_warden' || loggedUser.role === 'girls_warden')
  ) {
    return '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">🏢 Hosteller</span>';
  }

  const isHostel = /hostel/i.test(accommodation || '');
  if (isHostel) {
    return '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">🏢 Hosteller</span>';
  }
  return '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">🚌 Day Scholar</span>';
}
