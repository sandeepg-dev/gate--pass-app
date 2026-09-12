/**
 * Institutional Leave Letter Generator
 */
const { getISTTimeString } = require('./formatters');

/**
 * Generates the standardized official formal leave clearance application text.
 * @param {object} student Student demographic and contact details
 * @param {string} [rawReason=''] Reason for outpass
 * @param {string} [appliedTimeStr=''] Submission timestamp string
 * @returns {string} Formatted formal letter
 */
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

module.exports = {
  generateFormalLetter
};
