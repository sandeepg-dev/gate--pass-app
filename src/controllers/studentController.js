/**
 * Student Directory & Roster Controller
 */
const xlsx = require('xlsx');
const Student = require('../models/Student');

/**
 * Upload student batch via Excel/CSV spreadsheet
 */
async function uploadStudents(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an Excel file' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
      header: 1,
      defval: ''
    });

    let headerIdx = rows.findIndex(r =>
      r.some(c => String(c).toLowerCase().replace(/[^a-z0-9]/g, '').includes('roll'))
    );
    if (headerIdx === -1) headerIdx = 0;

    const rawHeaders = rows[headerIdx].map(h =>
      String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    const getCol = keys => rawHeaders.findIndex(h => keys.some(k => h.includes(k)));

    const rollIdx = getCol(['roll', 'reg', 'id']);
    const mobileIdx = getCol(['studentphone', 'studentmobile', 'mobile', 'phone']);
    const parentIdx = getCol(['parent', 'father', 'guardian']);

    const bulkOps = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const rollNo =
        rollIdx !== -1 && row[rollIdx] ? String(row[rollIdx]).trim().toUpperCase() : '';
      if (!rollNo || rollNo.toLowerCase().includes('roll')) continue;

      bulkOps.push({
        updateOne: {
          filter: { rollNo },
          update: {
            $set: {
              parentContact:
                parentIdx !== -1 && row[parentIdx] ? String(row[parentIdx]).trim() : '-',
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

    res.json({
      success: true,
      message: `Successfully registered/updated ${bulkOps.length} students!`,
      count: bulkOps.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Get total student count for dashboard statistics
 */
async function getStudentCount(req, res) {
  try {
    const count = await Student.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  uploadStudents,
  getStudentCount
};
