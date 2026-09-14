/**
 * Dynamic Dashboard Orchestrator & View Controller
 * Unified 4-Section Architecture & Executive KPI Metrics
 * GRT Institute of Engineering and Technology
 */

let wardenAutoRefreshTimer = null;

function getAuthorityDashboardHTML(user, config) {
  return `
    <div class="space-y-6">
      ${config.extraHeaderHTML || ''}

      <!-- SINGLE SET: EXECUTIVE SECTION SELECTOR CARDS ROW -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="kpiCard_requests" class="kpi-card active-kpi-card flex items-center justify-between p-4 md:p-5 rounded-2xl bg-white border-2 border-red-600 shadow-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-95" onclick="switchAuthorityTab('requests')">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0 border border-amber-200 shadow-2xs">
              📋
            </div>
            <div>
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action</div>
              <div id="kpi_pending" class="text-2xl font-black text-slate-900 mt-0.5">0</div>
            </div>
          </div>
          <span id="authBadge_requests" class="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 shadow-2xs">Requests</span>
        </div>

        <div id="kpiCard_approved" class="kpi-card flex items-center justify-between p-4 md:p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:border-slate-300 opacity-90 hover:opacity-100 active:scale-95" onclick="switchAuthorityTab('approved')">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0 border border-emerald-200 shadow-2xs">
              ✅
            </div>
            <div>
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved by You</div>
              <div id="kpi_approved" class="text-2xl font-black text-emerald-800 mt-0.5">0</div>
            </div>
          </div>
          <span id="authBadge_approved" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">Approved</span>
        </div>

        <div id="kpiCard_rejected" class="kpi-card flex items-center justify-between p-4 md:p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:border-slate-300 opacity-90 hover:opacity-100 active:scale-95" onclick="switchAuthorityTab('rejected')">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center text-xl shrink-0 border border-rose-200 shadow-2xs">
              ❌
            </div>
            <div>
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Declined</div>
              <div id="kpi_rejected" class="text-2xl font-black text-rose-800 mt-0.5">0</div>
            </div>
          </div>
          <span id="authBadge_rejected" class="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">Rejected</span>
        </div>

        <div id="kpiCard_all" class="kpi-card flex items-center justify-between p-4 md:p-5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:border-slate-300 opacity-90 hover:opacity-100 active:scale-95" onclick="switchAuthorityTab('all')">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-xl shrink-0 border border-indigo-200 shadow-2xs">
              📑
            </div>
            <div>
              <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Records</div>
              <div id="kpi_total" class="text-2xl font-black text-slate-900 mt-0.5">0</div>
            </div>
          </div>
          <span id="authBadge_all" class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">All Records</span>
        </div>
      </div>

      <!-- SINGLE COMBINED SECTION MASTER CARD -->
      <div class="glass-panel rounded-3xl p-6 md:p-8 space-y-6">

        <!-- SECTION 1: LEAVE REQUESTS -->
        <div id="authSec_requests" class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <h3 class="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <span>📋 ${config.requestsTitle || 'Student Leave Requests'}</span>
                <span class="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Action Required</span>
              </h3>
              <p class="text-xs md:text-sm text-slate-500 font-medium mt-1">${config.requestsSubtitle || 'Leave applications waiting for your action.'}</p>
            </div>
            <button onclick="refreshAllAuthorityViews(); showToast('Dashboard records refreshed.', 'info', 2000);" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2 active:scale-95">
              <span>🔄 Refresh Data</span>
            </button>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <div id="${config.queueContainerId}"></div>
          </div>
        </div>

        <!-- SECTION 2: APPROVED -->
        <div id="authSec_approved" class="hidden space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <h3 class="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <span>✅ Approved Leave Applications</span>
                <span class="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Endorsed by You</span>
              </h3>
              <p class="text-xs md:text-sm text-slate-500 font-medium mt-1">Leave applications approved and endorsed at your authority level.</p>
            </div>
            <button onclick="refreshAllAuthorityViews(); showToast('Dashboard records refreshed.', 'info', 2000);" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2 active:scale-95">
              <span>🔄 Refresh Data</span>
            </button>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs" id="authorityApprovedContainer">
            <!-- Injected dynamically -->
          </div>
        </div>

        <!-- SECTION 3: REJECTED -->
        <div id="authSec_rejected" class="hidden space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <h3 class="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <span>❌ Rejected Leave Applications</span>
                <span class="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Declined Applications</span>
              </h3>
              <p class="text-xs md:text-sm text-slate-500 font-medium mt-1">Leave applications rejected with official reasons recorded.</p>
            </div>
            <button onclick="refreshAllAuthorityViews(); showToast('Dashboard records refreshed.', 'info', 2000);" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2 active:scale-95">
              <span>🔄 Refresh Data</span>
            </button>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs" id="authorityRejectedContainer">
            <!-- Injected dynamically -->
          </div>
        </div>

        <!-- SECTION 4: ALL RECORDS -->
        <div id="authSec_all" class="hidden space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            <div>
              <h3 class="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                <span>📑 All Records Archive</span>
                <span class="text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300/80 px-2.5 py-0.5 rounded-md uppercase tracking-wider">Complete History</span>
              </h3>
              <p class="text-xs md:text-sm text-slate-500 font-medium mt-1">Comprehensive audit trail of all student leave requisitions handled in your jurisdiction.</p>
            </div>
            <div class="flex items-center gap-2">
              <input type="text" id="authAllRecordsSearch" oninput="filterAuthorityAllRecords()" placeholder="🔍 Search name, roll no, reason..." class="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-medium w-64 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 shadow-2xs">
              <button onclick="refreshAllAuthorityViews(); showToast('Dashboard records refreshed.', 'info', 2000);" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2 active:scale-95">
                <span>🔄 Refresh</span>
              </button>
            </div>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs" id="authorityAllRecordsContainer">
            <!-- Injected dynamically -->
          </div>
        </div>

      </div>
    </div>
  `;
}

function openDashboard(user) {
  document.getElementById('authScreen')?.classList.add('hidden');
  document.getElementById('dashScreen')?.classList.remove('hidden');

  const greeting = document.getElementById('dashGreeting');
  if (greeting) greeting.innerText = `Welcome, ${user.name}`;

  const subtitles = {
    principal: 'EXECUTIVE DIRECTORATE • GRTIET Institution-Wide Clearance',
    hod: `HEAD OF DEPARTMENT • Department of ${user.dept}`,
    advisor: `CLASS ADVISOR • ${user.academicYear || '3 Year'} - ${user.dept} Sec ${user.yearSec}`,
    counselor: `CLASS COUNSELOR • Assigned Ward (${user.startRoll || 'Start'} to ${user.endRoll || 'End'})`,
    student: `STUDENT • ${user.academicYear || '3 Year'} • Dept: ${user.dept || 'Engineering'} - Sec ${user.yearSec || 'A'}`,
    boys_warden: 'HOSTEL WARDEN GOVERNANCE • Boys Hostel Clearance Portal',
    girls_warden: 'HOSTEL WARDEN GOVERNANCE • Girls Hostel Clearance Portal'
  };

  const roleSubtitle = document.getElementById('dashRoleSubtitle');
  if (roleSubtitle) roleSubtitle.innerText = subtitles[user.role] || '';

  const topPdfBtn = document.getElementById('topBulkPdfBtn');
  const topBulkLettersBtn = document.getElementById('topBulkLettersBtn');
  const clearDataBtn = document.getElementById('clearAllDataBtn');
  const studentView = document.getElementById('studentPersonalView');
  const content = document.getElementById('roleDashboardContent');

  // Reset any active warden timer
  if (wardenAutoRefreshTimer) {
    clearInterval(wardenAutoRefreshTimer);
    wardenAutoRefreshTimer = null;
  }

  // Reset tab to Section 1: requests
  currentAuthorityTab = 'requests';

  if (user.role === 'student') {
    if (topPdfBtn) topPdfBtn.classList.add('hidden');
    if (topBulkLettersBtn) topBulkLettersBtn.classList.add('hidden');
    if (clearDataBtn) clearDataBtn.classList.add('hidden');
    if (studentView) studentView.classList.remove('hidden');

    if (content) {
      content.innerHTML = `
        <div class="glass-panel rounded-3xl p-6 md:p-8 space-y-5 max-w-xl mx-auto">
          <div>
            <h4 class="font-bold text-slate-900 text-base md:text-lg">Apply for Institutional Gate Pass</h4>
            <p class="text-xs text-slate-500 mt-0.5">Please provide a clear, valid institutional reason for leaving campus.</p>
          </div>
          
          <div class="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <span>Academic Standing:</span>
            <span class="font-bold text-red-700">${user.academicYear || '3 Year'}</span>
            <span>•</span>
            <span>Dept:</span>
            <span class="font-bold text-red-700">${user.dept || 'Engineering'}</span>
            <span>•</span>
            <span>Sec:</span>
            <span class="font-bold text-red-700">${user.yearSec || 'A'}</span>
            <span>•</span>
            ${formatAccommodationBadge(user.accommodation)}
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Detailed Reason for Leave</label>
            <textarea id="passReason" rows="3" placeholder="State reason (e.g. Medical consultation, official technical symposium, urgent family obligation)..." class="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm focus:outline-none focus:border-red-600 focus:bg-white transition text-slate-800"></textarea>
          </div>

          <button onclick="submitStudentPass('${user.userId}')" class="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl text-xs md:text-sm shadow-sm transition active:scale-98 flex items-center justify-center gap-2">
            <span>📝 Draft Official Letter & Submit Application</span>
          </button>
        </div>
      `;
    }
    loadStudentPersonalStatus();
  } else {
    // All authorities (Counselor, Advisor, HOD, Principal, Warden)
    if (studentView) studentView.classList.add('hidden');
    if (topPdfBtn) topPdfBtn.classList.remove('hidden');
    if (topBulkLettersBtn) topBulkLettersBtn.classList.remove('hidden');
    if (clearDataBtn) clearDataBtn.classList.remove('hidden');

    if (user.role === 'counselor') {
      const counselorConfig = {
        requestsTabLabel: 'Student Leave Requests',
        requestsTitle: 'Counselor Queue: Parent Phone Call Verification',
        requestsSubtitle: 'Call parent to verify before approving and forwarding to Class Advisor.',
        queueContainerId: 'counselorQueue',
        extraHeaderHTML: `
          <div class="glass-panel rounded-3xl p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
            <div class="space-y-1">
              <h4 class="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>📋 Counseling Ward Jurisdiction</span>
              </h4>
              <p class="text-xs md:text-sm text-slate-600">Assigned Ward: <span class="font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300 text-emerald-800">${user.startRoll || 'Start'}</span> to <span class="font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300 text-emerald-800">${user.endRoll || 'End'}</span></p>
            </div>
            <form onsubmit="uploadCounselorExcel(event)" class="mb-0">
              <div class="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
                <span class="text-xs text-slate-600 font-bold">Import Batch:</span>
                <input type="file" id="counselorFile" accept=".xlsx, .xls, .csv" class="text-xs text-slate-600" required />
                <button type="submit" class="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition">Import</button>
              </div>
            </form>
          </div>
        `
      };
      if (content) content.innerHTML = getAuthorityDashboardHTML(user, counselorConfig);
    } else if (user.role === 'advisor') {
      const advisorConfig = {
        requestsTabLabel: 'Leave Requests',
        requestsTitle: `Class Advisor Review Queue (${user.dept} - Section ${user.yearSec})`,
        requestsSubtitle: 'Students pre-verified by counselors awaiting Class Advisor review and forwarding to HOD.',
        queueContainerId: 'advisorQueue',
        extraHeaderHTML: `
          <div class="glass-panel rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div class="space-y-1">
              <h4 class="font-bold text-slate-900 text-base">Class Advisory Jurisdiction</h4>
              <p class="text-xs md:text-sm text-slate-600 font-mono">Department: <span class="font-bold text-red-700">${user.dept}</span> • Section: <span class="font-bold text-red-700">${user.yearSec}</span> • Academic Year: <span class="font-bold text-red-700">${user.academicYear || '3 Year'}</span></p>
            </div>
          </div>
        `
      };
      if (content) content.innerHTML = getAuthorityDashboardHTML(user, advisorConfig);
    } else if (user.role === 'hod') {
      const hodConfig = {
        requestsTabLabel: 'Leave Requests',
        requestsTitle: `Head of Department Queue (${user.dept} Department)`,
        requestsSubtitle: 'Requests endorsed by Class Advisors awaiting Department Head authorization.',
        queueContainerId: 'hodQueue',
        extraHeaderHTML: `
          <div class="glass-panel rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div class="space-y-1">
              <h4 class="font-bold text-slate-900 text-base">Department Head Authority</h4>
              <p class="text-xs md:text-sm text-slate-600 font-mono">Department: <span class="font-bold text-purple-700">${user.dept} Engineering</span></p>
            </div>
          </div>
        `
      };
      if (content) content.innerHTML = getAuthorityDashboardHTML(user, hodConfig);
    } else if (user.role === 'principal') {
      const principalConfig = {
        requestsTabLabel: 'Leave Requests',
        requestsTitle: 'Principal Directorate Final Clearance',
        requestsSubtitle: 'College-wide outpass requisitions for Executive Directorate approval (Activates 20-min departure window / routes to Hostel Warden).',
        queueContainerId: 'principalQueue',
        extraHeaderHTML: `
          <div class="glass-panel rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div class="space-y-1">
              <h4 class="font-bold text-slate-900 text-base">Executive Directorate Authority</h4>
              <p class="text-xs md:text-sm text-slate-600 font-mono">Institution-Wide Governance • Final Clearance Engine</p>
            </div>
          </div>
        `
      };
      if (content) content.innerHTML = getAuthorityDashboardHTML(user, principalConfig);
    } else if (user.role === 'boys_warden' || user.role === 'girls_warden') {
      const isFemale = user.role === 'girls_warden';
      const wardenConfig = {
        requestsTabLabel: 'Leave Requests',
        requestsTitle: `${isFemale ? 'Girls' : 'Boys'} Hostel Student Leave Requests`,
        requestsSubtitle: `Approved leave requests received after Principal approval for ${isFemale ? 'Girls' : 'Boys'} Hostel clearance.`,
        queueContainerId: 'wardenRequestsTableContainer',
        extraHeaderHTML: `
          <div class="glass-panel rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
            <div class="space-y-1">
              <h4 class="font-bold text-slate-900 text-base">${isFemale ? 'Girls' : 'Boys'} Hostel Warden Governance</h4>
              <p class="text-xs md:text-sm text-slate-600 font-mono">${isFemale ? 'Female' : 'Male'} Hostellers Only • Gate Window & Leave Governance</p>
            </div>
          </div>
        `
      };
      if (content) content.innerHTML = getAuthorityDashboardHTML(user, wardenConfig);

      // Auto-refresh warden view every 3.5s for live QR scanning
      wardenAutoRefreshTimer = setInterval(() => {
        if (loggedUser && (loggedUser.role === 'boys_warden' || loggedUser.role === 'girls_warden')) {
          refreshAllAuthorityViews();
        }
      }, 3500);
    }

    refreshAllAuthorityViews();
  }
}

function refreshAllAuthorityViews() {
  if (!loggedUser) return;
  if (loggedUser.role === 'counselor') fetchCounselorQueue();
  if (loggedUser.role === 'advisor') fetchAdvisorQueue();
  if (loggedUser.role === 'hod') fetchHODQueue();
  if (loggedUser.role === 'principal') fetchPrincipalQueue();
  if (loggedUser.role === 'boys_warden' || loggedUser.role === 'girls_warden') {
    fetchWardenLeaveRequests(loggedUser.role);
  }
  loadUniversalLogs();
}

function logout() {
  showConfirmModal({
    title: 'Sign Out of Portal?',
    message: 'Are you sure you want to end your current session and return to the portal selection hub?',
    confirmText: 'Sign Out',
    confirmColor: 'blue',
    onConfirm: () => {
      if (wardenAutoRefreshTimer) {
        clearInterval(wardenAutoRefreshTimer);
        wardenAutoRefreshTimer = null;
      }
      loggedUser = null;
      location.reload();
    }
  });
}

window.openDashboard = openDashboard;
window.refreshAllAuthorityViews = refreshAllAuthorityViews;
window.logout = logout;

