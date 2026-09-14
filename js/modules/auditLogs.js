/**
 * Universal Authority 4-Section Architecture & Audit Logs Module
 * 1. Student Leave Requests / Leave Requests (Active Queue)
 * 2. Approved (Endorsed by this authority)
 * 3. Rejected (Declined by this authority)
 * 4. All Records (Complete audit trail in authority jurisdiction)
 */

let currentAuthorityTab = 'requests'; // 'requests' | 'approved' | 'rejected' | 'all'
let cachedAllRecords = [];
let cachedApprovedRecords = [];
let cachedRejectedRecords = [];
let currentModalPass = null;

function switchAuthorityTab(tabName) {
  currentAuthorityTab = tabName;
  const tabs = ['requests', 'approved', 'rejected', 'all'];

  tabs.forEach(t => {
    const secEl = document.getElementById(`authSec_${t}`);
    const cardEl = document.getElementById(`kpiCard_${t}`);

    if (secEl) {
      if (t === tabName) secEl.classList.remove('hidden');
      else secEl.classList.add('hidden');
    }

    if (cardEl) {
      if (t === tabName) {
        cardEl.classList.add('active-kpi-card');
      } else {
        cardEl.classList.remove('active-kpi-card');
      }
    }
  });
}

/**
 * Loads and filters passes into Approved, Rejected, and All Records sections
 * and updates live badge counts for the current authority
 */
async function loadUniversalLogs() {
  if (!loggedUser) return;

  try {
    let logUrl = '/api/passes?';
    if (loggedUser.role === 'principal') {
      logUrl += 'role=principal';
    } else if (loggedUser.role === 'hod') {
      logUrl += `role=hod&dept=${encodeURIComponent(loggedUser.dept)}`;
    } else if (loggedUser.role === 'advisor') {
      logUrl += `role=advisor&dept=${encodeURIComponent(loggedUser.dept)}&yearSec=${encodeURIComponent(loggedUser.yearSec)}`;
    } else if (loggedUser.role === 'counselor') {
      logUrl += `role=counselor&counselorName=${encodeURIComponent(loggedUser.name)}&startRoll=${encodeURIComponent(
        loggedUser.startRoll || ''
      )}&endRoll=${encodeURIComponent(loggedUser.endRoll || '')}`;
    } else if (loggedUser.role === 'boys_warden') {
      logUrl += 'role=boys_warden';
    } else if (loggedUser.role === 'girls_warden') {
      logUrl += 'role=girls_warden';
    }

    let allPasses = await Api.get(logUrl);
    allPasses = allPasses || [];

    // Filter jurisdiction-specific visibility
    if (loggedUser.role === 'advisor') {
      allPasses = allPasses.filter(p => {
        const reached = p.counselorApproval?.approved === true || p.status === 'Pending Advisor';
        if (!reached) return false;
        if (p.status === 'Rejected' && !p.counselorApproval?.approved) return false;
        return true;
      });
    } else if (loggedUser.role === 'hod') {
      allPasses = allPasses.filter(p => {
        const reached = p.advisorApproval?.approved === true || p.status === 'Pending HOD';
        if (!reached) return false;
        if (p.status === 'Rejected' && !p.advisorApproval?.approved) return false;
        return true;
      });
    } else if (loggedUser.role === 'principal') {
      allPasses = allPasses.filter(p => {
        const reached = p.hodApproval?.approved === true || p.status === 'Pending Principal';
        if (!reached) return false;
        if (p.status === 'Rejected' && !p.hodApproval?.approved) return false;
        return true;
      });
    } else if (loggedUser.role === 'boys_warden') {
      allPasses = allPasses.filter(p => {
        const isHostel = /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '');
        const isNotFemale = !/^female$/i.test(String(p.gender || '').trim());
        const isNotGirlsStatus = p.status !== 'Pending Girls Warden';
        if (!isHostel || !isNotFemale || !isNotGirlsStatus) return false;
        const reached = p.principalApproval?.approved === true || p.status === 'Pending Boys Warden';
        if (!reached) return false;
        if (p.status === 'Rejected' && !p.principalApproval?.approved) return false;
        return true;
      });
    } else if (loggedUser.role === 'girls_warden') {
      allPasses = allPasses.filter(p => {
        const isHostel = /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '');
        const isFemale = /^female$/i.test(String(p.gender || '').trim()) || p.status === 'Pending Girls Warden';
        const isNotBoysStatus = p.status !== 'Pending Boys Warden';
        if (!isHostel || !isFemale || !isNotBoysStatus) return false;
        const reached = p.principalApproval?.approved === true || p.status === 'Pending Girls Warden';
        if (!reached) return false;
        if (p.status === 'Rejected' && !p.principalApproval?.approved) return false;
        return true;
      });
    }

    // Split into Approved and Rejected based on THIS authority's action
    let approvedPasses = [];
    let rejectedPasses = [];

    if (loggedUser.role === 'counselor') {
      approvedPasses = allPasses.filter(p => p.counselorApproval?.approved === true);
      rejectedPasses = allPasses.filter(
        p => p.status === 'Rejected' && (p.rejection?.role === 'counselor' || /counselor/i.test(p.rejectedBy || ''))
      );
    } else if (loggedUser.role === 'advisor') {
      approvedPasses = allPasses.filter(p => p.advisorApproval?.approved === true);
      rejectedPasses = allPasses.filter(
        p => p.status === 'Rejected' && (p.rejection?.role === 'advisor' || /advisor/i.test(p.rejectedBy || ''))
      );
    } else if (loggedUser.role === 'hod') {
      approvedPasses = allPasses.filter(p => p.hodApproval?.approved === true);
      rejectedPasses = allPasses.filter(
        p => p.status === 'Rejected' && (p.rejection?.role === 'hod' || /hod/i.test(p.rejectedBy || ''))
      );
    } else if (loggedUser.role === 'principal') {
      approvedPasses = allPasses.filter(p => p.principalApproval?.approved === true);
      rejectedPasses = allPasses.filter(
        p => p.status === 'Rejected' && (p.rejection?.role === 'principal' || /principal/i.test(p.rejectedBy || ''))
      );
    } else if (loggedUser.role === 'boys_warden') {
      approvedPasses = allPasses.filter(
        p => p.wardenApproval?.approved === true || (p.status === 'Approved' && p.principalApproval?.approved) || p.status === 'Exited' || p.status === 'Returned'
      );
      rejectedPasses = allPasses.filter(
        p =>
          p.status === 'Rejected' &&
          (p.rejection?.role === 'boys_warden' || p.rejection?.role === 'warden' || /warden/i.test(p.rejectedBy || ''))
      );
    } else if (loggedUser.role === 'girls_warden') {
      approvedPasses = allPasses.filter(
        p => p.wardenApproval?.approved === true || (p.status === 'Approved' && p.principalApproval?.approved) || p.status === 'Exited' || p.status === 'Returned'
      );
      rejectedPasses = allPasses.filter(
        p =>
          p.status === 'Rejected' &&
          (p.rejection?.role === 'girls_warden' || p.rejection?.role === 'warden' || /warden/i.test(p.rejectedBy || ''))
      );
    }

    cachedAllRecords = allPasses;
    cachedApprovedRecords = approvedPasses;
    cachedRejectedRecords = rejectedPasses;

    // Update Tab Badges & KPI Stat Cards
    const badgeApproved = document.getElementById('authBadge_approved');
    if (badgeApproved) badgeApproved.innerText = approvedPasses.length;
    const kpiApproved = document.getElementById('kpi_approved');
    if (kpiApproved) kpiApproved.innerText = approvedPasses.length;

    const badgeRejected = document.getElementById('authBadge_rejected');
    if (badgeRejected) badgeRejected.innerText = rejectedPasses.length;
    const kpiRejected = document.getElementById('kpi_rejected');
    if (kpiRejected) kpiRejected.innerText = rejectedPasses.length;

    const badgeAll = document.getElementById('authBadge_all');
    if (badgeAll) badgeAll.innerText = allPasses.length;
    const kpiTotal = document.getElementById('kpi_total');
    if (kpiTotal) kpiTotal.innerText = allPasses.length;

    // Render Section Tables
    renderAuthorityApprovedSection(approvedPasses);
    renderAuthorityRejectedSection(rejectedPasses);
    renderAuthorityAllRecordsSection(allPasses);
  } catch (err) {
    console.error('Failed to load authority records:', err);
  }
}

/**
 * Section 2: Render Approved Passes
 */
function renderAuthorityApprovedSection(passes) {
  const container = document.getElementById('authorityApprovedContainer');
  if (!container) return;

  if (!passes || passes.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-white space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">✓</div>
        <div class="text-sm font-bold text-slate-800">No Approved Records Yet</div>
        <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">Leave applications approved and endorsed at your authority level will appear here.</p>
      </div>`;
    return;
  }

  let html = `
    <table class="enterprise-table min-w-[950px]">
      <thead>
        <tr>
          <th>Student & Roll No</th>
          <th>Class & Accommodation</th>
          <th>Reason & Document</th>
          <th>Your Approval (IST)</th>
          <th>Current Status</th>
          <th class="text-right">Official PDFs</th>
        </tr>
      </thead>
      <tbody>
  `;

  passes.forEach(p => {
    let yourTime = '-';
    if (loggedUser.role === 'counselor') yourTime = p.counselorApproval?.time || p.parentCallTime || '-';
    else if (loggedUser.role === 'advisor') yourTime = p.advisorApproval?.time || '-';
    else if (loggedUser.role === 'hod') yourTime = p.hodApproval?.time || '-';
    else if (loggedUser.role === 'principal') yourTime = p.principalApproval?.time || p.approvalTime || '-';
    else if (loggedUser.role === 'boys_warden' || loggedUser.role === 'girls_warden')
      yourTime = p.wardenApproval?.time || p.approvalTime || '-';

    html += `
      <tr>
        <td>
          <div class="font-bold text-slate-900 text-sm">${escapeHtml(p.name)}</div>
          <div class="font-mono text-xs font-bold text-red-700 bg-red-50/80 border border-red-200/60 inline-block px-2 py-0.5 rounded-md mt-0.5">${p.rollNo}</div>
        </td>
        <td>
          <div class="font-semibold text-slate-800 text-xs md:text-sm">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
          <div class="mt-1">${formatAccommodationBadge(p.accommodation)}</div>
        </td>
        <td class="max-w-xs">
          <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
          <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
            📄 View Letter
          </button>
        </td>
        <td>
          <div class="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            ⏱️ ${yourTime}
          </div>
        </td>
        <td>
          ${
            p.status === 'Approved'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ✅ APPROVED (FINAL)
                  </span>
                  <div class="text-xs text-emerald-700 font-mono font-semibold">${p.approvalTime || '-'}</div>
                </div>`
              : p.status === 'Exited' || p.exitStatus === 'Exited Campus'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  🚪 EXITED (${escapeHtml(p.exitTime || '')})
                </span>`
              : p.status === 'Returned' || p.exitStatus === 'Returned to College'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
                  🏠 RETURNED (${escapeHtml(p.returnTime || '')})
                </span>`
              : p.status === 'Rejected'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    ❌ REJECTED AT LATER STAGE
                  </span>
                  <div class="text-xs text-slate-500">By: ${escapeHtml(p.rejectedBy || 'Higher Authority')}</div>
                </div>`
              : `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ✓ APPROVED & FORWARDED
                  </span>
                  <div class="text-xs text-slate-600 font-semibold font-mono">Next: ${escapeHtml(p.status.replace('Pending ', ''))}</div>
                </div>`
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
  container.innerHTML = html;
}

/**
 * Section 3: Render Rejected Passes
 */
function renderAuthorityRejectedSection(passes) {
  const container = document.getElementById('authorityRejectedContainer');
  if (!container) return;

  if (!passes || passes.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-white space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">🎉</div>
        <div class="text-sm font-bold text-slate-800">No Rejected Applications</div>
        <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">Applications rejected at your authority level will appear here with recorded reasons.</p>
      </div>`;
    return;
  }

  let html = `
    <table class="enterprise-table min-w-[950px]">
      <thead>
        <tr>
          <th>Student & Roll No</th>
          <th>Class & Accommodation</th>
          <th>Original Reason & Letter</th>
          <th>Rejection Reason & Sign-off</th>
          <th>Rejected Timestamp</th>
          <th class="text-right">Official Document</th>
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
        </td>
        <td>
          <div class="font-semibold text-slate-800 text-xs md:text-sm">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
          <div class="mt-1">${formatAccommodationBadge(p.accommodation)}</div>
        </td>
        <td class="max-w-xs">
          <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
          <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
            📄 View Letter
          </button>
        </td>
        <td>
          <div class="space-y-1.5 bg-rose-50/90 p-3 rounded-xl border border-rose-200 max-w-sm">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              ❌ REJECTED
            </span>
            <div class="text-xs md:text-sm text-rose-900 font-semibold leading-relaxed">"${escapeHtml(p.rejectionReason || 'No reason specified')}"</div>
            <div class="text-xs text-slate-500">By: ${escapeHtml(p.rejectedBy || p.rejection?.rejectedBy || 'Authority')}</div>
          </div>
        </td>
        <td>
          <div class="font-mono text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
            ⏱️ ${p.rejectedTime || p.rejection?.time || '-'}
          </div>
        </td>
        <td class="text-right">
          <button onclick="downloadOfficialLetterOnlyPDF(${escapeAttr(p)})" class="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-2xs transition inline-flex items-center gap-1.5 active:scale-95">
            <span>Letter PDF</span>
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

/**
 * Section 4: Render All Records Archive
 */
function renderAuthorityAllRecordsSection(passes) {
  const container = document.getElementById('authorityAllRecordsContainer');
  if (!container) return;

  if (!passes || passes.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-white space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl mx-auto shadow-2xs">📑</div>
        <div class="text-sm font-bold text-slate-800">No Records Found</div>
        <p class="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">All student leave requisitions within your jurisdiction will be archived here.</p>
      </div>`;
    return;
  }

  let html = `
    <table class="enterprise-table min-w-[950px]">
      <thead>
        <tr>
          <th>Student & Roll No</th>
          <th>Class & Section</th>
          <th>Contact Numbers</th>
          <th>Reason & Document</th>
          <th>Multi-Tier Audit Chain (IST)</th>
          <th>Current Status</th>
          <th class="text-right">Actions</th>
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
        </td>
        <td>
          <div class="font-semibold text-slate-800 text-xs md:text-sm">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</div>
          <div class="mt-1">${formatAccommodationBadge(p.accommodation)}</div>
        </td>
        <td>
          <div class="text-xs md:text-sm text-slate-700 space-y-0.5">
            <div>📞 Parent: <span class="font-bold text-slate-900">${p.parentContact || '-'}</span></div>
            <div>📱 Student: <span class="text-slate-600">${p.mobile || '-'}</span></div>
          </div>
        </td>
        <td class="max-w-xs">
          <div class="font-medium text-slate-800 text-xs md:text-sm leading-relaxed mb-1.5 line-clamp-2">"${escapeHtml(p.reason)}"</div>
          <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition active:scale-95">
            📄 View Letter
          </button>
        </td>
        <td>
          <div class="font-mono text-xs text-slate-700 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div><span class="text-slate-500 font-sans">Applied:</span> ${p.appliedTime || '-'}</div>
            <div><span class="text-slate-500 font-sans">Counselor:</span> ${p.counselorApproval?.time || p.parentCallTime || '-'}</div>
            <div><span class="text-slate-500 font-sans">Advisor:</span> ${p.advisorApproval?.time || '-'}</div>
            <div><span class="text-slate-500 font-sans">HOD:</span> ${p.hodApproval?.time || '-'}</div>
            <div><span class="text-slate-500 font-sans">Principal:</span> ${p.approvalTime || '-'}</div>
            ${p.wardenApproval?.approved ? `<div><span class="text-slate-500 font-sans">Warden:</span> ${p.wardenApproval?.time || '-'}</div>` : ''}
          </div>
        </td>
        <td>
          ${
            p.status === 'Rejected'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    ❌ REJECTED
                  </span>
                  <div class="text-xs text-rose-800 font-semibold max-w-[180px] break-words">
                    "${escapeHtml(p.rejectionReason || 'No reason specified')}"
                  </div>
                  <div class="text-xs text-slate-500">By: ${escapeHtml(p.rejectedBy || 'Authority')}</div>
                </div>`
              : p.status === 'Returned' || p.exitStatus === 'Returned to College'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300">
                  🏠 RETURNED (${escapeHtml(p.returnTime || '')})
                </span>`
              : p.exitStatus === 'Exited Campus'
              ? `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  🚪 EXITED (${escapeHtml(p.exitTime || '')})
                </span>`
              : p.status === 'Approved'
              ? `<div class="space-y-1">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    ✅ APPROVED
                  </span>
                  <div class="text-xs text-emerald-700 font-mono font-semibold">${p.approvalTime || '-'}</div>
                </div>`
              : `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  ⏳ ${escapeHtml(p.status.toUpperCase())}
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
  container.innerHTML = html;
}

/**
 * Live search filter on Section 4: All Records
 */
function filterAuthorityAllRecords() {
  const query = document.getElementById('authAllRecordsSearch')?.value?.toLowerCase().trim() || '';
  if (!query) {
    renderAuthorityAllRecordsSection(cachedAllRecords);
    return;
  }
  const filtered = cachedAllRecords.filter(p => {
    return (
      (p.rollNo && p.rollNo.toLowerCase().includes(query)) ||
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.dept && p.dept.toLowerCase().includes(query)) ||
      (p.reason && p.reason.toLowerCase().includes(query)) ||
      (p.status && p.status.toLowerCase().includes(query))
    );
  });
  renderAuthorityAllRecordsSection(filtered);
}

function viewFormalLetter(pass) {
  currentModalPass = pass;
  const contentEl = document.getElementById('letterModalContent');
  const btnEl = document.getElementById('modalDownloadLetterBtn');
  const modalEl = document.getElementById('letterModal');

  if (contentEl) contentEl.innerText = pass.formalLetter || pass.reason;
  if (btnEl) btnEl.onclick = () => downloadOfficialLetterOnlyPDF(pass);
  if (modalEl) modalEl.classList.remove('hidden');
}

function closeLetterModal() {
  const modalEl = document.getElementById('letterModal');
  if (modalEl) modalEl.classList.add('hidden');
}

// Window global bindings
window.switchAuthorityTab = switchAuthorityTab;
window.loadUniversalLogs = loadUniversalLogs;
window.filterAuthorityAllRecords = filterAuthorityAllRecords;
window.viewFormalLetter = viewFormalLetter;
window.closeLetterModal = closeLetterModal;

