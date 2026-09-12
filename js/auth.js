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
  } else {
    alert('❌ Invalid Access PIN');
  }
}

function openAuthScreen() {
  document.getElementById('portalSelectionScreen')?.classList.add('hidden');
  document.getElementById('authScreen')?.classList.remove('hidden');
  
  const badge = document.getElementById('activeRoleBadge');
  if (badge) badge.innerText = activeRole.toUpperCase();

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

  toggleAuth(true);
}

function backToPortals() {
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
        alertBox.innerHTML = `⚠️ Position Filled: The ${activeRole.toUpperCase()} position is already registered by ${data.registeredName}.`;
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

function toggleAuth(login) {
  isLoginMode = login;
  const tabL = document.getElementById('tabLogin');
  const tabR = document.getElementById('tabRegister');
  const nameF = document.getElementById('nameField');
  const acadF = document.getElementById('academicDetails');
  const counselorRollF = document.getElementById('counselorRollRangeContainer');
  const btn = document.getElementById('authSubmitBtn');
  const alertBox = document.getElementById('duplicateRoleAlert');

  if (alertBox) alertBox.classList.add('hidden');
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

  if (!userId || !password) return alert('Fill all credentials');

  if (isLoginMode) {
    try {
      const data = await Api.post('/api/auth/login', { userId, password });
      if (data.success) {
        if (data.user.role !== activeRole && !(data.user.role.includes('warden') && activeRole.includes('warden'))) {
          return alert(`Access Denied! This account is registered as ${data.user.role.toUpperCase()}, but you are on the ${activeRole.toUpperCase()} portal.`);
        }
        loggedUser = data.user;
        openDashboard(data.user);
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Login error. Please try again.');
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

    if (!name) return alert('Name is required');

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
      alert(data.message);
      if (data.success) toggleAuth(true);
    } catch (err) {
      alert('Registration request failed.');
    }
  }
}
