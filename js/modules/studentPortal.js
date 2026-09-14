/**
 * Student Portal Module: Requisition Submission & Personal Status
 */

async function submitStudentPass(rollNo) {
  const reason = document.getElementById('passReason')?.value.trim();
  if (!reason) return showToast('Please state your outpass reason.', 'warning');

  try {
    const data = await Api.post('/api/apply-pass', { rollNo, reason });
    if (data.success) {
      showToast(data.message || 'Leave application submitted successfully!', 'success');
      const passReasonInput = document.getElementById('passReason');
      if (passReasonInput) passReasonInput.value = '';
      loadStudentPersonalStatus();
    } else {
      showToast(data.message || data.error || 'Failed to submit outpass requisition.', 'error');
    }
  } catch (err) {
    showToast('Failed to submit outpass requisition.', 'error');
  }
}

async function loadStudentPersonalStatus() {
  const tbody = document.getElementById('studentPersonalBody');
  if (!tbody || !loggedUser) return;

  try {
    const passes = await Api.get(`/api/passes?rollNo=${encodeURIComponent(loggedUser.userId)}`);

    if (!passes || passes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-12 text-center bg-white space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">📋</div>
            <div class="text-sm font-bold text-slate-800">No Active Leave Applications</div>
            <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">You currently have no active pass requisitions on record.</p>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = passes
      .map(
        p => `
      <tr>
        <td class="font-mono text-xs font-bold text-slate-700">
          ${p.appliedTime || new Date(p.createdAt).toLocaleString('en-IN')}
        </td>
        <td class="max-w-xs">
          <div class="flex items-center gap-1.5 mb-1.5">
            <span class="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded">${p.academicYear || 'I Year'}</span>
            ${formatAccommodationBadge(p.accommodation)}
          </div>
          <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
          <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
            📄 View Letter
          </button>
        </td>
        <td>
          <div class="flex flex-wrap gap-1.5">
            <span class="px-2.5 py-1 rounded-md text-xs font-bold ${p.counselorApproval?.approved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : p.status === 'Rejected' && /counselor/i.test(p.rejectedBy || '') ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-500'}">
              ${p.counselorApproval?.approved ? '✓ Counselor (' + (p.counselorApproval.counselorName || 'Verified') + ')' : p.status === 'Rejected' && /counselor/i.test(p.rejectedBy || '') ? '✕ Counselor (Rejected)' : '⏳ Counselor'}
            </span>
            <span class="px-2.5 py-1 rounded-md text-xs font-bold ${p.advisorApproval?.approved ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : p.status === 'Rejected' && /advisor/i.test(p.rejectedBy || '') ? 'bg-rose-50 text-rose-800 border border-rose-200' : p.status === 'Rejected' ? '⛔ Stopped' : '⏳ Advisor'}">
              ${p.advisorApproval?.approved ? '✓ Advisor (' + (p.advisorApproval.advisorName || 'Approved') + ')' : p.status === 'Rejected' && /advisor/i.test(p.rejectedBy || '') ? '✕ Advisor (Rejected)' : p.status === 'Rejected' ? '⛔ Stopped' : '⏳ Advisor'}
            </span>
            <span class="px-2.5 py-1 rounded-md text-xs font-bold ${p.hodApproval?.approved ? 'bg-purple-50 text-purple-800 border border-purple-200' : p.status === 'Rejected' && /hod/i.test(p.rejectedBy || '') ? 'bg-rose-50 text-rose-800 border border-rose-200' : p.status === 'Rejected' ? '⛔ Stopped' : '⏳ HOD'}">
              ${p.hodApproval?.approved ? '✓ HOD (' + (p.hodApproval.hodName || 'Authorized') + ')' : p.status === 'Rejected' && /hod/i.test(p.rejectedBy || '') ? '✕ HOD (Rejected)' : p.status === 'Rejected' ? '⛔ Stopped' : '⏳ HOD'}
            </span>
            <span class="px-2.5 py-1 rounded-md text-xs font-bold ${p.principalApproval?.approved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : p.status === 'Rejected' && /principal/i.test(p.rejectedBy || '') ? 'bg-rose-50 text-rose-800 border border-rose-200' : p.status === 'Rejected' ? '⛔ Stopped' : '⏳ Principal'}">
              ${p.principalApproval?.approved ? '✓ Principal' : p.status === 'Rejected' && /principal/i.test(p.rejectedBy || '') ? '✕ Principal (Rejected)' : p.status === 'Rejected' ? '⛔ Stopped' : '⏳ Principal'}
            </span>
            ${
              /hostel/i.test(p.accommodation || '') || p.wardenApproval?.approved || /warden/i.test(p.status) || /warden/i.test(p.rejectedBy || '')
                ? `<span class="px-2.5 py-1 rounded-md text-xs font-bold ${
                    p.wardenApproval?.approved
                      ? 'bg-pink-50 text-pink-800 border border-pink-200'
                      : p.status === 'Rejected' && /warden/i.test(p.rejectedBy || '')
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-slate-100 text-slate-500'
                  }">
                    ${p.wardenApproval?.approved ? '✓ Warden' : p.status === 'Rejected' && /warden/i.test(p.rejectedBy || '') ? '✕ Warden (Rejected)' : p.status === 'Rejected' ? '⛔ Stopped' : '⏳ Warden'}
                  </span>`
                : ''
            }
          </div>
        </td>
        <td>
          ${
            p.status === 'Rejected'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    ❌ REJECTED
                  </span>
                  <div class="text-xs text-rose-800 font-medium">"${escapeHtml(p.rejectionReason || 'No reason specified')}"</div>
                  <div class="text-xs text-slate-500">By: ${escapeHtml(p.rejectedBy || 'Authority')}</div>
                 </div>`
              : p.status === 'Returned' || p.exitStatus === 'Returned to College'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
                  🏠 RETURNED
                </span>`
              : p.status === 'Exited' || p.exitStatus === 'Exited Campus'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    🚪 EXITED
                  </span>
                  <div class="text-xs font-mono font-bold text-emerald-800">${escapeHtml(p.exitTime || '')}</div>
                </div>`
              : p.status === 'Approved'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ✅ APPROVED
                  </span>
                  <div class="text-xs font-mono font-bold text-emerald-700">${formatRemainingTime(p.expiresAt)}</div>
                 </div>`
              : p.status === 'Expired'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  ⏰ EXPIRED
                </span>`
              : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  ⏳ ${escapeHtml(p.status.toUpperCase())}
                 </span>`
          }
        </td>
        <td>
          ${
            p.status === 'Rejected'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  🚫 NOT AUTHORIZED
                 </span>`
              : p.status === 'Returned' || p.exitStatus === 'Returned to College'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
                    🏠 RETURNED
                  </span>
                  <div class="text-xs font-mono font-bold text-sky-800">${escapeHtml(p.returnTime || '')}</div>
                </div>`
              : p.status === 'Exited' || p.exitStatus === 'Exited Campus'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    🚪 EXITED
                  </span>
                  <div class="text-xs font-mono font-bold text-emerald-800">${escapeHtml(p.exitTime || '')}</div>
                </div>`
              : p.status === 'Approved'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ✅ LEAVE APPROVED
                 </span>`
              : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  ⏳ PENDING CLEARANCE
                 </span>`
          }
        </td>
        <td class="text-right space-y-1.5">
          <button onclick="downloadSinglePassPDF(${escapeAttr(p)})" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 ml-auto active:scale-95">
            <span>Pass Slip</span>
          </button>
          <button onclick="downloadOfficialLetterOnlyPDF(${escapeAttr(p)})" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 ml-auto active:scale-95">
            <span>Letter PDF</span>
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-xs md:text-sm text-rose-500 font-semibold">Failed to load personal passes.</td></tr>`;
  }
}
