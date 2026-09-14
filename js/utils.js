/**
 * GateMatrix Enterprise UI Utilities & Feedback Engine
 * GRT Institute of Engineering and Technology
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
  const yearStr = academicYear || 'III Year';
  if (!rawSec) return `${yearStr} • ${dept || 'CSE'} - Section A`;
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
  if (!expiresAt) return '<span class="text-slate-400 font-mono text-xs">-</span>';
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  if (diff <= 0) return '<span class="inline-flex items-center gap-1 text-rose-600 font-bold font-mono"><span>⏱️</span> Expired</span>';
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold font-mono text-xs shadow-2xs"><span>⏱️</span> ${m}m ${s < 10 ? '0' : ''}${s}s Gate Window</span>`;
}

/**
 * Formats accommodation status badge (Hosteller vs Day Scholar)
 * @param {string} accommodation
 * @returns {string} HTML badge markup
 */
function formatAccommodationBadge(accommodation) {
  if (
    typeof loggedUser !== 'undefined' &&
    loggedUser &&
    (loggedUser.role === 'boys_warden' || loggedUser.role === 'girls_warden')
  ) {
    return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300"><span>🏢</span> Hosteller</span>';
  }

  const isHostel = /hostel/i.test(accommodation || '');
  if (isHostel) {
    return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300"><span>🏢</span> Hosteller</span>';
  }
  return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-sky-50 text-sky-900 border border-sky-300"><span>🚌</span> Day Scholar</span>';
}

/**
 * Displays a non-blocking modern toast notification
 * @param {string} message 
 * @param {'success' | 'error' | 'info' | 'warning'} type 
 * @param {number} duration 
 */
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;

  const icons = {
    success: `<div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</div>`,
    error: `<div class="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">✕</div>`,
    info: `<div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">ℹ</div>`,
    warning: `<div class="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">⚠</div>`
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="flex-1 text-xs md:text-sm font-semibold text-slate-800 leading-snug">${escapeHtml(message)}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-700 text-sm font-bold ml-1 transition">✕</button>
  `;

  container.appendChild(toast);

  const removeTimer = setTimeout(() => {
    toast.classList.add('toast-leaving');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 250);
  }, duration);

  toast.onclick = () => {
    clearTimeout(removeTimer);
    toast.classList.add('toast-leaving');
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 250);
  };
}

/**
 * Modern Confirmation Modal
 * @param {object} opts
 */
function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = 'rose', onConfirm }) {
  let modal = document.getElementById('universalConfirmModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'universalConfirmModal';
    modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
      <div class="w-12 h-12 rounded-2xl bg-${confirmColor === 'rose' ? 'rose' : 'blue'}-50 text-${confirmColor === 'rose' ? 'rose' : 'blue'}-600 flex items-center justify-center text-xl font-bold">
        ${confirmColor === 'rose' ? '⚠️' : 'ℹ️'}
      </div>
      <div>
        <h3 class="text-base font-bold text-slate-900">${escapeHtml(title)}</h3>
        <p class="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">${escapeHtml(message)}</p>
      </div>
      <div class="flex gap-2.5 pt-2">
        <button id="confirmCancelBtn" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl transition">
          ${escapeHtml(cancelText)}
        </button>
        <button id="confirmActionBtn" class="flex-1 py-2.5 bg-${confirmColor === 'rose' ? 'rose-600 hover:bg-rose-700' : 'indigo-600 hover:bg-indigo-700'} text-white font-semibold text-xs md:text-sm rounded-xl shadow-xs transition active:scale-95">
          ${escapeHtml(confirmText)}
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  const close = () => {
    modal.classList.add('hidden');
  };

  document.getElementById('confirmCancelBtn').onclick = close;
  document.getElementById('confirmActionBtn').onclick = () => {
    close();
    if (typeof onConfirm === 'function') onConfirm();
  };
}

// Global window bindings
window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;
window.formatClassSection = formatClassSection;
window.formatRemainingTime = formatRemainingTime;
window.formatAccommodationBadge = formatAccommodationBadge;
window.showToast = showToast;
window.showConfirmModal = showConfirmModal;
