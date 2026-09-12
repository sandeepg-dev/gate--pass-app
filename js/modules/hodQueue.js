/**
 * Head of Department (HOD) Authorization Module
 */

async function fetchHODQueue() {
  const el = document.getElementById('hodQueue');
  if (!el || !loggedUser) return;

  try {
    const qUrl = `/api/passes?status=Pending HOD&role=hod&dept=${encodeURIComponent(loggedUser.dept)}`;
    const passes = await Api.get(qUrl);

    if (!passes || passes.length === 0) {
      el.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200">No requests pending HOD authorization for ${loggedUser.dept} Department.</div>`;
      return;
    }

    el.innerHTML = `
      <table class="w-full text-left text-xs min-w-[700px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Roll & Name</th>
            <th class="p-3">Student Standing</th>
            <th class="p-3">Audit Timeline (IST)</th>
            <th class="p-3">Reason & Letter</th>
            <th class="p-3">Endorsements</th>
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
                <div class="font-mono font-bold text-red-700">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
                <div class="mt-1">
                  ${formatAccommodationBadge(p.accommodation)}
                </div>
              </td>
              <td class="p-3 font-mono text-[10px] space-y-1 bg-slate-50 p-2 rounded">
                <div><b>1. Applied:</b> ${p.appliedTime || '-'}</div>
                <div class="text-emerald-700"><b>2. Counselor:</b> ${p.counselorApproval?.time || p.parentCallTime || '-'}</div>
                <div class="text-indigo-700"><b>3. Advisor:</b> ${p.advisorApproval?.time || '-'}</div>
              </td>
              <td class="p-3">
                <div class="font-bold text-slate-800 text-[11px] mb-1">"${escapeHtml(p.reason)}"</div>
                <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">
                  📄 View Full AI Letter
                </button>
              </td>
              <td class="p-3">
                <div class="space-y-1">
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">✓ ${p.parentCalledBy || 'I talked to their parents'}</span><br>
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">✓ Advisor: ${p.advisorApproval?.advisorName || 'Approved'}</span>
                </div>
              </td>
              <td class="p-3 text-right">
                <button onclick="approveHODPass('${p._id}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow whitespace-nowrap transition active:scale-95">
                  Authorize ➔ Principal
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
    el.innerHTML = `<div class="p-4 text-center text-xs text-rose-500">Failed to load HOD queue.</div>`;
  }
}

async function approveHODPass(passId) {
  try {
    const data = await Api.post('/api/approve/hod', {
      passId,
      hodName: loggedUser.name
    });
    if (data && (data.success === false || data.error)) {
      alert(data.message || data.error || 'HOD authorization failed.');
      return;
    }
    alert(data.message || 'HOD authorized successfully.');
    refreshAllAuthorityViews();
  } catch (err) {
    alert('HOD authorization request failed.');
  }
}
