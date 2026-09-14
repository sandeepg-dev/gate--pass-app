/**
 * Hostel Wardens Dashboard Module
 * Exclusively 2 Sections:
 * 1. Leave Requests - To view and manage leave requests received after all required approvals
 * 2. Records        - To maintain all leave-related records separately
 */

let activeWardenSection = 'requests'; // 'requests' | 'records'
let wardenCachedRecords = [];

function getWardenRole() {
  return (loggedUser && (loggedUser.role === 'girls_warden' ? 'girls_warden' : 'boys_warden')) || 'boys_warden';
}

/**
 * Switch between the 2 dedicated Warden sections: Leave Requests | Records
 */
function switchWardenSection(sectionName) {
  activeWardenSection = sectionName;

  const sections = ['requests', 'records'];
  sections.forEach(sec => {
    const secEl = document.getElementById(`wardenSec_${sec}`);
    const tabBtn = document.getElementById(`wardenTabBtn_${sec}`);

    if (secEl) {
      if (sec === sectionName) {
        secEl.classList.remove('hidden');
      } else {
        secEl.classList.add('hidden');
      }
    }

    if (tabBtn) {
      if (sec === sectionName) {
        tabBtn.className = 'warden-nav-tab active-warden-tab px-5 py-2.5 rounded-2xl text-xs font-black shadow-sm flex items-center gap-2 transition-all bg-white text-slate-900 border border-slate-200';
      } else {
        tabBtn.className = 'warden-nav-tab px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/60 transition-all flex items-center gap-2 border border-transparent';
      }
    }
  });

  refreshWardenDashboard();
}

/**
 * Refreshes Leave Requests and Records sections with live badge counts
 */
async function refreshWardenDashboard() {
  const role = getWardenRole();
  await Promise.all([
    fetchWardenLeaveRequests(role),
    fetchWardenRecords(role)
  ]);
}

/**
 * SECTION 1: LEAVE REQUESTS - View and manage leave requests received after all required approvals
 */
async function fetchWardenLeaveRequests(role) {
  const el = document.getElementById('wardenRequestsTableContainer');
  const countBadge = document.getElementById('authBadge_requests') || document.getElementById('wardenBadge_requests');
  if (!el) return;

  try {
    const statusParam = role === 'girls_warden' ? 'Pending%20Girls%20Warden' : 'Pending%20Boys%20Warden';
    let passes = await Api.get(`/api/passes?status=${statusParam}&role=${role}`);
    passes = (passes || []).filter(p => {
      const isHostel = /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '');
      const genderMatch = role === 'girls_warden'
        ? /^female$/i.test(String(p.gender || '').trim())
        : !/^female$/i.test(String(p.gender || '').trim());
      return isHostel && genderMatch;
    });

    if (countBadge) {
      countBadge.innerText = passes.length;
      countBadge.className = passes.length > 0
        ? 'px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse'
        : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600';
    }

    const kpiPending = document.getElementById('kpi_pending');
    if (kpiPending) kpiPending.innerText = passes.length;

    if (!passes || passes.length === 0) {
      el.innerHTML = `
        <div class="p-12 text-center bg-white space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">🎉</div>
          <div class="text-sm font-bold text-slate-800">No Pending Leave Requests</div>
          <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">All leave requests forwarded after Principal clearance have been reviewed.</p>
        </div>`;
      return;
    }

    let html = `
      <table class="enterprise-table min-w-[850px]">
        <thead>
          <tr>
            <th>Student & Roll No</th>
            <th>Class, Hostel & Contact</th>
            <th>Approval Hierarchy Trail</th>
            <th>Reason & Document</th>
            <th class="text-right">Warden Decision</th>
          </tr>
        </thead>
        <tbody>
    `;

    passes.forEach(p => {
      const isFemale = role === 'girls_warden';
      html += `
        <tr>
          <td>
            <div class="font-bold text-slate-900 text-sm">${escapeHtml(p.name)}</div>
            <div class="font-mono text-xs font-bold text-red-700 bg-red-50/80 border border-red-200/60 inline-block px-2 py-0.5 rounded-md mt-0.5">${p.rollNo}</div>
            <div class="text-xs font-semibold ${isFemale ? 'text-pink-600' : 'text-indigo-600'} mt-1">${p.gender || (isFemale ? 'Female' : 'Male')}</div>
          </td>
          <td>
            <div class="font-semibold text-slate-800 text-xs md:text-sm">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
            <div class="mt-1">
              ${formatAccommodationBadge(p.accommodation)}
            </div>
            <a href="tel:${p.parentContact}" class="text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1 mt-1">
              📞 Parent: ${p.parentContact || 'N/A'}
            </a>
          </td>
          <td>
            <div class="font-mono text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div><span class="text-slate-500 font-sans">1. Applied:</span> ${p.appliedTime || '-'}</div>
              <div class="text-emerald-800 font-semibold"><span class="text-emerald-600 font-sans">2. Counselor:</span> ${p.counselorApproval?.time || p.parentCallTime || '✓ Approved'}</div>
              <div class="text-indigo-800 font-semibold"><span class="text-indigo-600 font-sans">3. Advisor:</span> ${p.advisorApproval?.time || '✓ Approved'}</div>
              <div class="text-purple-800 font-semibold"><span class="text-purple-600 font-sans">4. HOD:</span> ${p.hodApproval?.time || '✓ Approved'}</div>
              <div class="text-red-800 font-semibold"><span class="text-red-600 font-sans">5. Principal:</span> ${p.principalApproval?.time || '✓ Approved'}</div>
            </div>
          </td>
          <td class="max-w-xs">
            <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
            <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
              📄 View Letter
            </button>
          </td>
          <td class="text-right">
            <div class="flex items-center justify-end gap-2">
              <button onclick="openRejectModal('${p._id}', '${isFemale ? 'Girls Hostel Warden' : 'Boys Hostel Warden'}')" class="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-semibold rounded-xl shadow-2xs whitespace-nowrap transition active:scale-95 text-xs md:text-sm">
                ✕ Reject
              </button>
              <button onclick="${isFemale ? `approveGirlsWardenPass('${p._id}')` : `approveBoysWardenPass('${p._id}')`}" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-2xs transition active:scale-95 whitespace-nowrap text-xs md:text-sm flex items-center gap-1.5">
                <span>✓ Approve Leave</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = '<div class="p-8 text-center text-xs md:text-sm text-rose-500 font-semibold">Failed to load warden leave requests.</div>';
  }
}

/**
 * SECTION 2: RECORDS - Maintain all leave-related records separately
 */
async function fetchWardenRecords(role) {
  const el = document.getElementById('wardenRecordsTableContainer');
  const countBadge = document.getElementById('wardenBadge_records');
  if (!el) return;

  try {
    let passes = await Api.get(`/api/passes?role=${role}`);
    passes = (passes || []).filter(p => {
      const isHostel = /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '');
      const genderMatch = role === 'girls_warden'
        ? /^female$/i.test(String(p.gender || '').trim())
        : !/^female$/i.test(String(p.gender || '').trim());
      if (!isHostel || !genderMatch) return false;

      // Pending requests belong in Section 1 (Leave Requests), NOT Section 2 (Records)
      if (p.status.startsWith('Pending')) return false;

      // Must have reached warden (Principal approved)
      if (!p.principalApproval?.approved) return false;

      // Must have completed decision (Approved or Rejected by Warden)
      const isApproved = p.wardenApproval?.approved === true || p.status === 'Approved' || p.status === 'Exited' || p.status === 'Returned';
      const isRejected = p.status === 'Rejected' && (p.rejection?.role === 'boys_warden' || p.rejection?.role === 'girls_warden' || p.rejection?.role === 'warden' || /warden/i.test(p.rejectedBy || ''));
      return isApproved || isRejected;
    });

    wardenCachedRecords = passes;
    if (countBadge) {
      countBadge.innerText = passes.length;
    }

    renderWardenRecords(passes);
  } catch (err) {
    el.innerHTML = '<div class="p-8 text-center text-xs md:text-sm text-rose-500 font-semibold">Failed to load warden records archive.</div>';
  }
}

function filterWardenRecords() {
  const query = document.getElementById('wardenRecordsSearch')?.value?.toLowerCase().trim() || '';
  if (!query) {
    renderWardenRecords(wardenCachedRecords);
    return;
  }
  const filtered = wardenCachedRecords.filter(p => {
    return (
      (p.rollNo && p.rollNo.toLowerCase().includes(query)) ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.dept && p.dept.toLowerCase().includes(query)) ||
      (p.reason && p.reason.toLowerCase().includes(query))
    );
  });
  renderWardenRecords(filtered);
}

function renderWardenRecords(passes) {
  const el = document.getElementById('wardenRecordsTableContainer');
  if (!el) return;

  if (!passes || passes.length === 0) {
    el.innerHTML = `
      <div class="p-12 text-center bg-white space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">📑</div>
        <div class="text-sm font-bold text-slate-800">No Records Found</div>
        <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">All complete historical leave and approval records are maintained here.</p>
      </div>`;
    return;
  }

  let html = `
    <table class="enterprise-table min-w-[950px]">
      <thead>
        <tr>
          <th>Student & Roll No</th>
          <th>Class & Department</th>
          <th>Approval Hierarchy Trail</th>
          <th>Reason & Document</th>
          <th>Status</th>
          <th class="text-right">Audit & PDF</th>
        </tr>
      </thead>
      <tbody>
  `;

  passes.forEach(p => {
    html += `
      <tr>
        <td>
          <div class="font-bold text-slate-900 text-sm">${escapeHtml(p.name)}</div>
          <div class="font-mono text-xs font-bold text-red-700 bg-red-50/80 border border-red-200/60 inline-block px-2 py-0.5 rounded-md mt-0.5">${p.rollNo}</div>
          <div class="text-xs text-slate-500 mt-1">📞 ${p.parentContact || '-'}</div>
        </td>
        <td>
          <div class="font-semibold text-slate-800 text-xs md:text-sm">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
          <div class="mt-1">${formatAccommodationBadge(p.accommodation)}</div>
        </td>
        <td>
          <div class="font-mono text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div><span class="text-slate-500 font-sans">Applied:</span> ${p.appliedTime || '-'}</div>
            <div class="text-emerald-800 font-semibold"><span class="text-emerald-600 font-sans">1. Counselor:</span> ${p.counselorApproval?.time || '✓'}</div>
            <div class="text-indigo-800 font-semibold"><span class="text-indigo-600 font-sans">2. Advisor:</span> ${p.advisorApproval?.time || '✓'}</div>
            <div class="text-purple-800 font-semibold"><span class="text-purple-600 font-sans">3. HOD:</span> ${p.hodApproval?.time || '✓'}</div>
            <div class="text-red-800 font-semibold"><span class="text-red-600 font-sans">4. Principal:</span> ${p.principalApproval?.time || '✓'}</div>
            <div class="text-pink-800 font-semibold"><span class="text-pink-600 font-sans">5. Warden:</span> ${p.wardenApproval?.time || '✓'}</div>
          </div>
        </td>
        <td class="max-w-xs">
          <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
          <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
            📄 View Letter
          </button>
        </td>
        <td>
          ${
            p.status === 'Rejected'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    ❌ REJECTED
                  </span>
                  <div class="text-xs text-rose-900 font-medium">"${escapeHtml(p.rejectionReason || 'No reason specified')}"</div>
                  <div class="text-xs text-slate-500">By: ${escapeHtml(p.rejectedBy || 'Warden')}</div>
                </div>`
              : p.status === 'Returned' || p.exitStatus === 'Returned to College'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
                  🏠 RETURNED (${escapeHtml(p.returnTime || '')})
                </span>`
              : p.exitStatus === 'Exited Campus'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  🚪 EXITED (${escapeHtml(p.exitTime || '')})
                </span>`
              : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ✅ APPROVED
                </span>`
          }
        </td>
        <td class="text-right space-y-1.5">
          <button onclick="downloadSinglePassPDF(${escapeAttr(p)})" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 ml-auto active:scale-95">
            <span>Pass PDF</span>
          </button>
          <button onclick="downloadOfficialLetterOnlyPDF(${escapeAttr(p)})" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 ml-auto active:scale-95">
            <span>Letter PDF</span>
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  el.innerHTML = html;
}

/**
 * Approve leave application by Boys Warden
 */
async function approveBoysWardenPass(passId) {
  try {
    const data = await Api.post('/api/approve/boys-warden', { passId });
    if (!data.success) {
      showToast(data.message || data.error || 'Boys warden approval failed.', 'error');
      return;
    }
    showToast(data.message || 'Boys Warden approval granted successfully!', 'success');
    if (typeof refreshAllAuthorityViews === 'function') {
      refreshAllAuthorityViews();
    } else {
      refreshWardenDashboard();
    }
  } catch (err) {
    showToast('Boys warden approval failed.', 'error');
  }
}

/**
 * Approve leave application by Girls Warden
 */
async function approveGirlsWardenPass(passId) {
  try {
    const data = await Api.post('/api/approve/girls-warden', { passId });
    if (!data.success) {
      showToast(data.message || data.error || 'Girls warden approval failed.', 'error');
      return;
    }
    showToast(data.message || 'Girls Warden approval granted successfully!', 'success');
    if (typeof refreshAllAuthorityViews === 'function') {
      refreshAllAuthorityViews();
    } else {
      refreshWardenDashboard();
    }
  } catch (err) {
    showToast('Girls warden approval failed.', 'error');
  }
}
