/**
 * Authentication, PIN Verification & Registration Module
 */

let activeRole = '';
let requiredPin = '';
let isLoginMode = true;
let loggedUser = null;

function requestUnlock(role, title, pin) {
  activeRole = role;
  requiredPin = pin;

  // Hide the selection hub
  const selectionScreen = document.getElementById('portalSelectionScreen');
  if (selectionScreen) selectionScreen.classList.add('hidden');

  // Open PIN verification modal
  const modalTitle = document.getElementById('unlockModalTitle');
  const codeInput = document.getElementById('unlockCodeInput');
  const unlockModal = document.getElementById('unlockModal');

  if (modalTitle) modalTitle.innerText = `${title} Access`;
  if (codeInput) {
    codeInput.value = '';
    codeInput.focus();
  }
  if (unlockModal) unlockModal.classList.remove('hidden');
}

function closeUnlockModal() {
  const unlockModal = document.getElementById('unlockModal');
  const selectionScreen = document.getElementById('portalSelectionScreen');

  if (unlockModal) unlockModal.classList.add('hidden');
  if (selectionScreen) selectionScreen.classList.remove('hidden');
}

function verifyUnlockCode() {
  const inputVal = document.getElementById('unlockCodeInput')?.value.trim();
  if (inputVal === requiredPin) {
    closeUnlockModal();
    openAuthScreen();
    showToast('Security PIN verified. Welcome to portal authentication.', 'success', 2500);
  } else {
    showToast('Invalid Access PIN. Please enter the authorized 4-digit PIN.', 'error', 3500);
    const input = document.getElementById('unlockCodeInput');
    if (input) {
      input.classList.add('border-rose-500', 'bg-rose-50');
      setTimeout(() => input.classList.remove('border-rose-500', 'bg-rose-50'), 1500);
    }
  }
}

function clearAuthInputs() {
  const userId = document.getElementById('userId');
  const userPass = document.getElementById('userPass');
  const userName = document.getElementById('userName');
  const userStartRoll = document.getElementById('userStartRoll');
  const userEndRoll = document.getElementById('userEndRoll');

  if (userId) userId.value = '';
  if (userPass) userPass.value = '';
  if (userName) userName.value = '';
  if (userStartRoll) userStartRoll.value = '';
  if (userEndRoll) userEndRoll.value = '';
}

async function updateSingleRoleRegistrationStatus() {
  const tabR = document.getElementById('tabRegister');
  const alertBox = document.getElementById('duplicateRoleAlert');

  if (!tabR) return false;

  if (['boys_warden', 'girls_warden', 'principal'].includes(activeRole)) {
    try {
      const data = await Api.get(`/api/auth/check-role-exists?role=${encodeURIComponent(activeRole)}`);
      if (data.exists) {
        tabR.classList.add('hidden');
        if (alertBox) {
          const title = activeRole === 'boys_warden' ? 'Boys Warden' : (activeRole === 'girls_warden' ? 'Girls Warden' : 'Principal');
          alertBox.innerHTML = `🔒 <b>Single Authority Position:</b> The ${title} account is already registered by <b>${data.registeredName}</b>. Registration is closed. Please log in using your registered credentials.`;
          alertBox.classList.remove('hidden');
        }
        if (!isLoginMode) {
          toggleAuth(true);
        }
        return true;
      } else {
        tabR.classList.remove('hidden');
        if (alertBox) alertBox.classList.add('hidden');
        return false;
      }
    } catch (err) {
      console.error('Role check error:', err);
      return false;
    }
  } else {
    tabR.classList.remove('hidden');
    if (alertBox) alertBox.classList.add('hidden');
  }
  return false;
}

async function openAuthScreen() {
  document.getElementById('portalSelectionScreen')?.classList.add('hidden');
  document.getElementById('authScreen')?.classList.remove('hidden');
  
  const badge = document.getElementById('activeRoleBadge');
  const roleDisplayNames = {
    'boys_warden': 'BOYS WARDEN',
    'girls_warden': 'GIRLS WARDEN',
    'principal': 'PRINCIPAL OFFICE',
    'hod': 'DEPT HOD',
    'advisor': 'CLASS ADVISOR',
    'counselor': 'CLASS COUNSELOR',
    'student': 'STUDENT'
  };
  if (badge) badge.innerText = roleDisplayNames[activeRole] || activeRole.toUpperCase();

  const idLabel = document.getElementById('userIdLabel');
  const idInput = document.getElementById('userId');
  if (idLabel && idInput) {
    if (activeRole === 'student') {
      idLabel.innerText = 'Student Roll Number';
      idInput.placeholder = 'e.g. 110324104107';
    } else {
      idLabel.innerText = 'Staff / Faculty ID';
      idInput.placeholder = 'e.g. GRT_STAFF01';
    }
  }

  const tabR = document.getElementById('tabRegister');
  const alertBox = document.getElementById('duplicateRoleAlert');
  if (tabR) tabR.classList.remove('hidden');
  if (alertBox) alertBox.classList.add('hidden');

  clearAuthInputs();
  toggleAuth(true);

  if (['boys_warden', 'girls_warden', 'principal'].includes(activeRole)) {
    await updateSingleRoleRegistrationStatus();
  }
}

function backToPortals() {
  clearAuthInputs();
  const alertBox = document.getElementById('duplicateRoleAlert');
  if (alertBox) alertBox.classList.add('hidden');
  const tabR = document.getElementById('tabRegister');
  if (tabR) tabR.classList.remove('hidden');
  document.getElementById('authScreen')?.classList.add('hidden');
  document.getElementById('portalSelectionScreen')?.classList.remove('hidden');
}

async function checkRoleAvailability() {
  if (isLoginMode) return;
  if (activeRole === 'student') return;

  const dept = document.getElementById('userDept')?.value || 'CSE';
  const yearSec = document.getElementById('userYearSec')?.value || 'A';
  const startRoll = document.getElementById('userStartRoll')?.value.trim() || '';
  const endRoll = document.getElementById('userEndRoll')?.value.trim() || '';
  const alertBox = document.getElementById('duplicateRoleAlert');
  const submitBtn = document.getElementById('authSubmitBtn');

  try {
    let qUrl = `/api/auth/check-role-exists?role=${encodeURIComponent(activeRole)}&dept=${encodeURIComponent(dept)}&yearSec=${encodeURIComponent(yearSec)}`;
    if (activeRole === 'counselor' && startRoll && endRoll) {
      qUrl += `&startRoll=${encodeURIComponent(startRoll)}&endRoll=${encodeURIComponent(endRoll)}`;
    }

    const data = await Api.get(qUrl);

    if (data.exists) {
      if (activeRole === 'counselor') {
        alertBox.innerHTML = `⚠️ Ward Conflict: The selected range (${startRoll} to ${endRoll}) overlaps with students already claimed by Counselor <b>${data.conflictCounselor}</b> (${data.registeredRange}). You cannot register these students.`;
      } else {
        const title = activeRole === 'boys_warden' ? 'Boys Warden' : (activeRole === 'girls_warden' ? 'Girls Warden' : (activeRole === 'principal' ? 'Principal' : activeRole.toUpperCase()));
        alertBox.innerHTML = `⚠️ Position Filled: The ${title} position is already registered by ${data.registeredName}. Registration is not allowed.`;
      }
      alertBox.classList.remove('hidden');
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      alertBox.classList.add('hidden');
      submitBtn.disabled = false;
      submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  } catch (err) {
    console.error('Role check failure:', err);
  }
}

async function toggleAuth(login) {
  const tabR = document.getElementById('tabRegister');

  // Prevent switching to register if single-instance role is already registered
  if (!login && ['boys_warden', 'girls_warden', 'principal'].includes(activeRole)) {
    try {
      const data = await Api.get(`/api/auth/check-role-exists?role=${encodeURIComponent(activeRole)}`);
      if (data.exists) {
        const title = activeRole === 'boys_warden' ? 'Boys Warden' : (activeRole === 'girls_warden' ? 'Girls Warden' : 'Principal');
        showToast(`Registration Blocked: A ${title} account is already registered (${data.registeredName}). Only Login is permitted.`, 'warning', 4000);
        if (tabR) tabR.classList.add('hidden');
        return;
      }
    } catch (e) {}
  }

  isLoginMode = login;
  clearAuthInputs();
  const tabL = document.getElementById('tabLogin');
  const nameF = document.getElementById('nameField');
  const acadF = document.getElementById('academicDetails');
  const counselorRollF = document.getElementById('counselorRollRangeContainer');
  const btn = document.getElementById('authSubmitBtn');
  const alertBox = document.getElementById('duplicateRoleAlert');

  if (alertBox && login) {
    if (!['boys_warden', 'girls_warden', 'principal'].includes(activeRole)) {
      alertBox.classList.add('hidden');
    }
  }
  if (btn) {
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  if (login) {
    if (tabL) tabL.className = 'flex-1 py-2 text-xs font-bold rounded-xl bg-white text-slate-900 shadow-sm';
    if (tabR) tabR.className = 'flex-1 py-2 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-900';
    if (nameF) nameF.classList.add('hidden');
    if (acadF) acadF.classList.add('hidden');
    document.getElementById('studentYearField')?.classList.add('hidden');
    document.getElementById('accommodationField')?.classList.add('hidden');
    document.getElementById('genderField')?.classList.add('hidden');
    if (counselorRollF) counselorRollF.classList.add('hidden');
    if (btn) btn.innerText = 'Login';
  } else {
    if (tabR) tabR.className = 'flex-1 py-2 text-xs font-bold rounded-xl bg-white text-slate-900 shadow-sm';
    if (tabL) tabL.className = 'flex-1 py-2 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-900';
    if (nameF) nameF.classList.remove('hidden');

    if (activeRole === 'student') {
      document.getElementById('studentYearField')?.classList.remove('hidden');
      document.getElementById('accommodationField')?.classList.remove('hidden');
      document.getElementById('genderField')?.classList.remove('hidden');
      if (acadF) acadF.classList.remove('hidden');
      if (counselorRollF) counselorRollF.classList.add('hidden');
    } else if (activeRole === 'counselor') {
      if (acadF) acadF.classList.add('hidden');
      document.getElementById('studentYearField')?.classList.add('hidden');
      document.getElementById('accommodationField')?.classList.add('hidden');
      document.getElementById('genderField')?.classList.add('hidden');
      if (counselorRollF) counselorRollF.classList.remove('hidden');
    } else if (activeRole === 'advisor') {
      if (acadF) acadF.classList.remove('hidden');
      document.getElementById('studentYearField')?.classList.add('hidden');
      document.getElementById('accommodationField')?.classList.add('hidden');
      document.getElementById('genderField')?.classList.add('hidden');
      if (counselorRollF) counselorRollF.classList.add('hidden');
    } else if (activeRole === 'hod') {
      if (acadF) acadF.classList.remove('hidden');
      document.getElementById('sectionContainer')?.classList.add('hidden');
      document.getElementById('studentYearField')?.classList.add('hidden');
      document.getElementById('accommodationField')?.classList.add('hidden');
      document.getElementById('genderField')?.classList.add('hidden');
      if (counselorRollF) counselorRollF.classList.add('hidden');
    } else {
      if (acadF) acadF.classList.add('hidden');
      document.getElementById('studentYearField')?.classList.add('hidden');
      document.getElementById('accommodationField')?.classList.add('hidden');
      document.getElementById('genderField')?.classList.add('hidden');
      if (counselorRollF) counselorRollF.classList.add('hidden');
    }
    if (btn) btn.innerText = 'Register';
    checkRoleAvailability();
  }
}

async function handleAuthSubmit() {
  const userId = document.getElementById('userId')?.value.trim();
  const password = document.getElementById('userPass')?.value.trim();

  if (!userId || !password) {
    return showToast('Please enter both your User ID and Password.', 'warning', 3000);
  }

  if (isLoginMode) {
    try {
      const data = await Api.post('/api/auth/login', { userId, password });
      if (data.success) {
        if (data.user.role !== activeRole && !(data.user.role.includes('warden') && activeRole.includes('warden'))) {
          return showToast(`Access Denied: Registered as ${data.user.role.toUpperCase()}, but you are on the ${activeRole.toUpperCase()} portal.`, 'error', 4000);
        }
        loggedUser = data.user;
        showToast(`Welcome back, ${data.user.name}!`, 'success', 2500);
        openDashboard(data.user);
      } else {
        showToast(data.message || 'Authentication failed. Please check credentials.', 'error', 3500);
      }
    } catch (err) {
      showToast('Login server error. Please try again.', 'error', 3500);
    }
  } else {
    const name = document.getElementById('userName')?.value.trim();
    const dept = document.getElementById('userDept')?.value || 'CSE';
    const yearSec = document.getElementById('userYearSec')?.value || 'A';
    const academicYear = document.getElementById('userAcademicYear')?.value || 'III Year';
    const accommodation = document.getElementById('userAccommodation')?.value || 'Day Scholar';
    const gender = document.getElementById('userGender')?.value || 'Male';
    const startRoll = document.getElementById('userStartRoll')?.value.trim() || '';
    const endRoll = document.getElementById('userEndRoll')?.value.trim() || '';

    if (!name) {
      return showToast('Please enter your full official name.', 'warning', 3000);
    }

    try {
      const data = await Api.post('/api/auth/register', {
        userId,
        password,
        name,
        role: activeRole,
        dept,
        yearSec,
        academicYear,
        accommodation,
        gender,
        startRoll,
        endRoll
      });
      if (data.success) {
        showToast(data.message || 'Account registered successfully! Please log in.', 'success', 3500);
        clearAuthInputs();
        toggleAuth(true);
        if (['boys_warden', 'girls_warden', 'principal'].includes(activeRole)) {
          await updateSingleRoleRegistrationStatus();
        }
      } else {
        showToast(data.message || 'Registration failed.', 'error', 3500);
      }
    } catch (err) {
      showToast('Registration request failed.', 'error', 3500);
    }
  }
}
