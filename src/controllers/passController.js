/**
 * Gate Pass Requisition & Query Controller
 */
const Pass = require('../models/Pass');
const Student = require('../models/Student');
const User = require('../models/User');
const { getISTTimeString, extractSection, extractRollNumber } = require('../utils/formatters');
const { generateFormalLetter } = require('../utils/letterGenerator');

/**
 * Query gate passes with role-based jurisdiction filtering
 */
async function getPasses(req, res) {
  try {
    const { status, dept, rollNo, counselorName, yearSec, role, startRoll, endRoll } = req.query;
    let filter = {};

    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        filter.status = status;
      }
    }
    if (rollNo) filter.rollNo = rollNo.trim().toUpperCase();

    const cleanDept = dept ? dept.toUpperCase().trim() : '';

    if (role === 'hod' && cleanDept) {
      filter.dept = cleanDept;
    } else if (role === 'advisor' && cleanDept) {
      filter.dept = cleanDept;
      if (yearSec) filter.yearSec = extractSection(yearSec);
    } else if (role === 'boys_warden') {
      filter.accommodation = { $regex: /hostel/i, $not: /day\s*scholar/i };
      filter.$and = [
        {
          $or: [
            { gender: { $regex: /^male$/i } },
            { status: 'Pending Boys Warden' }
          ]
        },
        { gender: { $not: { $regex: /^female$/i } } },
        { status: { $ne: 'Pending Girls Warden' } }
      ];
    } else if (role === 'girls_warden') {
      filter.accommodation = { $regex: /hostel/i, $not: /day\s*scholar/i };
      filter.$and = [
        {
          $or: [
            { gender: { $regex: /^female$/i } },
            { status: 'Pending Girls Warden' }
          ]
        },
        { gender: { $not: { $regex: /^male$/i } } },
        { status: { $ne: 'Pending Boys Warden' } }
      ];
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
    const normalizedPasses = passes
      .map(p => {
        const passObj = p.toObject();
        passObj.accommodation = /hostel/i.test(passObj.accommodation || '') ? 'Hosteller' : 'Day Scholar';
        return passObj;
      })
      .filter(p => {
        if (role === 'boys_warden') {
          // Strictly Male Hostellers only - never Female, never Day Scholar
          const isHostel = /hostel/i.test(p.accommodation) && !/day\s*scholar/i.test(p.accommodation);
          const isNotFemale = !/^female$/i.test(String(p.gender || '').trim());
          const isNotGirlsStatus = p.status !== 'Pending Girls Warden';
          return isHostel && isNotFemale && isNotGirlsStatus;
        }
        if (role === 'girls_warden') {
          // Strictly Female Hostellers only - never Male, never Day Scholar
          const isHostel = /hostel/i.test(p.accommodation) && !/day\s*scholar/i.test(p.accommodation);
          const isFemale = /^female$/i.test(String(p.gender || '').trim()) || p.status === 'Pending Girls Warden';
          const isNotBoysStatus = p.status !== 'Pending Boys Warden';
          return isHostel && isFemale && isNotBoysStatus;
        }
        return true;
      });
    res.json(normalizedPasses);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch passes', error: err.message });
  }
}

/**
 * Student outpass application requisition submission
 */
async function applyPass(req, res) {
  try {
    const { rollNo, reason } = req.body;
    if (!rollNo || !reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid roll number and specific reason are required'
      });
    }

    const cleanRoll = rollNo.trim().toUpperCase();
    const student = await Student.findOne({ rollNo: cleanRoll });
    const studentUser = await User.findOne({
      userId: cleanRoll.toLowerCase(),
      role: 'student'
    });

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
    const rawAccom = student?.accommodation || studentUser?.accommodation || '';
    const studentAccom = /hostel/i.test(rawAccom) ? 'Hosteller' : 'Day Scholar';
    const rawGender = student?.gender || studentUser?.gender || 'Male';
    const studentGender = /^female$/i.test(String(rawGender).trim()) ? 'Female' : 'Male';
    const appliedTimestamp = getISTTimeString();

    const studentObj = {
      rollNo: cleanRoll,
      name: student?.name || studentUser?.name || 'Student',
      academicYear: studentYear,
      accommodation: studentAccom,
      gender: studentGender,
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
    res.json({
      success: true,
      message: `Requisition submitted & routed to Counselor (${assignedCounselor}).`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to submit requisition', error: err.message });
  }
}

module.exports = {
  getPasses,
  applyPass
};
