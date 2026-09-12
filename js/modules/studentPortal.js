/**
 * Student Portal Module: Requisition Submission & Personal Status
 */

async function submitStudentPass(rollNo) {
  const reason = document.getElementById('passReason')?.value.trim();
  if (!reason) return alert('Please state your outpass reason.');

  try {
    const data = await Api.post('/api/apply-pass', { rollNo, reason });
    alert(data.message);
    if (data.success) {
      const passReasonInput = document.getElementById('passReason');
      if (passReasonInput) passReasonInput.value = '';
      loadStudentPersonalStatus();
    }
  } catch (err) {
    alert('Failed to submit outpass requisition.');
  }
}

async function loadStudentPersonalStatus() {
  const tbody = document.getElementById('studentPersonalBody');
  if (!tbody || !loggedUser) return;

  try {
    const passes = await Api.get(`/api/passes?rollNo=${encodeURIComponent(loggedUser.userId)}`);

    if (!passes || passes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">You have no active pass requisitions.</td></tr>`;
      return;
    }

    tbody.innerHTML = passes
      .map(
        p => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
        <td class="p-3 font-mono text-slate-600 font-bold">${p.appliedTime || new Date(p.createdAt).toLocaleString('en-IN')}</td>
        <td class="p-3">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded">${p.academicYear || 'I Year'}</span>
            ${formatAccommodationBadge(p.accommodation)}
          </div>
          <div class="font-bold text-slate-800 text-[11px]">"${escapeHtml(p.reason)}"</div>
          <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 mt-1">
            📄 View Letter
          </button>
        </td>
        <td class="p-3">
          <div class="flex flex-wrap gap-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.counselorApproval?.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}">
              ${p.counselorApproval?.approved ? '✓ Counselor (' + (p.counselorApproval.counselorName || 'Verified') + ')' : '⏳ Counselor'}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.advisorApproval?.approved ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'}">
              ${p.advisorApproval?.approved ? '✓ Advisor (' + (p.advisorApproval.advisorName || 'Approved') + ')' : '⏳ Advisor'}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.hodApproval?.approved ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-400'}">
              ${p.hodApproval?.approved ? '✓ HOD (' + (p.hodApproval.hodName || 'Authorized') + ')' : '⏳ HOD'}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.principalApproval?.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}">
              ${p.principalApproval?.approved ? '✓ Principal' : '⏳ Principal'}
            </span>
            ${
              /hostel/i.test(p.accommodation || '') || p.wardenApproval?.approved || /warden/i.test(p.status)
                ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.wardenApproval?.approved
                      ? 'bg-pink-100 text-pink-800 border border-pink-300'
                      : 'bg-slate-100 text-slate-400'
                  }">
                    ${p.wardenApproval?.approved ? '✓ Warden' : '⏳ Warden'}
                  </span>`
                : ''
            }
          </div>
        </td>
        <td class="p-3 font-mono font-bold">
          ${
            p.status === 'Approved'
              ? `<span class="text-emerald-600">${formatRemainingTime(p.expiresAt)}</span>`
              : `<span class="text-slate-400 font-bold">${p.status}</span>`
          }
        </td>
        <td class="p-3">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
            p.status === 'Returned' || p.exitStatus === 'Returned to College'
              ? 'bg-sky-100 text-sky-800 border border-sky-300'
              : p.exitStatus === 'Exited Campus'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }">
            ${
              p.status === 'Returned' || p.exitStatus === 'Returned to College'
                ? '🏠 RETURNED (' + (p.returnTime || 'Logged') + ')'
                : p.exitStatus === 'Exited Campus'
                ? '🚪 EXITED (' + (p.exitTime || 'Recorded') + ')'
                : '🏫 INSIDE CAMPUS'
            }
          </span>
        </td>
        <td class="p-3 text-right space-x-1">
          <button onclick='downloadSinglePassPDF(${JSON.stringify(p)})' class="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-bold hover:bg-red-100 shadow-sm">
            Pass Slip
          </button>
          <button onclick='downloadOfficialLetterOnlyPDF(${JSON.stringify(p)})' class="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-bold hover:bg-indigo-100 shadow-sm">
            Letter PDF
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-rose-500">Failed to load personal passes.</td></tr>`;
  }
}
