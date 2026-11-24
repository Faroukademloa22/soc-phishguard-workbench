// Safe helper for Lucide icons
function safeCreateIcons() {
  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    try { lucide.createIcons(); } catch (e) { /* ignore */ }
  }
}

// Main Application Controller & UI Logic (Friendly Version with Landing Page Preview)
document.addEventListener('DOMContentLoaded', () => {
  safeCreateIcons();

  // Ingestion Mode Switching
  const tabTextBtn = document.getElementById('tabTextBtn');
  const tabFileBtn = document.getElementById('tabFileBtn');
  const tabOcrBtn = document.getElementById('tabOcrBtn');

  const tabTextContent = document.getElementById('tabTextContent');
  const tabFileContent = document.getElementById('tabFileContent');
  const tabOcrContent = document.getElementById('tabOcrContent');

  const rawInput = document.getElementById('rawInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const sampleSelect = document.getElementById('sampleSelect');

  // File Upload Elements
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const fileLoadedBadge = document.getElementById('fileLoadedBadge');
  const fileNameDisplay = document.getElementById('fileNameDisplay');

  // OCR Elements
  const ocrDropZone = document.getElementById('ocrDropZone');
  const ocrFileInput = document.getElementById('ocrFileInput');
  const ocrProgress = document.getElementById('ocrProgress');
  const ocrBar = document.getElementById('ocrBar');
  const ocrPercent = document.getElementById('ocrPercent');
  const ocrStatusText = document.getElementById('ocrStatusText');

  // Deep Details Tabs
  const deepTabs = [
    { btn: document.getElementById('resTabGeo'), panel: document.getElementById('resPanelGeo') },
    { btn: document.getElementById('resTabLinks'), panel: document.getElementById('resPanelLinks') },
    { btn: document.getElementById('resTabAttach'), panel: document.getElementById('resPanelAttach') },
    { btn: document.getElementById('resTabTech'), panel: document.getElementById('resPanelTech') }
  ];

  let currentAnalysisData = null;

  // 1. Ingestion Mode Switching
  function setInputTab(activeTab) {
    [tabTextBtn, tabFileBtn, tabOcrBtn].forEach(b => {
      b.className = "py-1.5 px-3 rounded-lg text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 transition";
    });
    [tabTextContent, tabFileContent, tabOcrContent].forEach(c => c.classList.add('hidden'));

    if (activeTab === 'text') {
      tabTextBtn.className = "py-1.5 px-3 rounded-lg bg-white text-blue-700 shadow-xs border border-slate-200/60 flex items-center space-x-1.5 transition";
      tabTextContent.classList.remove('hidden');
    } else if (activeTab === 'file') {
      tabFileBtn.className = "py-1.5 px-3 rounded-lg bg-white text-blue-700 shadow-xs border border-slate-200/60 flex items-center space-x-1.5 transition";
      tabFileContent.classList.remove('hidden');
    } else if (activeTab === 'ocr') {
      tabOcrBtn.className = "py-1.5 px-3 rounded-lg bg-white text-blue-700 shadow-xs border border-slate-200/60 flex items-center space-x-1.5 transition";
      tabOcrContent.classList.remove('hidden');
    }
    safeCreateIcons();
  }

  tabTextBtn.addEventListener('click', () => setInputTab('text'));
  tabFileBtn.addEventListener('click', () => setInputTab('file'));
  tabOcrBtn.addEventListener('click', () => setInputTab('ocr'));

  // 2. Deep Tabs Switching
  deepTabs.forEach((item, index) => {
    item.btn.addEventListener('click', () => {
      deepTabs.forEach(t => {
        t.btn.className = "px-4 py-2 rounded-xl flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 transition shrink-0";
        t.panel.classList.add('hidden');
      });
      item.btn.className = "px-4 py-2 rounded-xl flex items-center space-x-1.5 bg-white text-blue-700 shadow-xs border border-slate-200 transition shrink-0";
      item.panel.classList.remove('hidden');

      if (index === 0 && currentAnalysisData && currentAnalysisData.geo) {
        setTimeout(() => {
          if (GeoEngine.mapInstance) GeoEngine.mapInstance.invalidateSize();
        }, 150);
      }
      safeCreateIcons();
    });
  });

  // 3. Sample Selector
  sampleSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && window.SOC_SAMPLES[val]) {
      setInputTab('text');
      rawInput.value = window.SOC_SAMPLES[val].raw;
      runAnalysis(window.SOC_SAMPLES[val]);
    }
  });

  // 4. File Drag & Drop (.eml / .txt)
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      rawInput.value = evt.target.result;
      fileNameDisplay.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      fileLoadedBadge.classList.remove('hidden');
      safeCreateIcons();
      runAnalysis();
    };
    reader.readAsText(file);
  }

  // 5. Screenshot OCR (Tesseract.js)
  ocrDropZone.addEventListener('click', () => ocrFileInput.click());
  ocrDropZone.addEventListener('dragover', (e) => { e.preventDefault(); ocrDropZone.classList.add('drag-over'); });
  ocrDropZone.addEventListener('dragleave', () => ocrDropZone.classList.remove('drag-over'));
  ocrDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    ocrDropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processOcrImage(e.dataTransfer.files[0]);
    }
  });
  ocrFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      processOcrImage(e.target.files[0]);
    }
  });

  window.addEventListener('paste', (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        setInputTab('ocr');
        processOcrImage(file);
      }
    }
  });

  async function processOcrImage(imageFile) {
    ocrProgress.classList.remove('hidden');
    ocrBar.style.width = '0%';
    ocrPercent.textContent = '0%';
    ocrStatusText.textContent = 'Initializing OCR neural engine...';

    try {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pct = Math.round(m.progress * 100);
            ocrBar.style.width = pct + '%';
            ocrPercent.textContent = pct + '%';
            ocrStatusText.textContent = `Extracting email text... (${pct}%)`;
          }
        }
      });

      const ret = await worker.recognize(imageFile);
      await worker.terminate();

      ocrStatusText.textContent = 'Extraction complete!';
      ocrBar.style.width = '100%';
      ocrPercent.textContent = '100%';

      rawInput.value = ret.data.text;
      setTimeout(() => {
        setInputTab('text');
        runAnalysis();
      }, 400);

    } catch (err) {
      ocrStatusText.textContent = 'OCR error. Please retry.';
      console.error(err);
    }
  }

  // 6. Run Analysis
  analyzeBtn.addEventListener('click', () => runAnalysis());

  async function runAnalysis(sampleMeta = null) {
    const text = rawInput.value;
    if (!text || !text.trim()) {
      alert("Please paste email content or choose a scenario first.");
      return;
    }

    try {
      const parsed = EmailParser.parse(text);
      const links = LinkDetector.inspect(text);
      const urgency = UrgencyScorer.analyze(parsed.body || text);
      const geo = await GeoEngine.lookup(parsed.originatingIp);

      currentAnalysisData = { parsed, links, urgency, geo, sampleMeta };
      renderFriendlyResults(parsed, links, urgency, geo, sampleMeta);

    } catch (e) {
      alert("Error parsing email: " + e.message);
      console.error(e);
    }
  }

  // 7. Render Friendly Dashboard
  function renderFriendlyResults(parsed, links, urgency, geo, sampleMeta) {
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('analysisConsole').classList.remove('hidden');

    document.getElementById('linksCountBadge').textContent = links.length;
    document.getElementById('attachCountBadge').textContent = parsed.attachments.length;

    // --- SENDER & DOMAIN ---
    document.getElementById('valDisplayName').textContent = parsed.sender.displayName;
    document.getElementById('valFromAddr').textContent = parsed.sender.email || "Not specified";

    const senderDisplayLower = parsed.sender.displayName.toLowerCase();
    const senderEmailLower = parsed.sender.email.toLowerCase();
    let isDisplaySpoof = false;

    const brandKeywords = ['microsoft', 'ceo', 'security', 'it desk', 'helpdesk', 'paypal', 'apple', 'dhl', 'support', 'director'];
    for (const kw of brandKeywords) {
      if (senderDisplayLower.includes(kw) && !senderEmailLower.includes(kw)) {
        isDisplaySpoof = true;
        break;
      }
    }
    if (parsed.sender.email && parsed.returnPath.email && parsed.sender.domain !== parsed.returnPath.domain) {
      isDisplaySpoof = true;
    }

    const senderFriendlyBadge = document.getElementById('senderFriendlyBadge');
    const spoofWarningNote = document.getElementById('spoofWarningNote');
    if (isDisplaySpoof) {
      senderFriendlyBadge.className = "text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200";
      senderFriendlyBadge.textContent = "FAKE SENDER";
      spoofWarningNote.classList.remove('hidden');
      spoofWarningNote.textContent = `⚠️ Display name is spoofed! The sender is pretending to be ${parsed.sender.displayName}, but emails actually originate from ${parsed.sender.domain || 'an unverified domain'}.`;
    } else {
      senderFriendlyBadge.className = "text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200";
      senderFriendlyBadge.textContent = "VERIFIED / MATCH";
      spoofWarningNote.classList.add('hidden');
    }

    // --- LINKS & BUTTONS ---
    const primaryLink = links[0];
    const valButtonText = document.getElementById('valButtonText');
    const valDestLink = document.getElementById('valDestLink');
    const linksFriendlyBadge = document.getElementById('linksFriendlyBadge');

    if (primaryLink) {
      valButtonText.textContent = primaryLink.anchorText;
      valDestLink.textContent = primaryLink.defangedUrl;
      if (primaryLink.isMismatch || primaryLink.isIpAddress || primaryLink.isLookalike) {
        linksFriendlyBadge.className = "text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200";
        linksFriendlyBadge.textContent = "DECEPTIVE LINK";
      } else {
        linksFriendlyBadge.className = "text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200";
        linksFriendlyBadge.textContent = "STANDARD LINK";
      }
    } else {
      valButtonText.textContent = "No links found";
      valDestLink.textContent = "None";
      linksFriendlyBadge.className = "text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200";
      linksFriendlyBadge.textContent = "NO LINKS";
    }

    // --- URGENCY ---
    const urgencyFriendlyBadge = document.getElementById('urgencyFriendlyBadge');
    const urgencySummaryShort = document.getElementById('urgencySummaryShort');
    const triggersPills = document.getElementById('friendlyTriggersPills');
    triggersPills.innerHTML = '';

    urgencyFriendlyBadge.textContent = urgency.level;
    urgencyFriendlyBadge.className = `text-[11px] font-bold px-2 py-0.5 rounded-full ${urgency.badgeClass}`;
    urgencySummaryShort.textContent = urgency.triggers.length > 0 ? urgency.triggers[0].phrase : "Normal Tone";

    if (urgency.triggers.length > 0) {
      urgency.triggers.slice(0, 3).forEach(t => {
        const pill = document.createElement('span');
        pill.className = "text-[10px] font-medium bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md";
        pill.textContent = `"${t.phrase}"`;
        triggersPills.appendChild(pill);
      });
    } else {
      triggersPills.innerHTML = `<span class="text-[11px] text-slate-400 italic">No coercive urgency keywords</span>`;
    }

    // --- RENDER VISUAL PHISHING LANDING PAGE CANVAS (The requested feature!) ---
    renderLandingPagePreview(parsed, links, sampleMeta);

    // --- GEOLOCATION ---
    document.getElementById('geoIpBadge').textContent = geo.ip;
    document.getElementById('geoCountryName').textContent = `${geo.flag} ${geo.country} (${geo.city})`;
    document.getElementById('geoCoordinates').textContent = `${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}`;
    document.getElementById('geoIsp').textContent = `${geo.isp} (${geo.asn})`;
    GeoEngine.renderMap('leafletMap', geo.lat, geo.lon, `${geo.city}, ${geo.country}`);

    // --- LINKS TABLE ---
    renderLinksTable(links);

    // --- ATTACHMENTS ---
    renderAttachments(parsed.attachments);

    // --- TECHNICAL HEADERS ---
    renderAuthCard('spf', parsed.auth.spf);
    renderAuthCard('dkim', parsed.auth.dkim);
    renderAuthCard('dmarc', parsed.auth.dmarc);
    document.getElementById('valSubject').textContent = parsed.subject;
    document.getElementById('valDate').textContent = parsed.date;
    document.getElementById('valMsgId').textContent = parsed.messageId;

    // --- COMPOSITE THREAT VERDICT ---
    computeOverallVerdict(parsed, links, urgency, isDisplaySpoof);

    safeCreateIcons();
  }

  // 8. RENDER PHISHING LANDING PAGE VISUAL PREVIEW
  function renderLandingPagePreview(parsed, links, sampleMeta) {
    const canvas = document.getElementById('landingPageCanvas');
    const addressBar = document.getElementById('browserAddressBar');
    const riskBadge = document.getElementById('landingPageRiskBadge');
    const riskText = document.getElementById('landingPageRiskText');
    const explanation = document.getElementById('landingPageExplanation');

    // Determine preview type
    let previewType = "generic";
    if (sampleMeta && sampleMeta.previewType) {
      previewType = sampleMeta.previewType;
    } else if (links.some(l => l.domain.includes('microsoft') || l.domain.includes('office') || l.destinationUrl.includes('office365'))) {
      previewType = "m365";
    } else if (links.some(l => l.domain.includes('dhl') || l.destinationUrl.includes('track'))) {
      previewType = "dhl";
    } else if (parsed.attachments.some(a => a.extension === 'html' || a.extension === 'htm')) {
      previewType = "html_smuggle";
    }

    // Set Defanged Address Bar
    const primaryLink = links[0];
    if (primaryLink) {
      addressBar.textContent = primaryLink.defangedUrl;
    } else {
      addressBar.textContent = "hxxps://unknown-threat-landing[.]site";
    }

    if (previewType === "m365") {
      riskBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1.5";
      riskText.textContent = "Credential Harvester (Microsoft Clone)";
      explanation.textContent = "Deceptive phishing login form built to steal Microsoft 365 passwords and 2FA tokens.";

      canvas.innerHTML = `
        <div class="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-left space-y-4">
          <div class="flex items-center space-x-2">
            <!-- Microsoft SVG Logo -->
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 21 21" fill="none">
              <rect width="10" height="10" fill="#F25022"/>
              <rect x="11" width="10" height="10" fill="#7FBA00"/>
              <rect y="11" width="10" height="10" fill="#00A4EF"/>
              <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
            </svg>
            <span class="font-bold text-slate-700 text-sm">Microsoft</span>
          </div>
          <div>
            <h4 class="text-xl font-bold text-slate-900 tracking-tight">Sign in</h4>
            <p class="text-xs text-slate-500 mt-1">to continue to your Microsoft 365 organization</p>
          </div>
          <div class="space-y-3">
            <input type="text" readonly value="analyst@company.com" class="w-full text-xs p-2.5 border border-slate-300 rounded bg-slate-50 text-slate-800 focus:outline-none"/>
            <input type="password" readonly placeholder="Enter password (TRAP)" class="w-full text-xs p-2.5 border-2 border-rose-400 rounded bg-rose-50/30 text-rose-900 font-mono focus:outline-none"/>
          </div>
          <div class="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-start space-x-2">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-rose-600 shrink-0 mt-0.5"></i>
            <div>
              <strong>Fake Authentication Target:</strong>
              <div>Submits password directly to unverified IP: <span class="font-mono text-rose-900 font-bold">185.220.101.5</span></div>
            </div>
          </div>
          <div class="flex justify-end pt-2">
            <button class="bg-[#0067b8] text-white text-xs font-semibold px-6 py-2 rounded shadow-xs hover:bg-[#005da6]">Sign in</button>
          </div>
        </div>
      `;
    } else if (previewType === "dhl") {
      riskBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1.5";
      riskText.textContent = "Payment Scam & Malware Drop";
      explanation.textContent = "Fake DHL tracking portal that attempts to collect credit card fees and drops a malicious .ISO file.";

      canvas.innerHTML = `
        <div class="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden text-left">
          <div class="bg-[#d40511] p-3 text-white font-extrabold text-sm flex items-center justify-between">
            <span class="tracking-wider">DHL EXPRESS TRACKING</span>
            <span class="text-xs font-normal bg-black/20 px-2 py-0.5 rounded">#NL-8920192</span>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-xs">
              <strong>Delivery Exception:</strong> Your parcel has been placed on hold due to an unpaid customs handling fee of <strong>$2.99</strong>.
            </div>
            <div class="space-y-2 text-xs">
              <label class="block font-medium text-slate-700">Enter Payment Card to Release Package:</label>
              <input type="text" readonly placeholder="4111 2222 3333 4444" class="w-full p-2 border border-slate-300 rounded text-xs font-mono"/>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" readonly placeholder="MM/YY" class="p-2 border border-slate-300 rounded text-xs font-mono"/>
                <input type="text" readonly placeholder="CVV" class="p-2 border border-slate-300 rounded text-xs font-mono"/>
              </div>
            </div>
            <div class="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center space-x-2">
              <i data-lucide="shield-x" class="w-4 h-4 text-rose-600 shrink-0"></i>
              <span>Also triggers automatic background download of <strong>DHL_Receipt_892019.iso</strong></span>
            </div>
          </div>
        </div>
      `;
    } else if (previewType === "html_smuggle") {
      riskBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1.5";
      riskText.textContent = "HTML Smuggling Payload Execution";
      explanation.textContent = "Attachment contains an HTML smuggling script that reconstructs malware in browser memory.";

      canvas.innerHTML = `
        <div class="w-full max-w-sm bg-slate-900 text-white p-6 rounded-xl shadow-lg text-center space-y-4">
          <div class="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <i data-lucide="file-code-2" class="w-6 h-6"></i>
          </div>
          <h4 class="font-bold text-sm text-slate-100">Document Protection Gateway</h4>
          <p class="text-xs text-slate-400 leading-relaxed">Decrypting corporate PDF attachment. Please do not close this browser window...</p>
          <div class="p-3 rounded-lg bg-rose-950/70 border border-rose-700/50 text-[11px] text-rose-300 text-left font-mono">
            <div>// Base64 Payload Execution Detected</div>
            <div class="text-rose-400">Blob: application/octet-stream -> payload.exe</div>
          </div>
        </div>
      `;
    } else {
      // Clean or Legitimate
      riskBadge.className = "px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1.5";
      riskText.textContent = "Legitimate Internal Corporate Portal";
      explanation.textContent = "The destination is a verified internal wiki and authenticated corporate domain.";

      canvas.innerHTML = `
        <div class="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-slate-200 text-left space-y-3">
          <div class="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>Internal Knowledge Base & Wiki</span>
          </div>
          <h4 class="text-base font-bold text-slate-900">Weekly Engineering Sync Agenda</h4>
          <p class="text-xs text-slate-500">Authorized internal company intranet portal. No deceptive elements or credential inputs present.</p>
          <div class="pt-2">
            <span class="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">SSL Verified • Domain Matched</span>
          </div>
        </div>
      `;
    }

    safeCreateIcons();
  }

  function renderAuthCard(type, data) {
    const badge = document.getElementById(`${type}Badge`);
    const detail = document.getElementById(`${type}Detail`);
    const status = (data.status || "NONE").toUpperCase();

    badge.textContent = status;
    detail.textContent = data.detail;

    if (status === 'PASS') {
      badge.className = "text-[11px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (status === 'FAIL' || status === 'PERMERROR') {
      badge.className = "text-[11px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200";
    } else {
      badge.className = "text-[11px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200";
    }
  }

  function renderLinksTable(links) {
    const tbody = document.getElementById('linksTableBody');
    tbody.innerHTML = '';

    if (!links || links.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">No hyperlinks or buttons found in message.</td></tr>`;
      return;
    }

    links.forEach(l => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-slate-50/80 transition";
      tr.innerHTML = `
        <td class="p-3 font-medium text-slate-700">${l.type}</td>
        <td class="p-3 text-slate-800 max-w-[200px] truncate" title="${l.anchorText}">${l.anchorText}</td>
        <td class="p-3 font-mono text-slate-600 text-[11px] max-w-[250px] truncate">
          <span class="select-all">${l.defangedUrl}</span>
        </td>
        <td class="p-3 text-right">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold border ${l.verdictClass}">${l.verdict}</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderAttachments(attachments) {
    const container = document.getElementById('attachmentsContainer');
    container.innerHTML = '';

    if (!attachments || attachments.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 italic">No email attachments detected in this artifact.</p>`;
      return;
    }

    attachments.forEach(att => {
      const card = document.createElement('div');
      card.className = `p-3.5 rounded-xl border text-xs space-y-2 ${att.isDangerous ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'}`;
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i data-lucide="${att.isDangerous ? 'alert-octagon' : 'file'}" class="w-4 h-4 ${att.isDangerous ? 'text-rose-600' : 'text-slate-500'}"></i>
            <span class="font-bold text-slate-900">${att.filename}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${att.isDangerous ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}">.${att.extension.toUpperCase()}</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${att.isDangerous ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}">
            ${att.isDangerous ? 'CRITICAL RISK' : 'LOW RISK'}
          </span>
        </div>
        <p class="text-[11px] ${att.isDangerous ? 'text-rose-700 font-medium' : 'text-slate-500'}">${att.riskDescription}</p>
        <div class="bg-white p-2 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-500 space-y-0.5">
          <div><strong class="text-slate-700">MD5:</strong> ${att.hashMd5}</div>
          <div><strong class="text-slate-700">SHA-256:</strong> ${att.hashSha256}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function computeOverallVerdict(parsed, links, urgency, isDisplaySpoof) {
    let score = 0;
    const reasons = [];

    if (parsed.auth.dmarc.status === 'FAIL') { score += 30; reasons.push("DMARC failure"); }
    if (parsed.auth.spf.status === 'FAIL') { score += 20; reasons.push("SPF failure"); }
    if (parsed.auth.dkim.status === 'FAIL') { score += 15; reasons.push("DKIM failure"); }
    if (isDisplaySpoof) { score += 35; reasons.push("Display name impersonation / fake sender"); }

    const hasDeceptiveLink = links.some(l => l.isMismatch || l.isIpAddress || l.isLookalike);
    if (hasDeceptiveLink) { score += 40; reasons.push("Deceptive redirect / credential harvesting link"); }
    if (urgency.score >= 50) { score += 25; reasons.push("Aggressive urgency manipulation"); }

    const hasDangerousAttach = parsed.attachments.some(a => a.isDangerous);
    if (hasDangerousAttach) { score += 45; reasons.push("Dangerous payload attachment"); }

    const finalScore = Math.min(100, score);
    const scoreBadge = document.getElementById('threatScoreBadge');
    const label = document.getElementById('verdictLabel');
    const desc = document.getElementById('verdictDescription');
    const banner = document.getElementById('verdictBanner');
    const iconContainer = document.getElementById('verdictIconContainer');

    scoreBadge.textContent = `Threat Score: ${finalScore}/100`;

    if (finalScore >= 60) {
      banner.className = "rounded-2xl border p-5 shadow-sm bg-rose-50/70 border-rose-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4";
      iconContainer.className = "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-rose-600 text-white shadow-sm shadow-rose-200";
      scoreBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold border bg-rose-100 text-rose-800 border-rose-300";
      label.textContent = "MALICIOUS PHISHING DETECTED";
      label.className = "text-base font-extrabold uppercase tracking-tight text-rose-900";
      desc.textContent = "High-confidence phishing threat: " + (reasons.join(" • ") || "Critical risk markers identified.");
    } else if (finalScore >= 25) {
      banner.className = "rounded-2xl border p-5 shadow-sm bg-amber-50/70 border-amber-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4";
      iconContainer.className = "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-600 text-white shadow-sm shadow-amber-200";
      scoreBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-100 text-amber-800 border-amber-300";
      label.textContent = "SUSPICIOUS / ELEVATED RISK";
      label.className = "text-base font-extrabold uppercase tracking-tight text-amber-900";
      desc.textContent = "Proceed with caution: " + (reasons.join(" • ") || "Elevated threat markers observed.");
    } else {
      banner.className = "rounded-2xl border p-5 shadow-sm bg-emerald-50/70 border-emerald-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4";
      iconContainer.className = "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-sm shadow-emerald-200";
      scoreBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-800 border-emerald-300";
      label.textContent = "CLEAN & LEGITIMATE";
      label.className = "text-base font-extrabold uppercase tracking-tight text-emerald-900";
      desc.textContent = "No phishing indicators, malicious redirection links, or display spoofing found.";
    }
  }

  // 9. Copy Report
  document.getElementById('copyReportBtn').addEventListener('click', () => {
    if (!currentAnalysisData) return;
    const { parsed, links, urgency, geo } = currentAnalysisData;

    const report = `### [SOC PHISHING TRIAGE REPORT]
* **Investigated At:** ${new Date().toUTCString()}
* **Subject:** ${parsed.subject}
* **Sender Display Name:** ${parsed.sender.displayName}
* **Actual From:** ${parsed.sender.email}
* **Originating IP:** ${geo.ip} (${geo.city}, ${geo.country})

#### Authentication & Spoofing
* **SPF:** ${parsed.auth.spf.status}
* **DKIM:** ${parsed.auth.dkim.status}
* **DMARC:** ${parsed.auth.dmarc.status}

#### Extracted Links & Defanged Targets
${links.map(l => `- [${l.verdict}] "${l.anchorText}" -> ${l.defangedUrl}`).join('\n') || 'None'}

#### Urgency & Social Engineering
* **Level:** ${urgency.level}
* **Triggers:** ${urgency.triggers.map(t => t.phrase).join(', ') || 'None'}

#### Attachments
${parsed.attachments.map(a => `- ${a.filename} [${a.isDangerous ? 'CRITICAL RISK' : 'LOW'}] - SHA256: ${a.hashSha256}`).join('\n') || 'None'}
`;

    navigator.clipboard.writeText(report).then(() => {
      showToast("SOC Incident Report copied to clipboard!");
    }).catch(() => {
      prompt("Copy Incident Report:", report);
    });
  });

  // 10. Reset
  clearAllBtn.addEventListener('click', () => {
    rawInput.value = '';
    sampleSelect.value = '';
    fileLoadedBadge.classList.add('hidden');
    document.getElementById('analysisConsole').classList.add('hidden');
    document.getElementById('emptyState').classList.remove('hidden');
    currentAnalysisData = null;
    showToast("Workspace reset.");
  });

  function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = msg;
    toast.classList.remove('translate-y-12', 'opacity-0');
    setTimeout(() => {
      toast.classList.add('translate-y-12', 'opacity-0');
    }, 2800);
  }
});
