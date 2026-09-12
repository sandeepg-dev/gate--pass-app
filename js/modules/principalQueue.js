/**
 * Principal Directorate Final Clearance Module
 */

async function fetchPrincipalQueue() {
  const el = document.getElementById('principalQueue');
  if (!el) return;

  try {
    const passes = await Api.get('/api/passes?status=Pending%20Principal&role=principal');

    if (!passes || passes.length === 0) {
      el.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200">No requests currently pending Principal clearance across any department.</div>`;
      return;
    }

    el.innerHTML = `
      <table class="w-full text-left text-xs min-w-[700px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Roll & Name</th>
            <th class="p-3">Student Standing</th>
            <th class="p-3">Comprehensive Timestamp Chain (IST)</th>
            <th class="p-3">Reason & Letter</th>
            <th class="p-3">Verification Chain</th>
            <th class="p-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${passes
            .map(
              p => `
            <tr class="hover:bg-slate-50 transition">
              <td class="p-3 font-mono">
                <span class="font-bold text-red-600">${p.rollNo}</span><br>
                <span class="text-slate-800 font-sans font-semibold">${p.name}</span>
              </td>
              <td class="p-3 font-mono text-slate-600 font-bold">
                ${formatClassSection(p.dept, p.yearSec, p.academicYear)}
                <div class="mt-1">
                  ${formatAccommodationBadge(p.accommodation)}
                </div>
              </td>
              <td class="p-3 font-mono text-[10px] space-y-0.5 bg-slate-50 p-2 rounded">
                <div><b>1. Applied:</b> ${p.appliedTime || '-'}</div>
                <div class="text-emerald-700"><b>2. Counselor:</b> ${p.counselorApproval?.time || p.parentCallTime || '-'}</div>
                <div class="text-indigo-700"><b>3. Advisor:</b> ${p.advisorApproval?.time || '-'}</div>
                <div class="text-purple-700"><b>4. HOD:</b> ${p.hodApproval?.time || '-'}</div>
              </td>
              <td class="p-3 max-w-xs">
                <div class="font-bold text-slate-800 text-[11px] mb-1">"${escapeHtml(p.reason)}"</div>
                <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">
                  📄 Read Letter
                </button>
              </td>
              <td class="p-3">
                <div class="space-y-1">
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">✓ ${p.parentCalledBy || 'I talked to their parents'}</span><br>
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">✓ Advisor: ${p.advisorApproval?.advisorName || 'Approved'} & HOD: ${p.hodApproval?.hodName || 'Authorized'}</span>
                </div>
              </td>
              <td class="p-3 text-right">
                ${
                  /hostel/i.test(p.accommodation || '')
                    ? `<button onclick="approveGenericPass('${p._id}', '/api/approve/principal')" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 whitespace-nowrap text-xs">
                        Forward to ${p.gender === 'Female' ? 'Girls Hostel Warden' : 'Boys Hostel Warden'} ➔
                      </button>`
                    : `<button onclick="approveGenericPass('${p._id}', '/api/approve/principal')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 whitespace-nowrap text-xs">
                        Final Approval (20-Min Pass) ➔
                      </button>`
                }
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    el.innerHTML = `<div class="p-4 text-center text-xs text-rose-500">Failed to load Principal queue.</div>`;
  }
}

async function approveGenericPass(passId, endpoint) {
  try {
    const data = await Api.post(endpoint, { passId });
    if (data && (data.success === false || data.error)) {
      alert(data.message || data.error || 'Clearance could not be completed.');
      return;
    }
    alert(data.message || 'Pass approved successfully.');
    refreshAllAuthorityViews();
  } catch (err) {
    alert('Server processing error.');
  }
}
