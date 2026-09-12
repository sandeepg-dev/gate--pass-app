/**
 * Universal Audit Logs & Letter Preview Module
 */

let masterPassList = [];
let currentModalPass = null;

async function loadUniversalLogs() {
  const tbody = document.getElementById('universalLogsBody');
  if (!tbody || !loggedUser) return;

  try {
    let logUrl = '/api/passes?';
    if (loggedUser.role === 'principal') {
      logUrl += 'role=principal';
      const logsTitle = document.getElementById('logsTitle');
      if (logsTitle) logsTitle.innerText = 'GRTIET College-Wide Master Outpass Records';
    } else if (loggedUser.role === 'hod') {
      logUrl += `role=hod&dept=${encodeURIComponent(loggedUser.dept)}`;
      const logsTitle = document.getElementById('logsTitle');
      if (logsTitle) logsTitle.innerText = `${loggedUser.dept} Department Outpass Records`;
    } else if (loggedUser.role === 'advisor') {
      logUrl += `role=advisor&dept=${encodeURIComponent(loggedUser.dept)}&yearSec=${encodeURIComponent(loggedUser.yearSec)}`;
      const logsTitle = document.getElementById('logsTitle');
      if (logsTitle) logsTitle.innerText = `${loggedUser.dept} - Section ${loggedUser.yearSec} Records`;
    } else if (loggedUser.role === 'counselor') {
      logUrl += `role=counselor&counselorName=${encodeURIComponent(loggedUser.name)}&startRoll=${encodeURIComponent(
        loggedUser.startRoll || ''
      )}&endRoll=${encodeURIComponent(loggedUser.endRoll || '')}`;
      const logsTitle = document.getElementById('logsTitle');
      if (logsTitle) {
        logsTitle.innerText = `Outpass Records for ${loggedUser.name} (${loggedUser.startRoll || 'Start'} to ${
          loggedUser.endRoll || 'End'
        })`;
      }
    } else if (loggedUser.role === 'boys_warden') {
      logUrl += 'role=boys_warden';
      const logsTitle = document.getElementById('logsTitle');
      if (logsTitle) logsTitle.innerText = 'Boys Hostel Leave Applications & Clearance Records';
      const logsSubtitle = document.getElementById('logsSubtitle');
      if (logsSubtitle) logsSubtitle.innerText = 'Male Hostel Students Only • Day Scholar Excluded';
    } else if (loggedUser.role === 'girls_warden') {
      logUrl += 'role=girls_warden';
      const logsTitle = document.getElementById('logsTitle');
      if (logsTitle) logsTitle.innerText = 'Girls Hostel Leave Applications & Clearance Records';
      const logsSubtitle = document.getElementById('logsSubtitle');
      if (logsSubtitle) logsSubtitle.innerText = 'Female Hostel Students Only • Day Scholar Excluded';
    }

    masterPassList = await Api.get(logUrl);

    // Strict client-side filter to prevent any cross-visibility or Day Scholar leak
    if (loggedUser.role === 'boys_warden') {
      masterPassList = (masterPassList || []).filter(
        p => /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '') && !/^female$/i.test(String(p.gender || '').trim())
      );
    } else if (loggedUser.role === 'girls_warden') {
      masterPassList = (masterPassList || []).filter(
        p => /hostel/i.test(p.accommodation || '') && !/day\s*scholar/i.test(p.accommodation || '') && /^female$/i.test(String(p.gender || '').trim())
      );
    }

    if (!masterPassList || masterPassList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">No records found within your assigned jurisdiction.</td></tr>`;
      return;
    }

    tbody.innerHTML = masterPassList
      .map(
        p => `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
        <td class="p-3 font-mono">
          <span class="font-bold text-red-600">${p.rollNo}</span><br>
          <span class="text-slate-800 font-sans font-semibold">${p.name}</span>
          ${loggedUser.role === 'boys_warden' ? '<div class="text-[10px] text-indigo-700 font-bold">Male Hosteller</div>' : loggedUser.role === 'girls_warden' ? '<div class="text-[10px] text-pink-700 font-bold">Female Hosteller</div>' : ''}
        </td>
        <td class="p-3 font-mono text-slate-600">
          <span class="font-bold text-red-700">${formatClassSection(p.dept, p.yearSec, p.academicYear)}</span>
          <div class="mt-1">
            ${
              loggedUser.role === 'boys_warden' || loggedUser.role === 'girls_warden'
                ? '<span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">🏢 Hosteller</span>'
                : formatAccommodationBadge(p.accommodation)
            }
          </div>
        </td>
        <td class="p-3 text-[11px] text-slate-600">
          📞 Parent: <b>${p.parentContact || '-'}</b><br>
          📱 Student: ${p.mobile || '-'}
        </td>
        <td class="p-3">
          <div class="font-bold text-slate-800 text-[11px] mb-1">"${escapeHtml(p.reason)}"</div>
          <button onclick="viewFormalLetter(${escapeAttr(p)})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100">
            📄 Letter
          </button>
        </td>
        <td class="p-3 font-mono text-[10px] text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded">
          <div><b>Applied:</b> ${p.appliedTime || '-'}</div>
          <div><b>Counselor:</b> ${p.counselorApproval?.time || p.parentCallTime || '-'}</div>
          <div><b>Advisor:</b> ${p.advisorApproval?.time || '-'}</div>
          <div><b>HOD:</b> ${p.hodApproval?.time || '-'}</div>
          <div><b>Principal:</b> ${p.approvalTime || '-'}</div>
        </td>
        <td class="p-3">
          <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            p.status === 'Returned' || p.exitStatus === 'Returned to College'
              ? 'bg-sky-100 text-sky-800 border border-sky-300'
              : p.exitStatus === 'Exited Campus'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }">
            ${
              p.status === 'Returned' || p.exitStatus === 'Returned to College'
                ? '🏠 RETURNED (' + (p.returnTime || '') + ')'
                : p.exitStatus === 'Exited Campus'
                ? '🚪 EXITED (' + (p.exitTime || '') + ')'
                : '🏫 ' + p.status.toUpperCase()
            }
          </span>
        </td>
        <td class="p-3 text-right space-y-1">
          <button onclick='downloadSinglePassPDF(${JSON.stringify(p)})' class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold shadow-sm transition block ml-auto">
            PDF Pass
          </button>
          <button onclick='downloadOfficialLetterOnlyPDF(${JSON.stringify(p)})' class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold shadow-sm transition block ml-auto">
            PDF Letter
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-rose-500">Failed to load audit logs.</td></tr>`;
  }
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
