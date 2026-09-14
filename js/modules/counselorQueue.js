/**
 * Class Counselor Queue & Verification Module
 */

async function fetchCounselorQueue() {
  const el = document.getElementById('counselorQueue');
  if (!el || !loggedUser) return;

  try {
    const qUrl = `/api/passes?status=Pending Counselor&role=counselor&counselorName=${encodeURIComponent(
      loggedUser.name
    )}&startRoll=${encodeURIComponent(loggedUser.startRoll || '')}&endRoll=${encodeURIComponent(
      loggedUser.endRoll || ''
    )}`;
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
          <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">No student passes currently pending parent call verification in roll range ${loggedUser.startRoll || 'Start'} to ${loggedUser.endRoll || 'End'}.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <table class="enterprise-table min-w-[850px]">
        <thead>
          <tr>
            <th>Student & Roll No</th>
            <th>Class & Accommodation</th>
            <th>Applied Timestamp</th>
            <th>Parent Phone Call</th>
            <th>Reason & Document</th>
            <th>Phone Call Verification</th>
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
                <div class="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  ⏱️ ${p.appliedTime || '-'}
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
                <label class="inline-flex items-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition">
                  <input type="checkbox" id="callCheck_${p._id}" class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500">
                  <span class="text-xs font-bold text-slate-800 select-none">I talked to their parents</span>
                </label>
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <button onclick="openRejectModal('${p._id}', 'Counselor')" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-semibold rounded-xl shadow-2xs whitespace-nowrap transition active:scale-95 text-xs md:text-sm">
                    ✕ Reject
                  </button>
                  <button onclick="verifyCounselorPass('${p._id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-2xs whitespace-nowrap transition active:scale-95 text-xs md:text-sm flex items-center gap-1.5">
                    <span>Approve ➔</span>
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
    el.innerHTML = `<div class="p-8 text-center text-xs md:text-sm text-rose-500 font-semibold">Failed to load counselor queue.</div>`;
  }
}

async function verifyCounselorPass(passId) {
  const isChecked = document.getElementById(`callCheck_${passId}`)?.checked;
  if (!isChecked) {
    return showToast("Please check the 'I talked to their parents' box before confirming.", 'warning', 3500);
  }

  try {
    const data = await Api.post('/api/approve/counselor', {
      passId,
      parentCalled: true,
      counselorName: loggedUser.name
    });
    if (data && (data.success === false || data.error)) {
      showToast(data.message || data.error || 'Verification failed.', 'error', 3500);
      return;
    }
    showToast(data.message || 'Counselor verified successfully. Forwarded to Class Advisor.', 'success', 3000);
    refreshAllAuthorityViews();
  } catch (err) {
    showToast('Verification server error.', 'error', 3500);
  }
}

async function uploadCounselorExcel(event) {
  if (event) event.preventDefault();
  const fileInput = document.getElementById('counselorFile');
  const file = fileInput?.files[0];
  if (!file) return showToast('Please choose an Excel or CSV file first.', 'warning', 3000);

  const fd = new FormData();
  fd.append('file', file);
  fd.append('dept', loggedUser.dept || '');
  fd.append('yearSec', loggedUser.yearSec || '');
  fd.append('counselorName', loggedUser.name || '');

  try {
    const data = await Api.postFormData('/api/upload-students', fd);
    showToast(data.message || 'File processed successfully.', 'success', 3500);
    fileInput.value = '';
  } catch (err) {
    showToast('File upload failed.', 'error', 3500);
  }
}
