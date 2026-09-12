/**
 * Dynamic Dashboard Orchestrator & View Controller
 */

function openDashboard(user) {
  document.getElementById('authScreen')?.classList.add('hidden');
  document.getElementById('dashScreen')?.classList.remove('hidden');

  const greeting = document.getElementById('dashGreeting');
  if (greeting) greeting.innerText = `Welcome, ${user.name}`;

  const subtitles = {
    principal: 'EXECUTIVE DIRECTORATE • GRTIET Institution-Wide Clearance',
    hod: `HEAD OF DEPARTMENT • Department of ${user.dept}`,
    advisor: `CLASS ADVISOR • ${user.academicYear || 'I Year'} - ${user.dept} Sec ${user.yearSec}`,
    counselor: `CLASS COUNSELOR • Assigned Ward (${user.startRoll || 'Start'} to ${user.endRoll || 'End'})`,
    student: `STUDENT • ${user.academicYear || 'I Year'} • Dept: ${user.dept || 'Engineering'} - Sec ${user.yearSec || 'A'}`,
    boys_warden: 'WARDEN CLEARANCE • Boys Warden Portal',
    girls_warden: 'WARDEN CLEARANCE • Girls Warden Portal'
  };

  const roleSubtitle = document.getElementById('dashRoleSubtitle');
  if (roleSubtitle) roleSubtitle.innerText = subtitles[user.role] || '';

  const topPdfBtn = document.getElementById('topBulkPdfBtn');
  const topBulkLettersBtn = document.getElementById('topBulkLettersBtn');
  const studentView = document.getElementById('studentPersonalView');
  const authorityView = document.getElementById('authorityLogsView');
  const content = document.getElementById('roleDashboardContent');

  if (user.role === 'student') {
    if (topPdfBtn) topPdfBtn.classList.add('hidden');
    if (topBulkLettersBtn) topBulkLettersBtn.classList.add('hidden');
    if (studentView) studentView.classList.remove('hidden');
    if (authorityView) authorityView.classList.add('hidden');

    if (content) {
      content.innerHTML = `
        <div class="glass-panel border border-white/50 rounded-3xl p-6 space-y-4 shadow-md max-w-lg mx-auto">
          <h4 class="font-bold text-slate-800 text-sm">Apply for Institutional Gate Pass</h4>
          <p class="text-xs text-slate-600">Standing: <span class="font-bold text-red-600">${user.academicYear || 'I Year'}</span> | Sec: <span class="font-bold text-red-600">${user.yearSec || 'A'}</span></p>
          <textarea id="passReason" rows="3" placeholder="Enter reason (e.g. Medical emergency, urgent paper presentation, family event)..." class="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-red-500"></textarea>
          <button onclick="submitStudentPass('${user.userId}')" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition">Draft Official Letter & Submit</button>
        </div>
      `;
    }
    loadStudentPersonalStatus();
  } else {
    if (topPdfBtn) topPdfBtn.classList.remove('hidden');
    if (topBulkLettersBtn) topBulkLettersBtn.classList.remove('hidden');
    if (studentView) studentView.classList.add('hidden');
    if (authorityView) authorityView.classList.remove('hidden');

    if (user.role === 'counselor') {
      if (content) {
        content.innerHTML = `
          <div class="space-y-6">
            <div class="glass-panel border border-white/50 rounded-3xl p-5 shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div>
                <h4 class="font-bold text-slate-900 text-sm">Counseling Ward Jurisdiction</h4>
                <p class="text-xs text-slate-700 mt-0.5">Assigned Ward: <span class="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">${user.startRoll || 'Start'}</span> to <span class="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">${user.endRoll || 'End'}</span></p>
              </div>
              <form onsubmit="uploadCounselorExcel(event)" class="mb-0">
                <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border">
                  <span class="text-xs text-slate-500 font-bold">Import Student Batch:</span>
                  <input type="file" id="counselorFile" accept=".xlsx, .xls, .csv" class="text-xs" required />
                  <button type="submit" class="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold">Import</button>
                </div>
              </form>
            </div>

            <div class="glass-panel border border-white/50 rounded-3xl p-5 shadow-md space-y-4">
              <h4 class="font-bold text-slate-800 text-sm">Counselor Queue: Parent Phone Call Verification</h4>
              <div class="overflow-x-auto">
                <div id="counselorQueue"></div>
              </div>
            </div>
          </div>
        `;
      }
      fetchCounselorQueue();
    } else if (user.role === 'advisor') {
      if (content) {
        content.innerHTML = `
          <div class="glass-panel border border-white/50 rounded-3xl p-5 shadow-md space-y-4">
            <h4 class="font-bold text-slate-800 text-sm">Class Advisor Review Queue (${user.dept} - Section ${user.yearSec})</h4>
            <div class="overflow-x-auto">
              <div id="advisorQueue"></div>
            </div>
          </div>
        `;
      }
      fetchAdvisorQueue();
    } else if (user.role === 'hod') {
      if (content) {
        content.innerHTML = `
          <div class="glass-panel border border-white/50 rounded-3xl p-5 shadow-md space-y-4">
            <h4 class="font-bold text-slate-800 text-sm">Head of Department Queue (${user.dept} Department)</h4>
            <div class="overflow-x-auto">
              <div id="hodQueue"></div>
            </div>
          </div>
        `;
      }
      fetchHODQueue();
    } else if (user.role === 'principal') {
      if (content) {
        content.innerHTML = `
          <div class="glass-panel border border-white/50 rounded-3xl p-5 shadow-md space-y-4">
            <h4 class="font-bold text-slate-800 text-sm">Principal Final Clearance (Activates 20-Min Departure Gate Window)</h4>
            <div class="overflow-x-auto">
              <div id="principalQueue"></div>
            </div>
          </div>
        `;
      }
      fetchPrincipalQueue();
    } else if (user.role === 'boys_warden') {
      document.getElementById('boys_wardenDashboard')?.classList.remove('hidden');
      fetchBoysWardenQueue();
      fetchBoysReturnedStudents();
    } else if (user.role === 'girls_warden') {
      document.getElementById('girls_wardenDashboard')?.classList.remove('hidden');
      fetchGirlsWardenQueue();
      fetchGirlsReturnedStudents();
    }

    loadUniversalLogs();
  }
}

function refreshAllAuthorityViews() {
  if (!loggedUser) return;
  loadUniversalLogs();
  if (loggedUser.role === 'counselor') fetchCounselorQueue();
  if (loggedUser.role === 'advisor') fetchAdvisorQueue();
  if (loggedUser.role === 'hod') fetchHODQueue();
  if (loggedUser.role === 'principal') fetchPrincipalQueue();
  if (loggedUser.role === 'boys_warden') {
    document.getElementById('boys_wardenDashboard')?.classList.remove('hidden');
    fetchBoysWardenQueue();
    fetchBoysReturnedStudents();
  }
  if (loggedUser.role === 'girls_warden') {
    document.getElementById('girls_wardenDashboard')?.classList.remove('hidden');
    fetchGirlsWardenQueue();
    fetchGirlsReturnedStudents();
  }
}

function logout() {
  loggedUser = null;
  location.reload();
}
