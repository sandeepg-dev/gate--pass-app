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

    if (!passes || passes.length === 0) {
      el.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200">No requests pending Class Advisor review for ${loggedUser.dept} - Section ${loggedUser.yearSec}.</div>`;
      return;
    }

    el.innerHTML = `
      <table class="w-full text-left text-xs min-w-[700px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Roll & Name</th>
            <th class="p-3">Student Standing</th>
            <th class="p-3">Audit Timeline (IST)</th>
            <th class="p-3">Parent Contact</th>
            <th class="p-3">Reason & Letter</th>
            <th class="p-3">Counselor Check</th>
            <th class="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${passes
            .map(
              p => `
            <tr class="hover:bg-slate-50">
              <td class="p-3 font-mono"><b>${p.rollNo}</b><br><span class="text-slate-600 font-sans">${p.name}</span></td>
              <td class="p-3">
                <div class="font-bold text-red-700">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
                <div class="mt-1">
                  ${formatAccommodationBadge(p.accommodation)}
                </div>
              </td>
              <td class="p-3 font-mono text-[10px] space-y-1 bg-slate-50 p-2 rounded">
                <div><b>1. Applied:</b> ${p.appliedTime || '-'}</div>
                <div class="text-emerald-700"><b>2. Counselor:</b> ${p.parentCallTime || '-'}</div>
              </td>
              <td class="p-3">
                <a href="tel:${p.parentContact}" class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold">
                  📞 ${p.parentContact || 'N/A'}
                </a>
              </td>
              <td class="p-3">
                <div class="font-bold text-slate-800 text-[11px] mb-1">"${escapeHtml(p.reason)}"</div>
                <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">
                  📄 View Full AI Letter
                </button>
              </td>
              <td class="p-3">
                ${
                  p.parentCallVerified
                    ? `
                  <span class="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ I talked to their parents (Counselor: ${p.counselorApproval?.counselorName || 'Verified'})
                  </span>
                `
                    : `
                  <div class="space-y-1 bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 inline-block mb-1">⚠️ Counselor Unverified</span>
                    <label class="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" id="advisorCallFallback_${p._id}" class="w-3.5 h-3.5">
                      <span class="text-[10px] text-slate-700 font-bold">I talked to their parents</span>
                    </label>
                  </div>
                `
                }
              </td>
              <td class="p-3 text-right">
                <button onclick="approveAdvisorPass('${p._id}', ${p.parentCallVerified})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow whitespace-nowrap transition active:scale-95">
                  Approve ➔ HOD
                </button>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-4 text-center text-xs text-rose-500">Failed to load advisor queue.</div>`;
  }
}

async function approveAdvisorPass(passId, wasVerified) {
  let fallback = false;
  if (!wasVerified) {
    fallback = document.getElementById(`advisorCallFallback_${passId}`)?.checked;
    if (!fallback) return alert("You must check 'I talked to their parents' before forwarding to HOD!");
  }

  try {
    const data = await Api.post('/api/approve/advisor', {
      passId,
      advisorName: loggedUser.name,
      parentCalledFallback: fallback
    });
    if (data && (data.success === false || data.error)) {
      alert(data.message || data.error || 'Advisor approval failed.');
      return;
    }
    alert(data.message || 'Advisor approved successfully.');
    refreshAllAuthorityViews();
  } catch (err) {
    alert('Advisor approval request failed.');
  }
}
