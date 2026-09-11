const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

const app = express();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:AdminPass123@cluster0.gpgplkf.mongodb.net/gatepass?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas / Local Database'))
  .catch(err => {
    console.error('❌ MongoDB Connection Failure:', err.message);
    process.exit(1);
  });

const ROLE_PINS = {
  student: '1111',
  counselor: '2222',
  advisor: '3333',
  hod: '4444',
  principal: '5555'
};

function getISTTimeString(date = new Date()) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function extractSection(val) {
  if (!val) return 'A';
  const clean = String(val).trim().toUpperCase();
  const match = clean.match(/(?:SEC|SECTION)?\s*([A-D])\b/) || clean.match(/\b([A-D])\b/);
  return match ? match[1] : 'A';
}

function extractYear(val) {
  if (!val) return '3 Year';
  const clean = String(val).trim().toUpperCase();
  if (clean.includes('IV') || clean === '4') return '4 Year';
  if (clean.includes('III') || clean === '3') return '3 Year';
  if (clean.includes('II') || clean === '2') return '2 Year';
  if (clean.includes('I') || clean === '1') return '1 Year';
  return clean;
}

function extractRollNumber(val) {
  if (!val) return 0n;
  const digits = String(val).replace(/\D/g, '');
  try {
    return digits ? BigInt(digits) : 0n;
  } catch {
    return 0n;
  }
}

function generateFormalLetter(student, rawReason = '', appliedTimeStr = '') {
  const timeInfo = appliedTimeStr || getISTTimeString();
  return `GRT INSTITUTE OF ENGINEERING AND TECHNOLOGY, TIRUTTANI
(AN AUTONOMOUS INSTITUTION)
FORMAL LEAVE & CAMPUS CLEARANCE APPLICATION

Date & Submission Time: ${timeInfo}

From:
${student.name || 'Student'}
Roll Number: ${student.rollNo}
Academic Standing: ${student.academicYear || '3 Year'} | Department: ${student.dept || 'Engineering'} | Section: ${student.yearSec || 'A'}
Student Contact: ${student.mobile || '-'} | Verified Parent Contact: ${student.parentContact || '-'}

Through:
1. Assigned Class Counselor (${student.counselorName || 'Counselor'})
2. Respective Class Advisor
3. Head of Department (HOD - ${student.dept || 'Engineering'})

To:
The Principal / Directorate,
GRT Institute of Engineering and Technology, Tiruttani.

Respected Sir/Madam,

Subject: Requisition for authorized campus gate outpass / leave clearance - reg.

I humbly submit this application seeking permission to leave the college campus due to the following legitimate necessity:

"${String(rawReason).trim()}"

I have duly informed my parents, and their phone number (${student.parentContact || '-'}) is submitted for institutional phone verification. I assure compliance with all institutional decorum and will report back promptly upon completion.

Yours obediently,
${student.name || 'Student'}
(Roll No: ${student.rollNo})`;
}

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'counselor', 'advisor', 'hod', 'principal','boys_warden','girls warden'] },
  academicYear: { type: String, default: '3 Year' },
  dept: { type: String, default: 'CSE', uppercase: true, trim: true },
  accommodation: { type: String, default: 'Day Scholar' },
  yearSec: { type: String, default: 'A', uppercase: true, trim: true },
  startRoll: { type: String, default: '', trim: true },
  endRoll: { type: String, default: '', trim: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const StudentSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  academicYear: { type: String, default: '3 Year' },
  accommodation: { type: String, default: 'Day Scholar' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  dept: { type: String, required: true, uppercase: true, trim: true },
  yearSec: { type: String, default: 'A', uppercase: true, trim: true },
  counselorName: { type: String, default: 'Class Counselor', trim: true },
  mobile: { type: String, default: '-' },
  parentContact: { type: String, required: true, trim: true },
  email: { type: String, default: '-' },
  address: { type: String, default: 'GRT College Campus' }
});
const Student = mongoose.model('Student', StudentSchema);

const PassSchema = new mongoose.Schema({
  rollNo: { type: String, required: true, index: true, uppercase: true, trim: true },
  name: String,
  academicYear: { type: String, default: '3 Year' },
  dept: { type: String, uppercase: true, index: true },
  yearSec: { type: String, uppercase: true, index: true },
  counselorName: { type: String, index: true },
  mobile: String,
  parentContact: String,
  email: String,
  address: String,
  reason: { type: String, required: true },
  formalLetter: { type: String, default: '' },
  
 status: {
  type: String,
  enum: ['Pending Counselor', 'Pending Advisor', 'Pending HOD', 'Pending Principal', 'Pending Boys Warden', 'Pending Girls Warden', 'Approved', 'Exited', 'Returned', 'Expired', 'Rejected'],
  default: 'Pending Counselor',
  index: true
},
  appliedTime: { type: String, default: () => getISTTimeString() },
  parentCalledBy: { type: String, default: '-' },
  parentCallVerified: { type: Boolean, default: false },
  parentCallTime: { type: String, default: '-' },

  counselorApproval: { counselorName: String, approved: { type: Boolean, default: false }, time: String },
  advisorApproval: { advisorName: String, approved: { type: Boolean, default: false }, time: String },
  hodApproval: { hodName: String, approved: { type: Boolean, default: false }, time: String },
  principalApproval: { approved: { type: Boolean, default: false }, time: String },

  approvalTime: String,
  validUntil: String,
  expiresAt: { type: Date, index: true },
  exitStatus: { type: String, default: 'Inside Campus' },
  exitTime: { type: String, default: '-' },
  createdAt: { type: Date, default: Date.now, index: true }
});
const Pass = mongoose.model('Pass', PassSchema);

// --- APIs ---

// Check duplicate roles and counselor roll range overlap
app.get('/api/auth/check-role-exists', async (req, res) => {
  try {
    const { role, dept, yearSec, startRoll, endRoll } = req.query;
    
    if (role === 'principal') {
      const exists = await User.findOne({ role: 'principal' });
      return res.json({ exists: !!exists, registeredName: exists ? exists.name : '' });
    }
    if (role === 'hod' && dept) {
      const exists = await User.findOne({ role: 'hod', dept: dept.toUpperCase().trim() });
      return res.json({ exists: !!exists, registeredName: exists ? exists.name : '' });
    }
    if (role === 'advisor' && dept && yearSec) {
      const secLetter = extractSection(yearSec);
      const exists = await User.findOne({ role: 'advisor', dept: dept.toUpperCase().trim(), yearSec: secLetter });
      return res.json({ exists: !!exists, registeredName: exists ? exists.name : '' });
    }
    if (role === 'counselor' && startRoll && endRoll) {
      const sVal = extractRollNumber(startRoll);
      const eVal = extractRollNumber(endRoll);
      if (sVal > 0n && eVal > 0n && sVal <= eVal) {
        const counselors = await User.find({ role: 'counselor' });
        for (const c of counselors) {
          const cs = extractRollNumber(c.startRoll);
          const ce = extractRollNumber(c.endRoll);
          if (cs > 0n && ce > 0n) {
            const maxStart = sVal > cs ? sVal : cs;
            const minEnd = eVal < ce ? eVal : ce;
            if (maxStart <= minEnd) {
              return res.json({
                exists: true,
                conflictCounselor: c.name,
                registeredRange: `${c.startRoll} to ${c.endRoll}`
              });
            }
          }
        }
      }
    }
    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
   const { userId, name, password, role, dept, yearSec, academicYear, startRoll, endRoll, accommodation } = req.body;
   const cleanAccom = accommodation || 'Day Scholar';
    if (!userId || !password || !name || !role) {
      return res.status(400).json({ success: false, message: 'All mandatory credentials must be provided.' });
    }

    const cleanId = userId.trim().toLowerCase();
    const cleanDept = (dept || 'CSE').trim().toUpperCase();
    const cleanSec = extractSection(yearSec || 'A');
    const cleanYear = extractYear(academicYear || '3 Year');

    const existingUser = await User.findOne({ userId: cleanId });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User ID already registered. Please log in.' });
    }

    if (role === 'principal') {
      const existing = await User.findOne({ role: 'principal' });
      if (existing) {
        return res.status(400).json({ success: false, message: `The Principal position is already registered college-wide by ${existing.name}.` });
      }
    }

    if (role === 'hod') {
      const existing = await User.findOne({ role: 'hod', dept: cleanDept });
      if (existing) {
        return res.status(400).json({ success: false, message: `HOD for ${cleanDept} is already registered by ${existing.name}.` });
      }
    }

    if (role === 'advisor') {
      const existing = await User.findOne({ role: 'advisor', dept: cleanDept, yearSec: cleanSec });
      if (existing) {
        return res.status(400).json({ success: false, message: `Advisor for ${cleanDept} Sec ${cleanSec} is already registered by ${existing.name}.` });
      }
    }

    if (role === 'counselor') {
      const sVal = extractRollNumber(startRoll);
      const eVal = extractRollNumber(endRoll);
      if (sVal === 0n || eVal === 0n || sVal > eVal) {
        return res.status(400).json({ success: false, message: 'Please provide a valid numeric roll number range for the counselor.' });
      }

      const counselors = await User.find({ role: 'counselor' });
      for (const c of counselors) {
        const cs = extractRollNumber(c.startRoll);
        const ce = extractRollNumber(c.endRoll);
        if (cs > 0n && ce > 0n) {
          const maxStart = sVal > cs ? sVal : cs;
          const minEnd = eVal < ce ? eVal : ce;
          if (maxStart <= minEnd) {
            return res.status(400).json({ success: false, message: `Roll range overlaps with existing counselor ${c.name} (${c.startRoll} - ${c.endRoll}).` });
          }
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const newUser = new User({
      userId: cleanId,
      name: name.trim(),
      password: hashedPassword,
      role,
      academicYear: cleanYear,
      accommodation: cleanAccom,
      dept: cleanDept,
      yearSec: cleanSec,
      startRoll: (startRoll || '').trim(),
      endRoll: (endRoll || '').trim()
    });

    await newUser.save();

    if (role === 'student') {
      await Student.findOneAndUpdate(
        { rollNo: cleanId.toUpperCase() },
        {
          rollNo: cleanId.toUpperCase(),
          name: name.trim(),
          academicYear: cleanYear,
          accommodation: cleanAccom,
          dept: cleanDept,
          yearSec: cleanSec,
          parentContact: '-'
        },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Registration successful! Please log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'Provide both ID and Password.' });
    }

    const cleanId = userId.trim().toLowerCase();
    const user = await User.findOne({ userId: cleanId });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Roll Number / Staff ID or Password.' });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Roll Number / Staff ID or Password.' });
    }

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ success: true, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Excel Roster Upload
app.post('/api/upload-students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Please select an Excel file" });
    const { dept, counselorName, academicYear } = req.body;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: '' });

    let headerIdx = rows.findIndex(r => r.some(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, '').includes('roll')));
    if (headerIdx === -1) headerIdx = 0;

    const rawHeaders = rows[headerIdx].map(h => String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const getCol = (keys) => rawHeaders.findIndex(h => keys.some(k => h.includes(k)));

    const rollIdx = getCol(['roll', 'reg', 'id']);
    const nameIdx = getCol(['name', 'studentname']);
    const yrIdx = getCol(['year', 'batch', 'classyear']);
    const secIdx = getCol(['sec', 'section', 'class']);
    const mobileIdx = getCol(['studentphone', 'studentmobile', 'mobile', 'phone']);
    const parentIdx = getCol(['parent', 'father', 'guardian']);
    const emailIdx = getCol(['email', 'mail']);
    const addrIdx = getCol(['address', 'hostel', 'city', 'location']);

    const bulkOps = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      let rollNo = rollIdx !== -1 && row[rollIdx] ? String(row[rollIdx]).trim().toUpperCase() : '';
      if (!rollNo || rollNo.toLowerCase().includes('roll')) continue;

     bulkOps.push({
      updateOne: {
        filter: { rollNo },
        update: {
          $set: {
            parentContact: parentIdx !== -1 && row[parentIdx] ? String(row[parentIdx]).trim() : '-',
            mobile: mobileIdx !== -1 && row[mobileIdx] ? String(row[mobileIdx]).trim() : '-'
          }
        },
        upsert: false
      }
    });
  }
    if (bulkOps.length > 0) {
      await Student.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: `Successfully registered/updated ${bulkOps.length} students!`, count: bulkOps.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Passes Query with Clean Jurisdictions
app.get('/api/passes', async (req, res) => {
  try {
    const { status, dept, rollNo, counselorName, yearSec, role, startRoll, endRoll } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (rollNo) filter.rollNo = rollNo.trim().toUpperCase();

    const cleanDept = dept ? dept.toUpperCase().trim() : '';

    if (role === 'hod' && cleanDept) {
      filter.dept = cleanDept;
    } else if (role === 'advisor' && cleanDept) {
      filter.dept = cleanDept;
      if (yearSec) filter.yearSec = extractSection(yearSec);
    } else if (role === 'counselor') {
      const conditions = [];
      if (counselorName) {
        conditions.push({ counselorName: new RegExp(`^${counselorName.trim()}$`, 'i') });
      }
      if (startRoll && endRoll) {
        conditions.push({
          rollNo: {
            $gte: startRoll.trim().toUpperCase(),
            $lte: endRoll.trim().toUpperCase()
          }
        });
      }
      if (conditions.length > 0) {
        filter.$or = conditions;
      }
    }

    const passes = await Pass.find(filter).sort({ createdAt: -1 }).limit(300);
    res.json(passes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply Pass
app.post('/api/apply-pass', async (req, res) => {
  try {
    const { rollNo, reason } = req.body;
    if (!rollNo || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Roll number and reason are required.' });
    }

    const cleanRoll = rollNo.trim().toUpperCase();
    let student = await Student.findOne({ rollNo: cleanRoll });
    const studentUser = await User.findOne({ userId: cleanRoll.toLowerCase(), role: 'student' });

    let assignedCounselor = student?.counselorName || 'Class Counselor';
    if (!student || assignedCounselor === 'Class Counselor' || assignedCounselor === 'Counselor') {
      const rollNum = extractRollNumber(cleanRoll);
      const counselors = await User.find({ role: 'counselor' });
      for (const c of counselors) {
        const sVal = extractRollNumber(c.startRoll);
        const eVal = extractRollNumber(c.endRoll);
        if (sVal > 0n && eVal > 0n && rollNum >= sVal && rollNum <= eVal) {
          assignedCounselor = c.name;
          break;
        }
      }
    }

    const studentYear = student?.academicYear || studentUser?.academicYear || '3 Year';
    const appliedTimestamp = getISTTimeString();

    const studentObj = {
      rollNo: cleanRoll,
      name: student?.name || studentUser?.name || 'Student',
      academicYear: studentYear,
      dept: student?.dept || studentUser?.dept || 'CSE',
      yearSec: extractSection(student?.yearSec || studentUser?.yearSec || 'A'),
      counselorName: assignedCounselor,
      mobile: student?.mobile || '-',
      parentContact: student?.parentContact || '-',
      email: student?.email || '-',
      address: student?.address || 'GRT College Campus'
    };

    const generatedLetter = generateFormalLetter(studentObj, reason, appliedTimestamp);

    const newPass = new Pass({
      ...studentObj,
      reason: reason.trim(),
      formalLetter: generatedLetter,
      status: 'Pending Counselor',
      appliedTime: appliedTimestamp,
      exitStatus: 'Inside Campus',
      exitTime: '-'
    });

    await newPass.save();
    res.json({ success: true, message: `Requisition submitted & routed to Counselor (${assignedCounselor}).` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Counselor Approval
app.post('/api/approve/counselor', async (req, res) => {
  try {
    const { passId, parentCalled, counselorName } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({ success: false, message: 'Invalid pass ID' });
    }

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const cName = counselorName || 'Assigned Counselor';
    const now = getISTTimeString();
    pass.status = 'Pending Advisor';
    pass.parentCallVerified = !!parentCalled;
    pass.parentCalledBy = `I talked to their parents (Counselor: ${cName})`;
    pass.parentCallTime = now;
    pass.counselorApproval = {
      counselorName: cName,
      approved: true,
      time: now
    };
    await pass.save();
    res.json({ success: true, message: `Verified by Counselor (${cName}) & forwarded to Class Advisor.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Advisor Approval
app.post('/api/approve/advisor', async (req, res) => {
  try {
    const { passId, advisorName, parentCalledFallback } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({ success: false, message: 'Invalid pass ID' });
    }

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const aName = advisorName || 'Class Advisor';
    const now = getISTTimeString();
    if (!pass.parentCallVerified && parentCalledFallback) {
      pass.parentCallVerified = true;
      pass.parentCalledBy = `I talked to their parents (Class Advisor: ${aName}) [Counselor Absent]`;
      pass.parentCallTime = now;
    }

    if (!pass.parentCallVerified) {
      return res.status(400).json({ success: false, message: 'Parent verification is required before sending to HOD.' });
    }

    pass.status = 'Pending HOD';
    pass.advisorApproval = {
      advisorName: aName,
      approved: true,
      time: now
    };
    await pass.save();
    res.json({ success: true, message: `Approved by Class Advisor (${aName}) & routed to HOD.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HOD Approval
app.post('/api/approve/hod', async (req, res) => {
  try {
    const { passId, hodName } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({ success: false, message: 'Invalid pass ID' });
    }

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const hName = hodName || 'Department HOD';
    pass.status = 'Pending Principal';
    pass.hodApproval = { hodName: hName, approved: true, time: getISTTimeString() };
    await pass.save();
    res.json({ success: true, message: `HOD (${hName}) authorized! Forwarded to Principal.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Principal Approval
app.post('/api/approve/principal', async (req, res) => {
  try {
    const { passId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({ success: false, message: 'Invalid pass ID' });
    }

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const now = new Date();
    pass.principalApproval = { approved: true, time: getISTTimeString(now) };

    if (pass.accommodation === 'Hosteler') {
      // Find student to check gender for routing to correct warden
      const student = await Student.findOne({ rollNo: pass.rollNo });
      const gender = student ? student.gender : 'Male';

      pass.status = (gender === 'Female') ? 'Pending Girls Warden' : 'Pending Boys Warden';
      await pass.save();
      return res.json({ success: true, message: `Principal clearance granted! Forwarded to ${pass.status}.` });
    } else {
      const expiry = new Date(now.getTime() + 20 * 60 * 1000);
      pass.status = 'Approved';
      pass.approvalTime = getISTTimeString(now);
      pass.validUntil = getISTTimeString(expiry);
      pass.expiresAt = expiry;
      await pass.save();
      return res.json({ success: true, message: 'Principal clearance granted! 20-minute departure gate window active.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Security Scan
app.post('/api/scan-pass', async (req, res) => {
  try {
    const cleanRollNo = (req.body.rollNo || '').trim().toUpperCase();
    const pass = await Pass.findOne({ rollNo: cleanRollNo, status: 'Approved' }).sort({ createdAt: -1 });

    if (!pass) {
      return res.status(400).json({ success: false, message: `No active pass found for Roll No: ${cleanRollNo}` });
    }

    const now = new Date();
    if (now > pass.expiresAt) {
      pass.status = 'Expired';
      await pass.save();
      return res.status(400).json({ success: false, message: 'Gate pass expired! 20-minute departure validity elapsed.' });
    }

    pass.status = 'Exited';
    pass.exitStatus = 'Exited Campus';
    pass.exitTime = getISTTimeString(now);
    await pass.save();

    res.json({ success: true, message: 'Student marked as EXITED CAMPUS.', pass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/approve/warden', async (req, res) => {
  try {
    const { passId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({ success: false, message: 'Invalid pass ID' });
    }

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const now = new Date();
    const expiry = new Date(now.getTime() + 20 * 60 * 1000);

    pass.wardenApproval = { approved: true, time: getISTTimeString(now) };
    pass.status = 'Approved';
    pass.approvalTime = getISTTimeString(now);
    pass.validUntil = getISTTimeString(expiry);
    pass.expiresAt = expiry;

    await pass.save();
    return res.json({ success: true, message: 'Hostel Warden clearance granted! 20-minute departure gate window active.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/approve/boys-warden', async (req, res) => {
  try {
    const { passId, exitTime, returnTime } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({ success: false, message: 'Invalid pass ID' });
    }

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const now = new Date();
    pass.wardenApproval = { approved: true, time: getISTTimeString(now) };
    pass.status = 'Approved';
    pass.customExitTime = exitTime || getISTTimeString(now);
    pass.customReturnTime = returnTime || '';
    pass.approvalTime = getISTTimeString(now);

    await pass.save();
    return res.json({ success: true, message: 'Boys Hostel Warden clearance granted with custom timing window.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/approve/girls-warden', async (req, res) => {
  try {
    const { passId, exitTime, returnTime } = req.body;
    if (!mongoose.Types.ObjectId.isValid(passId)) {
      return res.status(400).json({ success: false, message: 'Invalid pass ID' });
    }

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found' });

    const now = new Date();
    pass.wardenApproval = { approved: true, time: getISTTimeString(now) };
    pass.status = 'Approved';
    pass.customExitTime = exitTime || getISTTimeString(now);
    pass.customReturnTime = returnTime || '';
    pass.approvalTime = getISTTimeString(now);

    await pass.save();
    return res.json({ success: true, message: 'Girls Hostel Warden clearance granted with custom timing window.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/security', (req, res) => res.sendFile(path.join(__dirname, 'security.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 GateMatrix server active on port ${PORT}`));
