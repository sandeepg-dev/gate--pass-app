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

    if (!passes || passes.length === 0) {
      el.innerHTML = `<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl">No student passes pending verification in range ${loggedUser.startRoll || 'Start'} to ${loggedUser.endRoll || 'End'}.</div>`;
      return;
    }

    el.innerHTML = `
      <table class="w-full text-left text-xs min-w-[700px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Roll & Name</th>
            <th class="p-3">Student Standing</th>
            <th class="p-3">Applied Timestamp</th>
            <th class="p-3">Parent Phone</th>
            <th class="p-3">Reason & Letter</th>
            <th class="p-3">Verification Check</th>
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
              <td class="p-3 font-mono text-[11px] text-indigo-900 font-semibold bg-indigo-50/50">⏱️ ${p.appliedTime || '-'}</td>
              <td class="p-3">
                <a href="tel:${p.parentContact}" class="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold hover:bg-emerald-100">
                  📞 ${p.parentContact || 'N/A'}
                </a>
              </td>
              <td class="p-3">
                <div class="font-bold text-slate-800 text-[11px] mb-1">"${escapeHtml(p.reason)}"</div>
                <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">
                  📄 View Full Letter
                </button>
              </td>
              <td class="p-3">
                <label class="inline-flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <input type="checkbox" id="callCheck_${p._id}" class="w-4 h-4 text-emerald-600 rounded">
                  <span class="text-[11px] font-bold text-slate-700">I talked to their parents</span>
                </label>
              </td>
              <td class="p-3 text-right">
                <button onclick="verifyCounselorPass('${p._id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow whitespace-nowrap transition active:scale-95">
                  Confirm & Forward ➔
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
    el.innerHTML = `<div class="p-4 text-center text-xs text-rose-500">Failed to load counselor queue.</div>`;
  }
}

async function verifyCounselorPass(passId) {
  const isChecked = document.getElementById(`callCheck_${passId}`)?.checked;
  if (!isChecked) {
    return alert("Please check the 'I talked to their parents' box before confirming.");
  }

  try {
    const data = await Api.post('/api/approve/counselor', {
      passId,
      parentCalled: true,
      counselorName: loggedUser.name
    });
    if (data && (data.success === false || data.error)) {
      alert(data.message || data.error || 'Verification failed.');
      return;
    }
    alert(data.message || 'Counselor verified successfully.');
    refreshAllAuthorityViews();
  } catch (err) {
    alert('Verification failed.');
  }
}

async function uploadCounselorExcel(event) {
  if (event) event.preventDefault();
  const fileInput = document.getElementById('counselorFile');
  const file = fileInput?.files[0];
  if (!file) return alert('Please choose an Excel or CSV file first.');

  const fd = new FormData();
  fd.append('file', file);
  fd.append('dept', loggedUser.dept || '');
  fd.append('yearSec', loggedUser.yearSec || '');
  fd.append('counselorName', loggedUser.name || '');

  try {
    const data = await Api.postFormData('/api/upload-students', fd);
    alert(data.message || 'File processed successfully.');
    fileInput.value = '';
  } catch (err) {
    alert('File upload failed.');
  }
}
