/**
 * Head of Department (HOD) Authorization Module
 */

async function fetchHODQueue() {
  const el = document.getElementById('hodQueue');
  if (!el || !loggedUser) return;

  try {
    const qUrl = `/api/passes?status=Pending HOD&role=hod&dept=${encodeURIComponent(loggedUser.dept)}`;
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
          <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">No requests pending HOD authorization for ${loggedUser.dept} Department.</p>
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
            <th>Reason & Document</th>
            <th>Endorsements Chain</th>
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
                  <div class="text-emerald-800 font-semibold"><span class="text-emerald-600 font-sans">2. Counselor:</span> ${p.counselorApproval?.time || p.parentCallTime || '-'}</div>
                  <div class="text-indigo-800 font-semibold"><span class="text-indigo-600 font-sans">3. Advisor:</span> ${p.advisorApproval?.time || '-'}</div>
                </div>
              </td>
              <td class="max-w-xs">
                <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
                <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
                  📄 View Letter
                </button>
              </td>
              <td>
                <div class="space-y-1.5">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ ${p.parentCalledBy || 'I talked to parents'}
                  </span><br>
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                    ✓ Advisor: ${p.advisorApproval?.advisorName || 'Approved'}
                  </span>
                </div>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button onclick="openRejectModal('${p._id}', 'HOD')" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-semibold rounded-xl shadow-2xs whitespace-nowrap transition active:scale-95 text-xs md:text-sm">
                    ✕ Reject
                  </button>
                  <button onclick="approveHODPass('${p._id}')" class="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow-2xs whitespace-nowrap transition active:scale-95 text-xs md:text-sm flex items-center gap-1.5">
                    <span>Authorize ➔ Principal</span>
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
    el.innerHTML = `<div class="p-8 text-center text-xs md:text-sm text-rose-500 font-semibold">Failed to load HOD queue.</div>`;
  }
}

async function approveHODPass(passId) {
  try {
    const data = await Api.post('/api/approve/hod', {
      passId,
      hodName: loggedUser.name
    });
    if (data && (data.success === false || data.error)) {
      showToast(data.message || data.error || 'HOD authorization failed.', 'error', 3500);
      return;
    }
    showToast(data.message || 'HOD authorized successfully. Forwarded to Principal Directorate.', 'success', 3000);
    refreshAllAuthorityViews();
  } catch (err) {
    showToast('HOD authorization server error.', 'error', 3500);
  }
}
