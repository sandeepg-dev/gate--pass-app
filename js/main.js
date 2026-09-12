/**
 * Main Application Orchestrator & Window Global Bindings
 */

// Dismiss splash screen after 2 seconds
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 800);
    }
  }, 2000);
});

// Periodic background synchronization (every 8 seconds when active session exists)
setInterval(() => {
  if (typeof loggedUser !== 'undefined' && loggedUser) {
    if (loggedUser.role === 'student') {
      loadStudentPersonalStatus();
    } else {
      refreshAllAuthorityViews();
    }
  }
}, 8000);

// Explicitly bind all interface functions to window for HTML onclick / onsubmit compatibility
window.requestUnlock = requestUnlock;
window.closeUnlockModal = closeUnlockModal;
window.verifyUnlockCode = verifyUnlockCode;
window.openAuthScreen = openAuthScreen;
window.backToPortals = backToPortals;
window.toggleAuth = toggleAuth;
window.checkRoleAvailability = checkRoleAvailability;
window.handleAuthSubmit = handleAuthSubmit;
window.openDashboard = openDashboard;
window.refreshAllAuthorityViews = refreshAllAuthorityViews;
window.submitStudentPass = submitStudentPass;
window.loadStudentPersonalStatus = loadStudentPersonalStatus;
window.fetchCounselorQueue = fetchCounselorQueue;
window.verifyCounselorPass = verifyCounselorPass;
window.uploadCounselorExcel = uploadCounselorExcel;
window.fetchAdvisorQueue = fetchAdvisorQueue;
window.approveAdvisorPass = approveAdvisorPass;
window.fetchHODQueue = fetchHODQueue;
window.approveHODPass = approveHODPass;
window.fetchPrincipalQueue = fetchPrincipalQueue;
window.approveGenericPass = approveGenericPass;
window.generateWardenGatePass = generateWardenGatePass;
window.fetchBoysWardenQueue = fetchBoysWardenQueue;
window.approveBoysWardenPass = approveBoysWardenPass;
window.fetchBoysReturnedStudents = fetchBoysReturnedStudents;
window.fetchGirlsWardenQueue = fetchGirlsWardenQueue;
window.approveGirlsWardenPass = approveGirlsWardenPass;
window.fetchGirlsReturnedStudents = fetchGirlsReturnedStudents;
window.loadUniversalLogs = loadUniversalLogs;
window.viewFormalLetter = viewFormalLetter;
window.closeLetterModal = closeLetterModal;
window.formatRemainingTime = formatRemainingTime;
window.formatClassSection = formatClassSection;
window.downloadMasterPDF = downloadMasterPDF;
window.downloadAllCompleteLettersPDF = downloadAllCompleteLettersPDF;
window.downloadOfficialLetterOnlyPDF = downloadOfficialLetterOnlyPDF;
window.downloadSinglePassPDF = downloadSinglePassPDF;
window.logout = logout;
window.escapeHtml = escapeHtml;
window.escapeAttr = escapeAttr;
