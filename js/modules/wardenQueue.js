/**
 * Hostel Wardens Approval Queue & Timing Window Module
 */

function loadWardenPortalData(wardenRole) {
  if (typeof allStudents === 'undefined') return;
  const targetGender = wardenRole === 'boys_warden' ? 'Male' : 'Female';
  const hostelerStudents = allStudents.filter(
    student => student.gender === targetGender && student.isHosteler === true
  );
  if (typeof renderStudentTable === 'function') {
    renderStudentTable(hostelerStudents);
  }
}

function generateWardenGatePass() {
  const startTime = document.getElementById('passStartTime')?.value;
  const endTime = document.getElementById('passEndTime')?.value;

  if (!startTime || !endTime) {
    alert('Please select both start and end date/time ranges before issuing a pass.');
    return;
  }

  if (typeof selectedStudentId === 'undefined' || !selectedStudentId) {
    alert("Please select a student from the warden's list first.");
    return;
  }

  alert(
    `Gate pass successfully generated for Student ID: ${selectedStudentId}\nFrom: ${startTime}\nTo: ${endTime}`
  );

  const startTimeInput = document.getElementById('passStartTime');
  const endTimeInput = document.getElementById('passEndTime');
  if (startTimeInput) startTimeInput.value = '';
  if (endTimeInput) endTimeInput.value = '';
}

async function fetchBoysWardenQueue() {
  const el = document.getElementById('boysWardenQueue');
  if (!el) return;

  try {
    let passes = await Api.get('/api/passes?status=Pending%20Boys%20Warden&role=boys_warden');
    passes = (passes || []).filter(
      p => /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '') && !/^female$/i.test(String(p.gender || '').trim())
    );
    if (!passes || passes.length === 0) {
      el.innerHTML =
        '<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200">No student outpass requisitions currently pending Boys Warden clearance.</div>';
      return;
    }

    let html = `
      <table class="w-full text-left text-xs min-w-[850px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Student & Roll No</th>
            <th class="p-3">Standing & Contact</th>
            <th class="p-3">Clearance Chain (IST)</th>
            <th class="p-3">Reason & Letter</th>
            <th class="p-3 text-right">Final Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
    `;

    passes.forEach(p => {
      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 font-mono">
            <span class="font-bold text-red-600">${p.rollNo}</span><br>
            <span class="text-slate-800 font-sans font-semibold">${p.name}</span>
            <div class="text-[10px] text-indigo-700 font-bold">Male</div>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-700">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
            <div class="mt-1">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">🏢 Hosteller</span>
            </div>
            <a href="tel:${p.parentContact}" class="text-[11px] text-emerald-700 font-semibold hover:underline">
              📞 Parent: ${p.parentContact || 'N/A'}
            </a>
          </td>
          <td class="p-3 font-mono text-[10px] space-y-0.5 bg-slate-50 p-2 rounded">
            <div><b>1. Applied:</b> ${p.appliedTime || '-'}</div>
            <div class="text-emerald-700"><b>2. Counselor:</b> ${p.counselorApproval?.time || p.parentCallTime || '-'}</div>
            <div class="text-indigo-700"><b>3. Advisor:</b> ${p.advisorApproval?.time || '-'}</div>
            <div class="text-purple-700"><b>4. HOD:</b> ${p.hodApproval?.time || '-'}</div>
            <div class="text-red-700"><b>5. Principal:</b> ${p.principalApproval?.time || '-'}</div>
          </td>
          <td class="p-3 max-w-xs">
            <div class="font-bold text-slate-800 text-[11px] mb-1">"${escapeHtml(p.reason)}"</div>
            <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">
              📄 Read Letter
            </button>
          </td>
          <td class="p-3 text-right">
            <button onclick="approveBoysWardenPass('${p._id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 whitespace-nowrap text-xs">
              Grant 20-Min Pass ➔
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = '<div class="p-4 text-center text-xs text-rose-500">Failed to load boys warden queue.</div>';
  }
}

async function approveBoysWardenPass(passId) {
  try {
    const data = await Api.post('/api/approve/boys-warden', { passId });
    if (data && (data.success === false || data.error)) {
      alert(data.message || data.error || 'Boys warden approval failed.');
      return;
    }
    alert(data.message || 'Boys Warden approval granted.');
    refreshAllAuthorityViews();
  } catch (err) {
    alert('Boys warden approval failed.');
  }
}

async function fetchGirlsWardenQueue() {
  const el = document.getElementById('girlsWardenQueue');
  if (!el) return;

  try {
    let passes = await Api.get('/api/passes?status=Pending%20Girls%20Warden&role=girls_warden');
    passes = (passes || []).filter(
      p => /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '') && /^female$/i.test(String(p.gender || '').trim())
    );
    if (!passes || passes.length === 0) {
      el.innerHTML =
        '<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200">No student outpass requisitions currently pending Girls Warden clearance.</div>';
      return;
    }

    let html = `
      <table class="w-full text-left text-xs min-w-[850px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Student & Roll No</th>
            <th class="p-3">Standing & Contact</th>
            <th class="p-3">Clearance Chain (IST)</th>
            <th class="p-3">Reason & Letter</th>
            <th class="p-3 text-right">Final Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
    `;

    passes.forEach(p => {
      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 font-mono">
            <span class="font-bold text-red-600">${p.rollNo}</span><br>
            <span class="text-slate-800 font-sans font-semibold">${p.name}</span>
            <div class="text-[10px] text-pink-700 font-bold">Female</div>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-700">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
            <div class="mt-1">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">🏢 Hosteller</span>
            </div>
            <a href="tel:${p.parentContact}" class="text-[11px] text-emerald-700 font-semibold hover:underline">
              📞 Parent: ${p.parentContact || 'N/A'}
            </a>
          </td>
          <td class="p-3 font-mono text-[10px] space-y-0.5 bg-slate-50 p-2 rounded">
            <div><b>1. Applied:</b> ${p.appliedTime || '-'}</div>
            <div class="text-emerald-700"><b>2. Counselor:</b> ${p.counselorApproval?.time || p.parentCallTime || '-'}</div>
            <div class="text-indigo-700"><b>3. Advisor:</b> ${p.advisorApproval?.time || '-'}</div>
            <div class="text-purple-700"><b>4. HOD:</b> ${p.hodApproval?.time || '-'}</div>
            <div class="text-red-700"><b>5. Principal:</b> ${p.principalApproval?.time || '-'}</div>
          </td>
          <td class="p-3 max-w-xs">
            <div class="font-bold text-slate-800 text-[11px] mb-1">"${escapeHtml(p.reason)}"</div>
            <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">
              📄 Read Letter
            </button>
          </td>
          <td class="p-3 text-right">
            <button onclick="approveGirlsWardenPass('${p._id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition active:scale-95 whitespace-nowrap text-xs">
              Grant 20-Min Pass ➔
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = '<div class="p-4 text-center text-xs text-rose-500">Failed to load girls warden queue.</div>';
  }
}

async function approveGirlsWardenPass(passId) {
  try {
    const data = await Api.post('/api/approve/girls-warden', { passId });
    if (data && (data.success === false || data.error)) {
      alert(data.message || data.error || 'Girls warden approval failed.');
      return;
    }
    alert(data.message || 'Girls Warden approval granted.');
    refreshAllAuthorityViews();
  } catch (err) {
    alert('Girls warden approval failed.');
  }
}

/**
 * Fetches and displays return scan records for Boys Hostel
 */
async function fetchBoysReturnedStudents() {
  const el = document.getElementById('boysReturnedQueue');
  if (!el) return;

  try {
    let passes = await Api.get('/api/passes?role=boys_warden&status=Approved,Exited,Returned');
    passes = (passes || []).filter(
      p => /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '') && !/^female$/i.test(String(p.gender || '').trim())
    );
    if (!passes || passes.length === 0) {
      el.innerHTML =
        '<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200">No recent student return or movement records for Boys Hostel.</div>';
      return;
    }

    let html = `
      <table class="w-full text-left text-xs min-w-[850px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Student & Roll No</th>
            <th class="p-3">Standing & Contact</th>
            <th class="p-3">Campus Exit (IST)</th>
            <th class="p-3">College Return Timestamp (IST with Seconds)</th>
            <th class="p-3 text-right">Pass Detail</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
    `;

    passes.forEach(p => {
      const isReturned = p.status === 'Returned' || (p.returnTime && p.returnTime !== '-');
      const isExited = p.status === 'Exited' || p.exitStatus === 'Exited Campus';

      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 font-mono">
            <span class="font-bold text-red-600">${p.rollNo}</span><br>
            <span class="text-slate-800 font-sans font-semibold">${p.name}</span>
            <div class="text-[10px] text-indigo-700 font-bold">Male</div>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-700">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
            <a href="tel:${p.parentContact}" class="text-[11px] text-emerald-700 font-semibold hover:underline">
              📞 Parent: ${p.parentContact || 'N/A'}
            </a>
          </td>
          <td class="p-3 font-mono text-[11px] text-slate-700">
            ${isExited || isReturned ? `🚪 ${p.exitTime || '-'}` : '<span class="text-slate-400">Not Exited Yet</span>'}
          </td>
          <td class="p-3 font-mono">
            ${
              isReturned
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                    ↩️ Returned on: <b>${p.returnTime}</b>
                   </span>`
                : isExited
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                    🚪 Outside Campus (Exited ${p.exitTime || '-'})
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-xs">
                    ⏳ Approved (Gate Window Active)
                   </span>`
            }
          </td>
          <td class="p-3 text-right">
            <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition">
              📄 View Letter
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = '<div class="p-4 text-center text-xs text-rose-500">Failed to load returned students log.</div>';
  }
}

/**
 * Fetches and displays return scan records for Girls Hostel
 */
async function fetchGirlsReturnedStudents() {
  const el = document.getElementById('girlsReturnedQueue');
  if (!el) return;

  try {
    let passes = await Api.get('/api/passes?role=girls_warden&status=Approved,Exited,Returned');
    passes = (passes || []).filter(
      p => /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '') && /^female$/i.test(String(p.gender || '').trim())
    );
    if (!passes || passes.length === 0) {
      el.innerHTML =
        '<div class="p-6 text-center text-xs text-slate-500 font-bold bg-white rounded-xl border border-slate-200">No recent student return or movement records for Girls Hostel.</div>';
      return;
    }

    let html = `
      <table class="w-full text-left text-xs min-w-[850px] bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
        <thead class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">Student & Roll No</th>
            <th class="p-3">Standing & Contact</th>
            <th class="p-3">Campus Exit (IST)</th>
            <th class="p-3">College Return Timestamp (IST with Seconds)</th>
            <th class="p-3 text-right">Pass Detail</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
    `;

    passes.forEach(p => {
      const isReturned = p.status === 'Returned' || (p.returnTime && p.returnTime !== '-');
      const isExited = p.status === 'Exited' || p.exitStatus === 'Exited Campus';

      html += `
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 font-mono">
            <span class="font-bold text-red-600">${p.rollNo}</span><br>
            <span class="text-slate-800 font-sans font-semibold">${p.name}</span>
            <div class="text-[10px] text-pink-700 font-bold">Female</div>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-700">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
            <a href="tel:${p.parentContact}" class="text-[11px] text-emerald-700 font-semibold hover:underline">
              📞 Parent: ${p.parentContact || 'N/A'}
            </a>
          </td>
          <td class="p-3 font-mono text-[11px] text-slate-700">
            ${isExited || isReturned ? `🚪 ${p.exitTime || '-'}` : '<span class="text-slate-400">Not Exited Yet</span>'}
          </td>
          <td class="p-3 font-mono">
            ${
              isReturned
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                    ↩️ Returned on: <b>${p.returnTime}</b>
                   </span>`
                : isExited
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                    🚪 Outside Campus (Exited ${p.exitTime || '-'})
                   </span>`
                : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-xs">
                    ⏳ Approved (Gate Window Active)
                   </span>`
            }
          </td>
          <td class="p-3 text-right">
            <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition">
              📄 View Letter
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = '<div class="p-4 text-center text-xs text-rose-500">Failed to load returned students log.</div>';
  }
}
