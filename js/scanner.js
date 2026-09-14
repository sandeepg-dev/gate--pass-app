/**
 * Gate Physical Security Scanner & WhatsApp Parent Alerts
 */

let isProcessing = false;
const video = document.getElementById('video');
const beep = document.getElementById('beepSound');

async function verifyPass(rollNumber) {
  if (isProcessing || !rollNumber) return;
  isProcessing = true; // Lock scanner to prevent duplicate calls

  try {
    beep.currentTime = 0;
    beep.play();
  } catch (e) {}

  const cleanRoll = String(rollNumber).trim();
  const resultBox = document.getElementById('scanResult');

  if (resultBox) {
    resultBox.classList.remove('hidden');
    resultBox.className = 'p-4 rounded-xl font-bold text-xs mb-4 bg-yellow-600 text-white shadow-lg';
    resultBox.innerHTML = `⚡ Verifying Roll No: <span class="font-mono">${cleanRoll}</span>...`;
  }

  try {
    const res = await fetch('/api/scan-pass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollNo: cleanRoll })
    });

    const data = await res.json();

    if (data.success && resultBox) {
      const pass = data.pass;
      if (data.action === 'return' || pass.status === 'Returned') {
        resultBox.className = 'p-4 rounded-xl text-xs mb-4 bg-sky-700 text-white shadow-lg space-y-1.5 border border-sky-400';
        resultBox.innerHTML = `
          <div class="text-sm font-bold border-b border-sky-400 pb-1 mb-1 flex items-center justify-between">
            <span>🏠 RETURNED TO COLLEGE</span>
            <span class="text-[10px] bg-sky-900/80 px-2 py-0.5 rounded-full font-mono text-sky-200">ENTRY LOGGED</span>
          </div>
          <div><b>Roll No:</b> <span class="font-mono text-sky-200">${pass.rollNo}</span></div>
          <div><b>Name:</b> ${pass.name || 'Student'} | <b>Dept:</b> ${pass.dept || 'Engineering'}</div>
          <div><b>Accommodation:</b> <span class="font-semibold">${/hostel/i.test(pass.accommodation || '') ? 'Hosteller' : 'Day Scholar'}</span></div>
          <div class="p-2 bg-sky-900/70 rounded-lg border border-sky-400/30 my-1">
            <div class="text-[10px] uppercase font-bold text-sky-300">Exact Return Date & Time (IST)</div>
            <div class="text-sm font-mono font-extrabold text-amber-300">↩️ ${pass.returnTime}</div>
          </div>
          <div class="text-[11px] text-sky-200"><b>Departure Was:</b> ${pass.exitTime || '-'}</div>
          <div class="text-[10px] text-sky-300 italic pt-0.5 text-right">✓ Warden dashboard updated with return timestamp</div>
        `;
      } else {
        resultBox.className = 'p-4 rounded-xl text-xs mb-4 bg-emerald-600 text-white shadow-lg space-y-1';
        resultBox.innerHTML = `
          <div class="text-sm font-bold border-b border-emerald-400 pb-1 mb-1">✅ CAMPUS EXIT GRANTED</div>
          <div><b>Roll No:</b> <span class="font-mono">${pass.rollNo}</span></div>
          <div><b>Name:</b> ${pass.name || 'Student'} | <b>Dept:</b> ${pass.dept || 'Engineering'}</div>
          <div><b>Accommodation:</b> <span class="font-semibold">${/hostel/i.test(pass.accommodation || '') ? 'Hosteller' : 'Day Scholar'}</span></div>
          <div class="text-xs"><b>Validity:</b> <span class="font-semibold text-emerald-100">20-Minute Departure Window (Valid until: ${pass.validUntil || '-'})</span></div>
          <div><b>Address:</b> ${pass.address || '-'}</div>
          <div class="text-[11px] text-emerald-100 pt-0.5 font-mono"><b>Exit Recorded:</b> ${pass.exitTime}</div>
          <button onclick="sendParentWhatsApp('${pass.name}', '${pass.rollNo}', '${pass.dept || 'Engineering'}', '${
          pass.parentContact || pass.mobile || ''
        }', '${pass.exitTime}')" class="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-xs shadow flex items-center justify-center gap-1">
            💬 Send WhatsApp Alert to Parent
          </button>
          <div class="text-[10px] text-emerald-200 text-right italic pt-0.5">Holding display...</div>
        `;
      }
    } else if (resultBox) {
      resultBox.className = 'p-4 rounded-xl font-bold text-xs mb-4 bg-red-600 text-white shadow-lg';
      resultBox.innerHTML = `❌ ACCESS DENIED<br><span class="text-[11px] font-normal">${
        data.message || 'Pass Not Approved or Expired'
      }</span>`;
    }
  } catch (err) {
    if (resultBox) {
      resultBox.className = 'p-4 rounded-xl font-bold text-xs mb-4 bg-red-600 text-white shadow-lg';
      resultBox.innerHTML = `❌ Connection Error`;
    }
  }

  const manualInput = document.getElementById('manualRoll');
  if (manualInput) manualInput.value = '';

  // Display card for 6 seconds, then reset scanner
  setTimeout(() => {
    if (resultBox) {
      resultBox.classList.add('hidden');
      resultBox.innerHTML = '';
    }
    isProcessing = false;
    if (manualInput) manualInput.focus();
  }, 6000);
}

function handleManualSubmit(e) {
  e.preventDefault();
  const val = document.getElementById('manualRoll')?.value;
  verifyPass(val);
}

// Hardware-Accelerated Fast Engine
async function startInstantScanner() {
  const vid = document.getElementById('video');
  if (!vid) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    vid.srcObject = stream;

    // Check for Native Browser Barcode Detector
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'upc_a']
      });

      async function detectFrame() {
        if (!isProcessing && vid.readyState === vid.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await barcodeDetector.detect(vid);
            if (barcodes.length > 0) {
              verifyPass(barcodes[0].rawValue);
            }
          } catch (e) {}
        }
        requestAnimationFrame(detectFrame);
      }
      detectFrame();
    } else if (typeof ZXing !== 'undefined') {
      // Fallback to ZXing Reader
      const codeReader = new ZXing.BrowserMultiFormatReader();
      codeReader.decodeFromVideoDevice(null, 'video', result => {
        if (result && !isProcessing) {
          verifyPass(result.text);
        }
      });
    }
  } catch (err) {
    console.error('Camera Error:', err);
    const statusEl = document.getElementById('scanStatus');
    if (statusEl) statusEl.innerText = 'Manual Mode Ready';
  }
}

function sendParentWhatsApp(name, rollNo, dept, parentMobile, exitTime) {
  const cleanPhone = (parentMobile || '').replace(/[^0-9]/g, '');

  if (!cleanPhone || cleanPhone.length < 10) {
    if (typeof showToast === 'function') {
      showToast('No valid parent mobile number found for this student.', 'error');
    } else {
      alert('No valid parent mobile number found for this student.');
    }
    return;
  }

  const message = encodeURIComponent(
    `🚨 *CAMPUS GATE EXIT NOTIFICATION*\n\nDear Parent / Guardian,\nYour ward *${name}* (Roll No: *${rollNo}*, ${dept}) has officially cleared and exited the college main gate.\n\n⏱️ *Exit Timestamp:* ${exitTime} (IST)\n🔒 *Gate Status:* Verified & Exited ✅\n\n_College Security & Administration Office_`
  );

  const targetNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  window.open(`https://wa.me/${targetNumber}?text=${message}`, '_blank');
}

window.onload = startInstantScanner;
window.verifyPass = verifyPass;
window.handleManualSubmit = handleManualSubmit;
window.sendParentWhatsApp = sendParentWhatsApp;
