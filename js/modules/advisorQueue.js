/**
 * Class Advisor Review & Endorsement Module
 */

async function fetchAdvisorQueue() {
  const el = document.getElementById('advisorQueue');
  if (!el || !loggedUser) return;

  try {
    const qUrl = `/api/passes?status=Pending Advisor&role=advisor&dept=${encodeURIComponent(
      loggedUser.dept
    )}&yearSec=${encodeURIComponent(loggedUser.yearSec)}`;
    const passes = await Api.get(qUrl);

    const countBadge = document.getElementById('authBadge_requests');
    if (countBadge) {
      countBadge.innerText = (passes || []).length;
      countBadge.className = (passes && passes.length > 0)
        ? 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse'
        : 'px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600';
    }
    const kpiPending = document.getElementById('kpi_pending');
    if (kpiPending) kpiPending.innerText = (passes || []).length;

    if (!passes || passes.length === 0) {
      el.innerHTML = `
        <div class="p-12 text-center bg-white space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">🎉</div>
          <div class="text-sm font-bold text-slate-800">No Pending Leave Requests</div>
          <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">No requests pending Class Advisor review for ${loggedUser.dept} - Section ${loggedUser.yearSec}.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <table class="enterprise-table min-w-[850px]">
        <thead>
          <tr>
            <th>Student & Roll No</th>
            <th>Class & Accommodation</th>
            <th>Audit Timeline (IST)</th>
            <th>Parent Contact</th>
            <th>Reason & Document</th>
            <th>Counselor Verification</th>
            <th class="text-right">Decision</th>
          </tr>
        </thead>
        <tbody>
          ${passes
            .map(
              p => `
            <tr>
              <td>
                <div class="font-bold text-slate-900 text-sm">${escapeHtml(p.name)}</div>
                <div class="font-mono text-xs font-bold text-red-700 bg-red-50/80 border border-red-200/60 inline-block px-2 py-0.5 rounded-md mt-0.5">${p.rollNo}</div>
              </td>
              <td>
                <div class="font-semibold text-slate-800 text-xs md:text-sm">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
                <div class="mt-1">
                  ${formatAccommodationBadge(p.accommodation)}
                </div>
              </td>
              <td>
                <div class="font-mono text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div><span class="text-slate-500 font-sans">1. Applied:</span> ${p.appliedTime || '-'}</div>
                  <div class="text-emerald-800 font-semibold"><span class="text-emerald-600 font-sans">2. Counselor:</span> ${p.parentCallTime || '-'}</div>
                </div>
              </td>
              <td>
                <a href="tel:${p.parentContact}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition active:scale-95">
                  📞 ${p.parentContact || 'N/A'}
                </a>
              </td>
              <td class="max-w-xs">
                <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
                <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
                  📄 View Letter
                </button>
              </td>
              <td>
                ${
                  p.parentCallVerified
                    ? `
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ✓ Verified (${p.counselorApproval?.counselorName || 'Counselor'})
                  </span>
                `
                    : `
                  <div class="space-y-1 bg-rose-50 p-2 rounded-xl border border-rose-200">
                    <span class="inline-block px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 mb-1">⚠️ Counselor Unverified</span>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" id="advisorCallFallback_${p._id}" class="w-4 h-4 text-emerald-600 rounded">
                      <span class="text-xs font-bold text-slate-800">I talked to parents</span>
                    </label>
                  </div>
                `
                }
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button onclick="openRejectModal('${p._id}', 'Class Advisor')" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-semibold rounded-xl shadow-2xs whitespace-nowrap transition active:scale-95 text-xs md:text-sm">
                    ✕ Reject
                  </button>
                  <button onclick="approveAdvisorPass('${p._id}', ${p.parentCallVerified})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-2xs whitespace-nowrap transition active:scale-95 text-xs md:text-sm flex items-center gap-1.5">
                    <span>Approve ➔ HOD</span>
                  </button>
                </div>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-8 text-center text-xs md:text-sm text-rose-500 font-semibold">Failed to load advisor queue.</div>`;
  }
}

async function approveAdvisorPass(passId, wasVerified) {
  let fallback = false;
  if (!wasVerified) {
    fallback = document.getElementById(`advisorCallFallback_${passId}`)?.checked;
    if (!fallback) return showToast("You must check 'I talked to their parents' before forwarding to HOD!", 'warning', 3500);
  }

  try {
    const data = await Api.post('/api/approve/advisor', {
      passId,
      advisorName: loggedUser.name,
      parentCalledFallback: fallback
    });
    if (data && (data.success === false || data.error)) {
      showToast(data.message || data.error || 'Advisor approval failed.', 'error', 3500);
      return;
    }
    showToast(data.message || 'Class Advisor approved successfully. Forwarded to HOD.', 'success', 3000);
    refreshAllAuthorityViews();
  } catch (err) {
    showToast('Advisor approval server error.', 'error', 3500);
  }
}
