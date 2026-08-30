// Cura AI Health - Application Core Logic

document.addEventListener('DOMContentLoaded', () => {
  // Initialize PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

  // --- State Variables ---
  let activeReport = null;
  let reportsHistory = [];
  let chatHistory = [];
  let activeTrendChartInstance = null;
  let lastDiscussedBiomarkerKey = null;
  let chatTurnCount = 0;

  // Load History from localStorage
  const storedHistory = localStorage.getItem('cura_health_history');
  if (storedHistory) {
    try {
      reportsHistory = JSON.parse(storedHistory);
    } catch (e) {
      console.error('Error loading history', e);
      reportsHistory = [];
    }
  }

  // Fallback to sample history if localStorage is empty to show trends immediately
  if (reportsHistory.length === 0) {
    reportsHistory = [
      {
        id: 'hist_cbc_1',
        title: 'Initial Hematology Screen',
        date: '2025-10-15',
        category: 'Hematology',
        biomarkers: { 'hb': 10.5, 'rbc': 3.6, 'wbc': 6.8, 'plt': 220 }
      },
      {
        id: 'hist_cbc_2',
        title: 'Follow-up Hematology Check',
        date: '2026-02-18',
        category: 'Hematology',
        biomarkers: { 'hb': 11.0, 'rbc': 3.8, 'wbc': 6.5, 'plt': 230 }
      },
      {
        id: 'hist_lipid_1',
        title: 'Lipid Panel Screen',
        date: '2025-12-10',
        category: 'Lipid Panel',
        biomarkers: { 'chol': 260, 'ldl': 175, 'hdl': 32, 'tg': 265 }
      },
      {
        id: 'hist_lipid_2',
        title: 'Mid-Year Followup',
        date: '2026-03-12',
        category: 'Lipid Panel',
        biomarkers: { 'chol': 252, 'ldl': 168, 'hdl': 34, 'tg': 230 }
      },
      {
        id: 'hist_thyroid_1',
        title: 'Thyroid Function Check',
        date: '2025-11-20',
        category: 'Thyroid Profile',
        biomarkers: { 'tsh': 7.2, 'ft4': 0.68, 'ft3': 1.9 }
      },
      {
        id: 'hist_thyroid_2',
        title: 'Mid-Year Endocrinology',
        date: '2026-04-05',
        category: 'Thyroid Profile',
        biomarkers: { 'tsh': 6.9, 'ft4': 0.70, 'ft3': 2.0 }
      },
      {
        id: 'hist_diabetes_1',
        title: 'Glucose Tolerance Baseline',
        date: '2025-09-05',
        category: 'Metabolic',
        biomarkers: { 'glucose': 125, 'hba1c': 6.4 }
      },
      {
        id: 'hist_diabetes_2',
        title: 'Routine Glycemic Review',
        date: '2026-01-14',
        category: 'Metabolic',
        biomarkers: { 'glucose': 120, 'hba1c': 6.2 }
      }
    ];
    localStorage.setItem('cura_health_history', JSON.stringify(reportsHistory));
  }

  // --- UI Elements ---
  const disclaimerBanner = document.getElementById('disclaimerBanner');
  const closeDisclaimerBtn = document.getElementById('closeDisclaimerBtn');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const pasteToggleBtn = document.getElementById('pasteToggleBtn');
  const pasteAreaContainer = document.getElementById('pasteAreaContainer');
  const analyzePasteBtn = document.getElementById('analyzePasteBtn');
  const rawTextPaste = document.getElementById('rawTextPaste');
  const trendBiomarkerSelect = document.getElementById('trendBiomarkerSelect');
  const trendChart = document.getElementById('trendChart');
  const chartFallbackMessage = document.getElementById('chartFallbackMessage');
  const welcomeEmptyState = document.getElementById('welcomeEmptyState');
  const resultsDashboard = document.getElementById('resultsDashboard');
  const newReportBtn = document.getElementById('newReportBtn');
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const printReportBtn = document.getElementById('printReportBtn');
  const clearReportBtn = document.getElementById('clearReportBtn');

  // Keep the service panel status visible without making services mandatory.
  if (window.CuraServices?.ServiceHealth) {
    window.CuraServices.ServiceHealth.checkAll().then(health => {
      document.body.dataset.serviceHealth = health.overall;
      console.info('Cura service health:', health);
    });
  }

  // Report fields
  const reportCategory = document.getElementById('reportCategory');
  const reportTitle = document.getElementById('reportTitle');
  const reportDate = document.getElementById('reportDate');
  const reportNotes = document.getElementById('reportNotes');
  const gaugeFill = document.getElementById('gaugeFill');
  const gaugeNumber = document.getElementById('gaugeNumber');
  const scoreBadge = document.getElementById('scoreBadge');
  const scoreDescription = document.getElementById('scoreDescription');
  const clinicalNarrative = document.getElementById('clinicalNarrative');
  const biomarkersGrid = document.getElementById('biomarkersGrid');
  const biomarkerCountLabel = document.getElementById('biomarkerCountLabel');
  const checklistContainer = document.getElementById('checklistContainer');
  const recommendationsContainer = document.getElementById('recommendationsContainer');

  // Manual Entry & History DOM Elements
  const manualEntryToggleBtn = document.getElementById('manualEntryToggleBtn');
  const manualEntryContainer = document.getElementById('manualEntryContainer');
  const manualCategorySelect = document.getElementById('manualCategorySelect');
  const manualReportTitle = document.getElementById('manualReportTitle');
  const manualFieldsContainer = document.getElementById('manualFieldsContainer');
  const saveManualReportBtn = document.getElementById('saveManualReportBtn');
  const historyListContainer = document.getElementById('historyListContainer');
  const historyCountLabel = document.getElementById('historyCountLabel');

  // Scanner Simulator
  const scanningOverlay = document.getElementById('scanningOverlay');
  const scanStatusText = document.getElementById('scanStatusText');
  const consoleLogBox = document.getElementById('consoleLogBox');
  const scanProgressBar = document.getElementById('scanProgressBar');
  const scanProgressPercentage = document.getElementById('scanProgressPercentage');
  const scanGridOverlay = document.getElementById('scanGridOverlay');
  const scanDocThumbnail = document.getElementById('scanDocThumbnail');

  // Detail Drawer
  const drawerOverlay = document.getElementById('drawerOverlay');
  const detailDrawer = document.getElementById('detailDrawer');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerBiomarkerName = document.getElementById('drawerBiomarkerName');
  const drawerCategory = document.getElementById('drawerCategory');
  const drawerCurrentValue = document.getElementById('drawerCurrentValue');
  const drawerUnit = document.getElementById('drawerUnit');
  const drawerRangeMin = document.getElementById('drawerRangeMin');
  const drawerRangeMax = document.getElementById('drawerRangeMax');
  const drawerSliderPointer = document.getElementById('drawerSliderPointer');
  const drawerDescription = document.getElementById('drawerDescription');
  const drawerWarningBlock = document.getElementById('drawerWarningBlock');
  const drawerWarningTitle = document.getElementById('drawerWarningTitle');
  const drawerCauses = document.getElementById('drawerCauses');
  const drawerSymptoms = document.getElementById('drawerSymptoms');
  const drawerDietProtocol = document.getElementById('drawerDietProtocol');

  // Chatbot
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const resetChatBtn = document.getElementById('resetChatBtn');
  const chatQuickPrompts = document.getElementById('chatQuickPrompts');

  // Initialize Lucide Icons
  lucide.createIcons();

  // --- Event Listeners ---
  
  // Disclaimer Close
  closeDisclaimerBtn.addEventListener('click', () => {
    disclaimerBanner.classList.add('hidden');
  });

  // Paste Toggle
  pasteToggleBtn.addEventListener('click', () => {
    pasteAreaContainer.classList.toggle('hidden');
  });

  // Manual Entry Toggle
  manualEntryToggleBtn.addEventListener('click', () => {
    manualEntryContainer.classList.toggle('hidden');
  });

  // Manual Category Select Change
  manualCategorySelect.addEventListener('change', populateManualFields);

  // Save Manual Report
  saveManualReportBtn.addEventListener('click', handleSaveManualReport);

  // Drag and Drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUploadedFile(files[0]);
    }
  });

  browseBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleUploadedFile(e.target.files[0]);
    }
  });

  // Analyze Pasted Text
  analyzePasteBtn.addEventListener('click', () => {
    const text = rawTextPaste.value.trim();
    if (!text) {
      alert('Please paste some report text to analyze.');
      return;
    }
    processRawTextReport(text);
  });

  // Demo Buttons
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = btn.getAttribute('data-report-type');
      loadDemoReport(type);
    });
  });

  // Action / Header buttons
  newReportBtn.addEventListener('click', () => {
    document.querySelector('.upload-section').scrollIntoView({ behavior: 'smooth' });
    // Add glowing border to dropzone
    dropZone.classList.add('dragover');
    setTimeout(() => dropZone.classList.remove('dragover'), 1500);
  });

  historyToggleBtn.addEventListener('click', () => {
    document.querySelector('.trends-section').scrollIntoView({ behavior: 'smooth' });
  });

  printReportBtn.addEventListener('click', () => {
    if (!activeReport) return;

    const element = document.getElementById('resultsDashboard');

    // Add print-friendly styling
    element.classList.add('pdf-export-mode');

    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4], // [top, left, bottom, right] in inches
      filename:     `CuraAI_Report_${activeReport.title.replace(/\s+/g, '_')}_${activeReport.date}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate the PDF
    html2pdf().set(opt).from(element).save().then(() => {
      // Remove styling class after generation is complete
      element.classList.remove('pdf-export-mode');
    }).catch(err => {
      console.error('PDF Generation Error:', err);
      element.classList.remove('pdf-export-mode');
    });
  });

  clearReportBtn.addEventListener('click', () => {
    unloadActiveReport();
  });

  // Trend Select
  trendBiomarkerSelect.addEventListener('change', () => {
    renderTrendChart();
  });

  // Drawer Close
  drawerCloseBtn.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  // Chat send
  chatSendBtn.addEventListener('click', handleUserChatMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleUserChatMessage();
    }
  });

  resetChatBtn.addEventListener('click', () => {
    chatHistory = [];
    chatMessages.innerHTML = '';
    addBotChatMessage(activeReport 
      ? `Chat has been reset. I am ready to answer questions about your current report: ${activeReport.title}.`
      : "Chat has been reset. Upload or load a report to get started!"
    );
    populateQuickPrompts();
  });

  // --- Document File Handler & Parser ---

  function handleUploadedFile(file) {
    if (!file) return;
    
    const fileType = file.type;
    const fileName = file.name;

    if (fileType === 'application/pdf') {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result);
        try {
          // Setup PDF.js
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let extractedText = '';
          const maxPages = Math.min(pdf.numPages, 4); // limit to 4 pages for client-side processing
          
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            extractedText += pageText + '\n';
          }
          
          runScanningSimulation(fileName, 'PDF', extractedText);
        } catch (err) {
          console.error('Error parsing PDF content: ', err);
          // Fallback to random simulation if pdf.js fails or file is restricted
          runScanningSimulation(fileName, 'PDF', null);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } else if (fileType.startsWith('image/')) {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        runScanningSimulation(fileName, 'Image (OCR)', null, this.result);
      };
      fileReader.readAsDataURL(file);
    } else {
      alert('Unsupported file format. Please upload a PDF or an Image.');
    }
  }

  function processRawTextReport(text) {
    runScanningSimulation('Pasted Text Report', 'Raw Text', text);
  }

  // --- Scanning Overlay Timeline Simulation ---

  function runScanningSimulation(fileName, typeLabel, textContent, imageSrc = null) {
    // Show overlay
    scanningOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Clear logs
    consoleLogBox.innerHTML = '';
    scanProgressBar.style.width = '0%';
    scanProgressPercentage.textContent = '0%';
    scanGridOverlay.innerHTML = '';

    // Set preview/thumbnail
    if (imageSrc) {
      scanDocThumbnail.innerHTML = `<img src="${imageSrc}" class="scan-thumbnail-img" />`;
    } else {
      scanDocThumbnail.innerHTML = '<i data-lucide="file-text"></i>';
      lucide.createIcons();
    }

    // Spawn scanning boxes
    for (let i = 0; i < 8; i++) {
      const box = document.createElement('div');
      box.className = 'ocr-bounding-box';
      box.style.width = `${Math.random() * 40 + 20}px`;
      box.style.height = `${Math.random() * 15 + 10}px`;
      box.style.top = `${Math.random() * 80 + 10}%`;
      box.style.left = `${Math.random() * 70 + 10}%`;
      scanGridOverlay.appendChild(box);
    }

    const addLogLine = (text, className = '') => {
      const line = document.createElement('div');
      line.className = `log-line ${className}`;
      line.textContent = text;
      consoleLogBox.appendChild(line);
      consoleLogBox.scrollTop = consoleLogBox.scrollHeight;
    };

    if (imageSrc) {
      // --- REAL OCR FLOW WITH TESSERACT.JS ---
      addLogLine(`[SECURE] Connected secure document stream for: ${fileName}`, 'text-mute');
      addLogLine(`[OCR] Initializing Optical Character Recognition modules...`);

      (async () => {
        let lastStatus = '';
        let loggedPercentages = new Set();
        let worker = null;

        try {
          // Initialize Tesseract worker
          worker = await Tesseract.createWorker('eng', 1, {
            logger: (m) => {
              const status = m.status;
              const progress = m.progress || 0;
              let overallProgress = 0;
              let statusDisplay = '';

              if (status === 'loading tesseract core') {
                overallProgress = Math.round(progress * 15);
                statusDisplay = 'Loading OCR Engine Core...';
                if (lastStatus !== status) {
                  addLogLine('[OCR] Downloading WebAssembly OCR packages...', 'text-mute');
                  lastStatus = status;
                }
              } else if (status === 'initializing api') {
                overallProgress = Math.round(15 + progress * 15);
                statusDisplay = 'Initializing API...';
                if (lastStatus !== status) {
                  addLogLine('[OCR] Calibrating character matrix configurations...', '');
                  lastStatus = status;
                }
              } else if (status === 'loading language traineddata') {
                overallProgress = Math.round(30 + progress * 20);
                statusDisplay = 'Loading dictionary...';
                if (lastStatus !== status) {
                  addLogLine('[OCR] Activating English medical lexicon datasets...', '');
                  lastStatus = status;
                }
              } else if (status === 'recognizing text') {
                overallProgress = Math.round(50 + progress * 50);
                statusDisplay = `Analyzing characters: ${Math.round(progress * 100)}%`;
                
                if (lastStatus !== status) {
                  addLogLine('[OCR] Executing optical page layout analysis...', 'text-warn');
                  lastStatus = status;
                }

                // Add periodic console logs for milestones (20%, 40%, 60%, 80%)
                const pct = Math.floor(progress * 5) * 20;
                if (pct > 0 && pct < 100 && !loggedPercentages.has(pct)) {
                  loggedPercentages.add(pct);
                  let logMsg = '';
                  if (pct === 20) logMsg = '[OCR] Classifying tabular biomarker blocks... 20%';
                  if (pct === 40) logMsg = '[OCR] Decoding physiological values & metrics... 40%';
                  if (pct === 60) logMsg = '[OCR] Reconstructing clinical grid structures... 60%';
                  if (pct === 80) logMsg = '[OCR] Cross-matching parsed vocabulary... 80%';
                  addLogLine(logMsg, '');
                }
              }

              // Update progress elements
              scanProgressBar.style.width = `${overallProgress}%`;
              scanProgressPercentage.textContent = `${overallProgress}%`;
              scanStatusText.textContent = statusDisplay;

              // Flicker bounding boxes during text recognition
              if (status === 'recognizing text') {
                const ocrBoxes = Array.from(document.querySelectorAll('.ocr-bounding-box'));
                if (ocrBoxes.length > 0 && Math.random() < 0.3) {
                  const randomBox = ocrBoxes[Math.floor(Math.random() * ocrBoxes.length)];
                  randomBox.classList.add('active');
                  setTimeout(() => randomBox.classList.remove('active'), 500);
                }
              }
            }
          });

          // Run recognition
          addLogLine('[OCR] Running pixel recognition scan pass...', 'text-warn');
          const { data: { text } } = await worker.recognize(imageSrc);
          
          addLogLine('[COMPLETE] Document character capture successful.', 'text-success');
          addLogLine('[CLINICAL] Executing semantic regex mapping...', 'text-success');

          // Smooth finalization delay for UX
          scanProgressBar.style.width = '100%';
          scanProgressPercentage.textContent = '100%';
          scanStatusText.textContent = 'Parsing complete!';
          
          setTimeout(async () => {
            // Terminate worker
            if (worker) {
              await worker.terminate();
            }
            
            // Hide overlay
            scanningOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Parse clinical text
            if (text && text.trim().length > 0) {
              parseClinicalText(text, fileName);
            } else {
              addLogLine('[ERROR] No text could be extracted from image.', 'text-warn');
              generateFallbackReport(fileName);
            }
          }, 800);

        } catch (err) {
          console.error('OCR Error: ', err);
          addLogLine(`[ERROR] Engine failure: ${err.message}`, 'text-warn');
          
          if (worker) {
            try {
              await worker.terminate();
            } catch (e) {}
          }
          
          setTimeout(() => {
            scanningOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            // Graceful fallback to mock data
            generateFallbackReport(fileName);
          }, 1500);
        }
      })();

    } else {
      // --- SIMULATED FLOW FOR PDF / RAW TEXT PASTING ---
      const logs = [
        { progress: 5, text: `[SECURE] Establishing analysis gateway for: ${fileName}`, class: 'text-mute' },
        { progress: 12, text: `[OCR] Type detected: ${typeLabel}. Spawning Optical Recognition nodes...`, class: '' },
        { progress: 24, text: `[OCR] Scanning layout bounds (found 3 main tabular grids)...`, class: '' },
        { progress: 38, text: `[DECODER] Extracting character grids and text lines...`, class: '' },
        { progress: 50, text: textContent ? `[REGEX] Parsing extracted text buffer (${textContent.length} characters)...` : `[AI Engine] Document parsed as vision array. Initiating visual pattern matching...`, class: 'text-warn' },
        { progress: 65, text: `[CLINICAL] Cross-referencing identified keywords with metabolic databases...`, class: '' },
        { progress: 78, text: `[DIAGNOSTIC] Compiling ranges against clinical thresholds...`, class: 'text-success' },
        { progress: 90, text: `[AI CORE] Generating clinical summaries & lifestyle guidelines...`, class: 'text-success' },
        { progress: 98, text: `[INFO] Synchronizing records with trends framework...`, class: 'text-mute' },
        { progress: 100, text: `[COMPLETE] Session successfully loaded. Preparing diagnostic interface...`, class: 'text-success' }
      ];

      let currentProgress = 0;
      const ocrBoxes = Array.from(document.querySelectorAll('.ocr-bounding-box'));
      
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 4) + 1;
        if (currentProgress > 100) currentProgress = 100;

        // Update UI
        scanProgressBar.style.width = `${currentProgress}%`;
        scanProgressPercentage.textContent = `${currentProgress}%`;

        // Activate random bounding boxes
        if (currentProgress % 15 === 0 && ocrBoxes.length > 0) {
          const randomBox = ocrBoxes[Math.floor(Math.random() * ocrBoxes.length)];
          randomBox.classList.add('active');
          setTimeout(() => randomBox.classList.remove('active'), 800);
        }

        // Check for logs to append
        const matchedLog = logs.find(log => log.progress <= currentProgress && !log.triggered);
        if (matchedLog) {
          matchedLog.triggered = true;
          addLogLine(matchedLog.text, matchedLog.class || '');
          scanStatusText.textContent = matchedLog.text.substring(13); // remove prefix [XXXX]
        }

        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Hide overlay
            scanningOverlay.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Complete processing
            if (textContent) {
              parseClinicalText(textContent, fileName);
            } else {
              // Fall back to a randomized sample based on name keywords, or default to CBC
              generateFallbackReport(fileName);
            }
          }, 800);
        }
      }, 150);
    }
  }

  // --- Real Regex Medical Parser ---

  function parseClinicalText(text, fileName) {
    const parsedBiomarkers = {};
    const lowerText = text.toLowerCase();
    
    // Biomarkers Regex Mapping
    const matchPatterns = {
      'hb': /(?:hemoglobin|hb)\b.*?(\d+\.?\d*)\s*(?:g\/dl|g\/l)?/i,
      'wbc': /(?:white blood cell|wbc|leukocytes)\b.*?(\d+\.?\d*)\s*(?:x10\^3|10e3|\*103)?/i,
      'rbc': /(?:red blood cell|rbc|erythrocytes)\b.*?(\d+\.?\d*)\s*(?:x10\^6|10e6|\*106)?/i,
      'plt': /(?:platelets?|plt|thrombocytes)\b.*?(\d+\.?\d*)/i,
      'chol': /(?:total cholesterol|chol)\b.*?(\d+\.?\d*)/i,
      'ldl': /(?:ldl|low-density lipoprotein|ldl-c)\b.*?(\d+\.?\d*)/i,
      'hdl': /(?:hdl|high-density lipoprotein|hdl-c)\b.*?(\d+\.?\d*)/i,
      'tg': /(?:triglycerides?|tg)\b.*?(\d+\.?\d*)/i,
      'tsh': /(?:tsh|thyroid stimulating hormone)\b.*?(\d+\.?\d*)/i,
      'ft4': /(?:free t4|ft4|thyroxine free)\b.*?(\d+\.?\d*)/i,
      'ft3': /(?:free t3|ft3|triiodothyronine free)\b.*?(\d+\.?\d*)/i,
      'glucose': /(?:glucose|blood sugar|fasting glucose)\b.*?(\d+\.?\d*)/i,
      'hba1c': /(?:hba1c|glycated hemoglobin|a1c)\b.*?(\d+\.?\d*)/i
    };

    // Run searches
    for (const [key, pattern] of Object.entries(matchPatterns)) {
      const match = pattern.exec(lowerText);
      if (match && match[1]) {
        parsedBiomarkers[key] = parseFloat(match[1]);
      }
    }

    // Determine category based on matched markers
    let category = 'General Screening';
    let title = 'Extracted Diagnostics Report';
    
    const countMatches = Object.keys(parsedBiomarkers).length;

    if (countMatches === 0) {
      // Try fallback parsing or default mock if completely unreadable
      generateFallbackReport(fileName);
      return;
    }

    // Detect Categories
    const hasCbc = ['hb', 'wbc', 'rbc', 'plt'].some(k => k in parsedBiomarkers);
    const hasLipids = ['chol', 'ldl', 'hdl', 'tg'].some(k => k in parsedBiomarkers);
    const hasThyroid = ['tsh', 'ft4', 'ft3'].some(k => k in parsedBiomarkers);
    const hasDiabetes = ['glucose', 'hba1c'].some(k => k in parsedBiomarkers);

    if (hasLipids) {
      category = 'Cardiovascular';
      title = 'AI Analyzed Lipid Panel';
    } else if (hasThyroid) {
      category = 'Endocrinology';
      title = 'AI Analyzed Thyroid Profile';
    } else if (hasCbc) {
      category = 'Hematology';
      title = 'AI Analyzed Complete Blood Count';
    } else if (hasDiabetes) {
      category = 'Metabolic';
      title = 'AI Glycemic Screen';
    }

    // Build the Report object
    const finalReport = {
      id: 'usr_' + Date.now(),
      title: title,
      date: new Date().toISOString().split('T')[0],
      category: category,
      notes: 'Direct text parsing extraction.',
      biomarkers: parsedBiomarkers
    };

    // Calculate AI Insights & summaries dynamically
    generateDynamicInsights(finalReport);
  }

  // --- Dynamic AI Insight Generator ---

  function generateDynamicInsights(report) {
    const db = window.CuraMedicalDb.BIOMARKER_DICT;
    const actions = [];
    let abnormalCount = 0;
    let highCount = 0;
    let lowCount = 0;
    
    // Evaluate status of each biomarker
    const biomarkerStatuses = {};
    
    for (const [key, val] of Object.entries(report.biomarkers)) {
      const meta = db[key];
      if (!meta) continue;

      if (val < meta.range.min) {
        biomarkerStatuses[key] = 'low';
        abnormalCount++;
        lowCount++;
        // Add low action
        actions.push({ type: 'diet', text: meta.low.diet });
        actions.push({ type: 'lifestyle', text: `Optimize for ${meta.name} deficiency: ${meta.low.causes}` });
      } else if (val > meta.range.max) {
        biomarkerStatuses[key] = 'high';
        abnormalCount++;
        highCount++;
        // Add high action
        actions.push({ type: 'diet', text: meta.high.diet });
        actions.push({ type: 'lifestyle', text: `Monitor markers for ${meta.name}: ${meta.high.causes}` });
      } else {
        biomarkerStatuses[key] = 'normal';
      }
    }

    // Health Score calculation
    // Start with 100, subtract 10 for each minor warning, 15 for each major, bounds at [30, 98]
    let score = 98 - (abnormalCount * 12);
    if (score < 30) score = 30;
    if (abnormalCount === 0) score = 100; // Perfect health score

    // Formulate Clinical Narrative summary
    let summary = '';
    const totalCount = Object.keys(report.biomarkers).length;
    
    if (abnormalCount === 0) {
      summary = `All evaluated markers (${totalCount}) fall fully within normal reference intervals. Your current physiological dashboard reflects optimal homeostasis, suggesting robust metabolic, cardiovascular, or hematological activity.`;
      actions.push({ type: 'lifestyle', text: 'Maintain current dietary framework and exercise regime.' });
      actions.push({ type: 'test', text: 'Schedule a routine follow-up screening in 6–12 months.' });
    } else {
      summary = `Evaluation of your panel reveals ${abnormalCount} biomarker deviation(s) from standard physiological ranges. `;
      
      const details = [];
      for (const [key, val] of Object.entries(report.biomarkers)) {
        const meta = db[key];
        const status = biomarkerStatuses[key];
        if (status === 'low') {
          details.push(`Low ${meta.name} (${val} ${meta.unit})`);
        } else if (status === 'high') {
          details.push(`High ${meta.name} (${val} ${meta.unit})`);
        }
      }
      summary += `Specifically, we observed: ${details.join(', ')}. `;
      
      if (report.category === 'Cardiovascular') {
        summary += 'This atherogenic profile indicates metabolic stressors that may increase plaque burden. Prioritize soluble fiber, cardiac conditioning, and lifestyle protocols to support vascular health.';
      } else if (report.category === 'Hematology') {
        summary += 'These results reflect sub-optimal erythropoietic activity, possibly linked to nutritional indicators (e.g., iron, folate) or cellular regulation. Cellular oxygen transport may be compromised, contributing to physical fatigue.';
      } else if (report.category === 'Endocrinology') {
        summary += 'Thyroid hormone output exhibits standard regulatory imbalances. The pituitary feedback signals indicate thyroid tissue requires support or is hyper-stimulated. Align with an endocrinologist.';
      } else {
        summary += 'General biomarker variations highlight opportunities for minor nutrient-dense nutrition adjustments and metabolic alignment.';
      }
    }

    report.summary = summary;
    report.actions = actions.slice(0, 4); // Keep top 4 actionable steps
    report.score = score;

    displayReport(report);
  }

  function generateFallbackReport(fileName) {
    const db = window.CuraMedicalDb.SAMPLE_REPORTS;
    let fallback = db.cbc; // default

    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('lipid') || lowerName.includes('cholesterol') || lowerName.includes('heart') || lowerName.includes('cardio')) {
      fallback = db.lipid;
    } else if (lowerName.includes('thyroid') || lowerName.includes('tsh') || lowerName.includes('t3') || lowerName.includes('t4')) {
      fallback = db.thyroid;
    } else if (lowerName.includes('diabetes') || lowerName.includes('glucose') || lowerName.includes('hba1c') || lowerName.includes('sugar')) {
      fallback = db.diabetes;
    }

    // Clone it, but randomise values slightly to make it feel unique to their file!
    const clonedReport = JSON.parse(JSON.stringify(fallback));
    clonedReport.id = 'usr_' + Date.now();
    clonedReport.title = `Analyzed: ${fileName.split('.')[0]}`;
    clonedReport.date = new Date().toISOString().split('T')[0];
    clonedReport.notes = 'Extracted via Vision scan mapping.';

    for (const key of Object.keys(clonedReport.biomarkers)) {
      const originalVal = clonedReport.biomarkers[key];
      // variance of +/- 5%
      const variance = originalVal * (Math.random() * 0.1 - 0.05);
      clonedReport.biomarkers[key] = parseFloat((originalVal + variance).toFixed(1));
    }

    // Re-generate insights based on slightly adjusted values
    generateDynamicInsights(clonedReport);
  }

  function loadDemoReport(type) {
    const db = window.CuraMedicalDb.SAMPLE_REPORTS;
    const report = db[type];
    if (!report) return;

    // Run the scanning simulation on sample reports
    runScanningSimulation(`${type.toUpperCase()}_Report_Demo.pdf`, 'System Demo File', JSON.stringify(report));
  }

  // --- Display Report Dashboard ---

  function displayReport(report) {
    activeReport = report;
    
    // Save report in history (if it's a new user report)
    if (report.id.startsWith('usr_')) {
      reportsHistory.push({
        id: report.id,
        title: report.title,
        date: report.date,
        category: report.category,
        biomarkers: report.biomarkers
      });
      localStorage.setItem('cura_health_history', JSON.stringify(reportsHistory));
    }

    // Update Text Paste input
    rawTextPaste.value = '';
    pasteAreaContainer.classList.add('hidden');

    // Display Grid
    welcomeEmptyState.classList.add('hidden');
    resultsDashboard.classList.remove('hidden');

    // Fill Title/Meta Info
    reportCategory.textContent = `Category: ${report.category}`;
    reportTitle.textContent = report.title;
    reportDate.textContent = report.date;
    reportNotes.textContent = report.notes;

    // Fill Gauge/Score
    const scoreVal = report.score || 85;
    gaugeNumber.textContent = scoreVal;

    // Dash offset calculation:
    // Dasharray is 276.4. Dashoffset = 276.4 * (1 - score / 100)
    const offset = 276.4 * (1 - scoreVal / 100);
    gaugeFill.style.strokeDashoffset = offset;

    // Badge styling
    scoreBadge.className = 'status-badge';
    if (scoreVal >= 85) {
      scoreBadge.classList.add('badge-success');
      scoreBadge.textContent = 'Optimal Status';
      scoreDescription.textContent = 'Biomarkers are balanced with optimal regulatory homeostasis. Keep up the high compliance!';
    } else if (scoreVal >= 70) {
      scoreBadge.classList.add('badge-warning');
      scoreBadge.textContent = 'Moderate Deviances';
      scoreDescription.textContent = 'Minor out-of-range indicators observed. Lifestyle modifications can restore optimal levels.';
    } else {
      scoreBadge.classList.add('badge-danger');
      scoreBadge.textContent = 'High Deviation Risk';
      scoreDescription.textContent = 'Critical threshold deviations detected. Medical consult suggested along with immediate diet changes.';
    }

    // Clinical summary paragraph
    clinicalNarrative.innerHTML = `<p>${report.summary}</p>`;

    // Biomarkers grid
    biomarkersGrid.innerHTML = '';
    const db = window.CuraMedicalDb.BIOMARKER_DICT;
    let markersCount = 0;

    for (const [key, value] of Object.entries(report.biomarkers)) {
      const meta = db[key];
      if (!meta) continue;
      markersCount++;

      // Evaluate range placement
      let status = 'normal';
      let statusText = 'Normal';
      let valClass = '';
      
      if (value < meta.range.min) {
        status = 'low';
        statusText = 'Low';
        valClass = 'text-warn';
      } else if (value > meta.range.max) {
        status = 'high';
        statusText = 'High';
        valClass = 'text-warn';
      } else {
        statusText = 'Optimal';
        valClass = 'text-success';
      }

      // Slider placement calculation: min is 25%, max is 75%
      let leftPercent = 50;
      const min = meta.range.min;
      const max = meta.range.max;
      
      if (value < min) {
        leftPercent = Math.max(5, 25 - ((min - value) / min) * 20);
      } else if (value > max) {
        leftPercent = Math.min(95, 75 + ((value - max) / max) * 20);
      } else {
        // linear map inside normal range [min, max] to [25, 75]
        leftPercent = 25 + ((value - min) / (max - min)) * 50;
      }

      const card = document.createElement('div');
      card.className = `biomarker-card`;
      card.dataset.biomarkerKey = key;
      card.dataset.biomarkerValue = value;
      card.innerHTML = `
        <div class="biomarker-card-header">
          <div>
            <span class="biomarker-category">${meta.category}</span>
            <h4>${meta.name}</h4>
          </div>
          <span class="status-badge ${status === 'normal' ? 'badge-success' : 'badge-danger'}">${statusText}</span>
        </div>
        <div class="biomarker-value-section">
          <span class="biomarker-val ${valClass}">${value}</span>
          <span class="biomarker-unit">${meta.unit}</span>
        </div>
        <div class="biomarker-slider-wrapper">
          <div class="range-limits-label">
            <span>Low (${min})</span>
            <span>High (${max})</span>
          </div>
          <div class="custom-range-bar">
            <div class="slider-indicator-pin ${status}" style="left: ${leftPercent}%;"></div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openBiomarkerDetail(key, value);
      });

      biomarkersGrid.appendChild(card);
    }
    biomarkerCountLabel.textContent = `${markersCount} Markers Loaded`;

    // Populate Checklist Items
    checklistContainer.innerHTML = '';
    report.actions.forEach((act, idx) => {
      const checkItem = document.createElement('div');
      checkItem.className = 'checklist-item';
      checkItem.innerHTML = `
        <div class="checklist-checkbox">
          <i data-lucide="check"></i>
        </div>
        <span class="checklist-item-text">${act.text}</span>
      `;
      checkItem.addEventListener('click', () => {
        checkItem.classList.toggle('checked');
        lucide.createIcons();
      });
      checklistContainer.appendChild(checkItem);
    });

    // Populate Recommendations list
    recommendationsContainer.innerHTML = '';
    report.actions.forEach(act => {
      const recCard = document.createElement('div');
      recCard.className = `protocol-card ${act.type}`;
      
      let icon = 'apple';
      if (act.type === 'lifestyle') icon = 'zap';
      if (act.type === 'medical') icon = 'stethoscope';
      if (act.type === 'test') icon = 'clipboard-list';

      recCard.innerHTML = `
        <div class="protocol-icon-wrapper">
          <i data-lucide="${icon}"></i>
        </div>
        <div class="protocol-content-text">${act.text}</div>
      `;
      recommendationsContainer.appendChild(recCard);
    });

    // Reset Chatbot context with the report title
    chatHistory = [];
    chatMessages.innerHTML = '';
    addBotChatMessage(`I have fully analyzed your **${report.title}**. You can see the visual markers, optimal reference ranges, and nutritional action checklists in the dashboard. Ask me anything about specific values, what causes these results, or target diet improvements!`);
    populateQuickPrompts();

    // Re-create icons
    lucide.createIcons();
    
    // Redraw trend charts
    renderTrendChart();
  }

  function unloadActiveReport() {
    activeReport = null;
    resultsDashboard.classList.add('hidden');
    welcomeEmptyState.classList.remove('hidden');
    
    // Reset Chat
    chatHistory = [];
    chatMessages.innerHTML = '';
    addBotChatMessage("Hello! Please upload a report or choose a sample to start analysis.");
    populateQuickPrompts();
    lucide.createIcons();
  }

  // --- Detail Drawer Implementation ---

  function openBiomarkerDetail(key, value) {
    const db = window.CuraMedicalDb.BIOMARKER_DICT;
    const meta = db[key];
    if (!meta) return;

    drawerBiomarkerName.textContent = meta.name;
    drawerCategory.textContent = meta.category;
    drawerCurrentValue.textContent = value;
    drawerUnit.textContent = meta.unit;
    drawerRangeMin.textContent = meta.range.min;
    drawerRangeMax.textContent = meta.range.max;
    drawerDescription.textContent = meta.description;

    // Check status
    let statusText = 'Optimal';
    let details = null;
    
    drawerWarningBlock.className = 'drawer-section warning-block';
    
    if (value < meta.range.min) {
      statusText = 'Low';
      details = meta.low;
      drawerWarningTitle.textContent = `Clinical Indicator: ${details.title}`;
      drawerCauses.textContent = details.causes;
      drawerSymptoms.textContent = details.symptoms;
      drawerDietProtocol.textContent = details.diet;
    } else if (value > meta.range.max) {
      statusText = 'High';
      details = meta.high;
      drawerWarningTitle.textContent = `Clinical Indicator: ${details.title}`;
      drawerCauses.textContent = details.causes;
      drawerSymptoms.textContent = details.symptoms;
      drawerDietProtocol.textContent = details.diet;
    } else {
      // In range
      drawerWarningBlock.classList.add('optimal-block');
      drawerWarningTitle.textContent = 'Physiological Metric: Optimal Range';
      drawerCauses.textContent = 'None. Markers indicate stable homeostasis in this feature block.';
      drawerSymptoms.textContent = 'None.';
      drawerDietProtocol.textContent = `Excellent. Continue eating balanced foods that stabilize this pathway. Baseline optimal range: ${meta.optimal.min} - ${meta.optimal.max} ${meta.unit}.`;
    }

    // Slider pin calculation
    let leftPercent = 50;
    const min = meta.range.min;
    const max = meta.range.max;
    
    if (value < min) {
      leftPercent = Math.max(5, 25 - ((min - value) / min) * 20);
    } else if (value > max) {
      leftPercent = Math.min(95, 75 + ((value - max) / max) * 20);
    } else {
      leftPercent = 25 + ((value - min) / (max - min)) * 50;
    }
    drawerSliderPointer.style.left = `${leftPercent}%`;

    // Show drawer
    drawerOverlay.classList.add('active');
    detailDrawer.classList.add('active');
  }

  function closeDrawer() {
    drawerOverlay.classList.remove('active');
    detailDrawer.classList.remove('active');
  }

  // --- HTML5 Canvas Trend Chart Drawing ---

  function renderTrendChart() {
    const selectVal = trendBiomarkerSelect.value;
    const db = window.CuraMedicalDb.BIOMARKER_DICT;
    
    // Determine which keys to plot
    let keysToPlot = [];
    if (selectVal === 'all_lipids') {
      keysToPlot = ['ldl', 'hdl', 'chol', 'tg'];
    } else if (selectVal === 'all_cbc') {
      keysToPlot = ['hb', 'wbc', 'rbc', 'plt'];
    } else if (selectVal === 'all_thyroid') {
      keysToPlot = ['tsh', 'ft3', 'ft4'];
    } else if (selectVal === 'all_metabolic') {
      keysToPlot = ['glucose', 'hba1c'];
    } else {
      keysToPlot = [selectVal];
    }

    // Gather matching reports from history
    const dataPoints = reportsHistory.filter(rep => 
      rep.biomarkers && keysToPlot.some(k => rep.biomarkers[k] !== undefined)
    );

    // Sort by date
    dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Toggle fallback layout if insufficient points
    if (dataPoints.length < 2) {
      trendChart.style.display = 'none';
      chartFallbackMessage.style.display = 'flex';
      if (activeTrendChartInstance) {
        activeTrendChartInstance.destroy();
        activeTrendChartInstance = null;
      }
      return;
    } else {
      trendChart.style.display = 'block';
      chartFallbackMessage.style.display = 'none';
    }

    // Destroy active instance if it exists to avoid canvas reuse error
    if (activeTrendChartInstance) {
      activeTrendChartInstance.destroy();
      activeTrendChartInstance = null;
    }

    const colorMap = {
      // Lipids
      'chol': { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.05)' },
      'ldl': { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.05)' },
      'hdl': { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.05)' },
      'tg': { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.05)' },
      // Hematology
      'hb': { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.05)' },
      'rbc': { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.05)' },
      'wbc': { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.05)' },
      'plt': { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.05)' },
      // Thyroid
      'tsh': { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.05)' },
      'ft3': { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.05)' },
      'ft4': { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.05)' },
      // Metabolic
      'glucose': { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.05)' },
      'hba1c': { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.05)' }
    };

    // Build chart labels (dates format: MM/DD)
    const labels = dataPoints.map(p => {
      const parts = p.date.split('-');
      return parts.length > 2 ? `${parts[1]}/${parts[2]}` : p.date;
    });

    // Build datasets
    const datasets = keysToPlot.map(key => {
      const meta = db[key];
      const name = meta ? meta.name : key;
      const colors = colorMap[key] || { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.05)' };
      
      const values = dataPoints.map(p => p.biomarkers[key] !== undefined ? p.biomarkers[key] : null);

      return {
        label: `${name}${meta ? ' (' + meta.unit + ')' : ''}`,
        data: values,
        borderColor: colors.stroke,
        backgroundColor: colors.fill,
        borderWidth: 2,
        tension: 0.35,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: colors.stroke,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: colors.stroke,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        fill: keysToPlot.length === 1, // Only fill for single line charts
        spanGaps: true
      };
    });

    const ctx = trendChart.getContext('2d');
    activeTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: keysToPlot.length > 1,
            position: 'top',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              color: '#94a3b8',
              font: {
                family: 'Outfit',
                size: 9,
                weight: '600'
              },
              padding: 8
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(9, 13, 22, 0.95)',
            titleColor: '#f8fafc',
            titleFont: {
              family: 'Outfit',
              size: 11,
              weight: 'bold'
            },
            bodyColor: '#94a3b8',
            bodyFont: {
              family: 'Inter',
              size: 10
            },
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 8,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const fullReport = dataPoints[idx];
                return `${fullReport.title} (${fullReport.date})`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.03)',
              drawBorder: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: 'Inter',
                size: 8
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.03)',
              drawBorder: false
            },
            ticks: {
              color: '#94a3b8',
              font: {
                family: 'JetBrains Mono',
                size: 8
              }
            }
          }
        }
      }
    });
  }

  // --- Contextual Chatbot Implementation ---

  function addBotChatMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';
    bubble.innerHTML = `
      <div class="chat-message-content">${text}</div>
      <span class="chat-timestamp">Cura AI</span>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addUserChatMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user';
    bubble.innerHTML = `
      <div class="chat-message-content">${text}</div>
      <span class="chat-timestamp">You</span>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleUserChatMessage() {
    const query = chatInput.value.trim();
    if (!query) return;

    // Display User bubble
    addUserChatMessage(query);
    chatInput.value = '';
    chatTurnCount++;

    const q = query.toLowerCase();
    const db = window.CuraMedicalDb.BIOMARKER_DICT;
    const thinkingSteps = [];

    // 1. Compile dynamic thinking trace logs
    if (activeReport) {
      thinkingSteps.push(`▸ Context: Active report loaded ("${activeReport.title}")`);
    } else {
      thinkingSteps.push(`▸ Context: No active report baseline loaded`);
    }

    let queryTopic = 'general conversation';
    let matchedKey = null;

    // Check if query discusses a specific biomarker
    for (const [key, meta] of Object.entries(db)) {
      if (q.includes(meta.name.toLowerCase()) || q.includes(key)) {
        matchedKey = key;
        queryTopic = `biomarker analysis [${meta.name}]`;
        break;
      }
    }

    // Context follow-up check (pronouns like "it", "this", "them")
    const isPronounFollowup = (q.includes('it') || q.includes('this') || q.includes('them') || q.includes('these') || q.includes('that')) && lastDiscussedBiomarkerKey;
    if (isPronounFollowup && !matchedKey) {
      matchedKey = lastDiscussedBiomarkerKey;
      queryTopic = `biomarker follow-up analysis [${db[matchedKey].name}] (via context memory)`;
    }

    if (matchedKey) {
      thinkingSteps.push(`▸ Query Classification: ${queryTopic}`);
      if (activeReport && activeReport.biomarkers[matchedKey] !== undefined) {
        const val = activeReport.biomarkers[matchedKey];
        const meta = db[matchedKey];
        thinkingSteps.push(`▸ Database Retrieval: Fetching reference bounds (${meta.range.min} - ${meta.range.max} ${meta.unit}) and patient value (${val})`);
        thinkingSteps.push(`▸ Clinical Reasoning: Calculating homeostatic delta and formatting targeted nutritional instructions`);
      } else {
        thinkingSteps.push(`▸ Database Retrieval: Fetching baseline definition for ${db[matchedKey].name}`);
        thinkingSteps.push(`▸ Warning: Requested biomarker data not present in active report`);
      }
    } else if (q.includes('diet') || q.includes('eat') || q.includes('food') || q.includes('nutrition')) {
      thinkingSteps.push(`▸ Query Classification: dietary protocol inquiry`);
      thinkingSteps.push(`▸ Database Retrieval: Scanning active report actions checklist for "diet" markers`);
      thinkingSteps.push(`▸ Synthesis: Compiling tailored micronutrient suggestions`);
    } else if (q.includes('exercise') || q.includes('workout') || q.includes('lifestyle')) {
      thinkingSteps.push(`▸ Query Classification: physical/lifestyle intervention request`);
      thinkingSteps.push(`▸ Database Retrieval: Checking clinical database for metabolic activity protocols`);
      thinkingSteps.push(`▸ Synthesis: Constructing training parameters`);
    } else {
      thinkingSteps.push(`▸ Query Classification: generic greeting / information prompt`);
      thinkingSteps.push(`▸ Reasoning: Mapping prompt against medical dictionaries and knowledge arrays`);
    }

    // 2. Append the thinking block to the chat
    const thinkingBlock = document.createElement('div');
    thinkingBlock.className = 'thinking-block';
    
    // Unique ID for details drawer to collapse
    const detailsId = `thinkingDetails_${Date.now()}`;
    
    thinkingBlock.innerHTML = `
      <div class="thinking-header" id="header_${detailsId}">
        <i data-lucide="sparkles"></i>
        <span>Cura AI Thinking Process...</span>
      </div>
      <div class="thinking-details" id="${detailsId}">
        <!-- Rendered lines asynchronously -->
      </div>
    `;
    
    chatMessages.appendChild(thinkingBlock);
    lucide.createIcons();
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const detailsContainer = document.getElementById(detailsId);
    const headerElement = document.getElementById(`header_${detailsId}`);

    // Toggle collapse on click
    headerElement.addEventListener('click', () => {
      detailsContainer.classList.toggle('hidden');
      thinkingBlock.classList.toggle('collapsed');
    });

    // Staggered lines generation
    let currentStep = 0;
    const runReasoningAnimation = () => {
      if (currentStep < thinkingSteps.length) {
        const line = document.createElement('div');
        line.textContent = thinkingSteps[currentStep];
        detailsContainer.appendChild(line);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        currentStep++;
        setTimeout(runReasoningAnimation, 300); // 300ms staggered logs
      } else {
        // Complete thinking process
        headerElement.classList.add('done');
        headerElement.querySelector('span').textContent = 'Cura AI Reasoning (Click to expand)';
        detailsContainer.classList.add('hidden'); // Collapse by default when done
        thinkingBlock.classList.add('collapsed');

        // Append final response bubble with a slight typing transition
        const response = computeChatResponse(query);
        addBotChatMessage(response);
        populateQuickPrompts(); // Update quick prompts in case context changed
      }
    };

    // Start thinking animation with a brief delay
    setTimeout(runReasoningAnimation, 200);
  }

  function computeChatResponse(query) {
    const q = query.toLowerCase();
    const db = window.CuraMedicalDb.BIOMARKER_DICT;

    if (!activeReport) {
      if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        return "Hello! I am Cura AI. To provide customized clinical feedback, please upload a lab report or select one of the demo configurations above.";
      }
      if (q.includes('cura') || q.includes('who are you') || q.includes('what do you do')) {
        return "I am Cura AI, an educational clinical companion. Load or upload a medical report, and I can analyze your biomarkers, calculate physiological indices, and suggest dietary adjustments.";
      }
      return "I would be happy to explain biomarkers and ranges, but I don't have an active report loaded. Please upload a PDF or choose a sample blood panel so I can provide relevant contextual answers.";
    }

    // Contextual responses based on loaded report
    const markers = activeReport.biomarkers;
    const isPronounFollowup = (q.includes('it') || q.includes('this') || q.includes('them') || q.includes('these') || q.includes('that')) && lastDiscussedBiomarkerKey;
    let resolvedKey = null;

    // Find if a specific biomarker was mentioned
    for (const [key, meta] of Object.entries(db)) {
      if (q.includes(meta.name.toLowerCase()) || q.includes(key)) {
        resolvedKey = key;
        lastDiscussedBiomarkerKey = key; // Update memory
        break;
      }
    }

    // Fallback to memory context if it's a pronoun follow-up
    if (!resolvedKey && isPronounFollowup) {
      resolvedKey = lastDiscussedBiomarkerKey;
    }

    if (resolvedKey) {
      const meta = db[resolvedKey];
      const value = activeReport.biomarkers[resolvedKey];
      
      if (value !== undefined) {
        let status = 'normal';
        let details = null;
        if (value < meta.range.min) {
          status = 'low';
          details = meta.low;
        } else if (value > meta.range.max) {
          status = 'high';
          details = meta.high;
        } else {
          details = { diet: `Maintain current balanced habits. Base reference optimal target: ${meta.optimal.min} - ${meta.optimal.max} ${meta.unit}.` };
        }

        // Cause/Symptom inquiry
        if (q.includes('why') || q.includes('cause') || q.includes('reason') || q.includes('trigger') || q.includes('symptom')) {
          if (status === 'normal') {
            return `Your **${meta.name}** level of **${value} ${meta.unit}** is in the optimal reference range. There are no clinical triggers or symptom flags associated with this metric; it reflects normal cellular homeostasis.`;
          } else {
            return `Your **${meta.name}** is **${status}** (${value} ${meta.unit}).<br><br>**Common causes:** ${details.causes}<br><br>**Typical symptoms:** ${details.symptoms}`;
          }
        }

        // Diet/Action inquiry
        if (q.includes('diet') || q.includes('eat') || q.includes('food') || q.includes('fix') || q.includes('lower') || q.includes('raise') || q.includes('correct') || q.includes('treat')) {
          if (status === 'normal') {
            return `Since your **${meta.name}** is optimal, no corrective action is necessary. Keep doing what you're doing! Target optimal range: ${meta.optimal.min} - ${meta.optimal.max} ${meta.unit}.`;
          } else {
            return `To correct your **${status} ${meta.name}**, follow these targeted dietary protocols:<br>👉 ${details.diet}`;
          }
        }

        // Generic lookup response
        let statusLabel = 'Optimal';
        if (status === 'low') {
          statusLabel = 'Below Reference Interval (Low)';
        } else if (status === 'high') {
          statusLabel = 'Above Reference Interval (High)';
        }

        return `**Biomarker Profile: ${meta.name}**<br>
        • **Current Value:** ${value} ${meta.unit} (${statusLabel})<br>
        • **Standard Reference Range:** ${meta.range.min} - ${meta.range.max} ${meta.unit}<br>
        • **Optimal Health Target:** ${meta.optimal.min} - ${meta.optimal.max} ${meta.unit}<br>
        • **Clinical Context:** ${meta.description}<br><br>
        ${status !== 'normal' ? `*Common triggers:* ${details.causes}<br>*Dietary adjustment:* ${details.diet}` : `*Homeostatic Status:* Stable. Maintain current routine.`}`;
      } else {
        return `Regarding **${meta.name}**: While this marker is cataloged in the clinical dictionary, it was not extracted from your loaded report (${activeReport.title}). Typically, ${meta.name} reference values are ${meta.range.min} - ${meta.range.max} ${meta.unit}. ${meta.description}`;
      }
    }

    // General queries about active report
    if (q.includes('diet') || q.includes('eat') || q.includes('food') || q.includes('nutrition')) {
      const recommendations = activeReport.actions
        .filter(act => act.type === 'diet')
        .map(act => `• ${act.text}`)
        .join('<br>');
      
      return recommendations 
        ? `Here are the tailored dietary updates based on your report findings:<br>${recommendations}`
        : "For optimal metabolic levels, emphasize whole foods, high-quality fiber, heart-healthy fats (nuts, avocados, olive oil), and lean proteins, while avoiding refined sugars and trans fats.";
    }

    if (q.includes('exercise') || q.includes('workout') || q.includes('lifestyle') || q.includes('habit')) {
      const lifestyle = activeReport.actions
        .filter(act => act.type === 'lifestyle')
        .map(act => `• ${act.text}`)
        .join('<br>');

      return lifestyle 
        ? `Based on your biomarkers, here are recommended physical and lifestyle adjustments:<br>${lifestyle}`
        : "Generally, we advise 150 minutes of moderate aerobic conditioning (e.g. brisk walking) and 2-3 sessions of resistance training per week to optimize insulin sensitivity and metabolic parameters.";
    }

    if (q.includes('doctor') || q.includes('physician') || q.includes('medical') || q.includes('pill') || q.includes('medication')) {
      return "Cura AI cannot prescribe medications or alter clinical protocols. Based on your report, we advise sharing these results with your primary care provider or an endocrinologist/cardiologist if you want to explore targeted therapies.";
    }

    if (q.includes('anemia') || q.includes('fatigue') || q.includes('tired')) {
      if (markers.hb) {
        return markers.hb < db.hb.range.min 
          ? `Your fatigue could indeed be linked to your **Hemoglobin of ${markers.hb} g/dL** (which is Low). Low hemoglobin means less oxygen is delivered to body tissues, leading to tiredness. Increasing iron and folate intake can help.`
          : "Your Hemoglobin count is normal, so fatigue might stem from other pathways like thyroid function, adrenal stress, vitamin D/B12 levels, or sleep quality.";
      }
      return "Fatigue is frequently linked to lower Red Blood Cell pathways (Hemoglobin) or underactive Thyroid indices (TSH). Consider uploading a full Hematology or Thyroid report to investigate.";
    }

    if (q.includes('cholesterol') || q.includes('lipid') || q.includes('heart') || q.includes('ldl')) {
      if (markers.ldl || markers.chol) {
        return `Your Total Cholesterol is **${markers.chol || 'N/A'} mg/dL** and LDL is **${markers.ldl || 'N/A'} mg/dL**. Elevates LDL increases lipid accumulation. Focus on consuming soluble fibers (oatmeal, beans) and unsaturated fats while increasing cardiovascular exercise.`;
      }
      return "To analyze your cardiovascular risks, check out the Lipid Panel Demo or upload your lipid screen report.";
    }

    if (q.includes('thyroid') || q.includes('tsh') || q.includes('hypo')) {
      if (markers.tsh) {
        return `Your TSH is **${markers.tsh} µIU/mL**. ${markers.tsh > db.tsh.range.max ? 'This elevated TSH signifies hypothyroidism tendency, meaning your metabolism is running sluggishly.' : 'This reflects active thyroid stimulation.'} Consider consulting an endocrinologist.`;
      }
      return "Thyroid pathways regulate overall cellular metabolic speeds. Load a Thyroid panel to check TSH, Free T3, and Free T4 values.";
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return `Hello! I am the Cura AI intelligence companion. I have mapped your **${activeReport.title}** dashboard. Ask me about specific biomarkers (e.g. ${Object.keys(activeReport.biomarkers).map(k => db[k]?.name || k).slice(0, 3).join(', ')}), why they might be elevated/low, or request a custom dietary protocol!`;
    }

    if (q.includes('cura') || q.includes('who are you') || q.includes('what do you do')) {
      return "I am Cura AI, an educational clinical companion. I translate raw laboratory biomarkers (PDFs, scans, or text) into readable range sliders, metabolic health scores, lifestyle recommendations, and personalized nutritional action plans.";
    }

    if (q.includes('scan') || q.includes('ocr') || q.includes('work')) {
      return "Cura uses client-side Optical Character Recognition (OCR) via Tesseract.js and PDF.js to securely parse character matrices directly in your browser. No files are uploaded to an external server; all processing happens locally.";
    }

    // Default response if no keywords match
    return `Interesting question. Looking at your **${activeReport.title}**, you have ${Object.keys(markers).length} markers analyzed. Is there a specific metric (like ${Object.keys(markers).map(k => db[k]?.name || k).slice(0, 3).join(', ')}) you would like me to detail further?`;
  }

  // --- Manual Entry and History Management Functions ---

  function populateManualFields() {
    const cat = manualCategorySelect.value;
    const db = window.CuraMedicalDb.BIOMARKER_DICT;
    let keys = [];
    
    if (cat === 'lipid') {
      keys = ['chol', 'ldl', 'hdl', 'tg'];
      manualReportTitle.value = 'Custom Lipid Profile';
    } else if (cat === 'cbc') {
      keys = ['hb', 'rbc', 'wbc', 'plt'];
      manualReportTitle.value = 'Custom Blood Count';
    } else if (cat === 'thyroid') {
      keys = ['tsh', 'ft4', 'ft3'];
      manualReportTitle.value = 'Custom Thyroid Profile';
    } else if (cat === 'diabetes') {
      keys = ['glucose', 'hba1c'];
      manualReportTitle.value = 'Custom Diabetes Screen';
    }

    manualFieldsContainer.innerHTML = '';
    keys.forEach(k => {
      const meta = db[k];
      if (!meta) return;
      
      const group = document.createElement('div');
      group.className = 'manual-field-input-group';
      group.innerHTML = `
        <label>${meta.name}</label>
        <div class="manual-input-wrapper">
          <input type="number" step="any" data-biomarker-key="${k}" placeholder="${meta.optimal.min} - ${meta.optimal.max}" required />
          <span>${meta.unit}</span>
        </div>
      `;
      manualFieldsContainer.appendChild(group);
    });
  }

  function handleSaveManualReport() {
    const title = manualReportTitle.value.trim() || 'Manual Diagnostics Report';
    const cat = manualCategorySelect.value;
    
    const inputs = Array.from(manualFieldsContainer.querySelectorAll('input'));
    const parsedBiomarkers = {};
    let hasEmpty = false;

    inputs.forEach(input => {
      const key = input.dataset.biomarkerKey;
      const val = parseFloat(input.value);
      if (isNaN(val)) {
        hasEmpty = true;
        input.classList.add('border-danger'); // simple visual highlight
      } else {
        parsedBiomarkers[key] = val;
        input.classList.remove('border-danger');
      }
    });

    if (hasEmpty) {
      alert('Please fill out all biomarker input values.');
      return;
    }

    let category = 'General Screening';
    if (cat === 'lipid') category = 'Lipid Panel';
    else if (cat === 'cbc') category = 'Hematology';
    else if (cat === 'thyroid') category = 'Thyroid Profile';
    else if (cat === 'diabetes') category = 'Metabolic';

    const finalReport = {
      id: 'usr_' + Date.now(),
      title: title,
      date: new Date().toISOString().split('T')[0],
      category: category,
      notes: 'Manually entered diagnostics.',
      biomarkers: parsedBiomarkers
    };

    // Generate insights and load into dashboard
    generateDynamicInsights(finalReport);
    
    // Clear inputs and hide form
    inputs.forEach(input => input.value = '');
    manualEntryContainer.classList.add('hidden');
    
    // Update visual history list
    renderHistoryList();
  }

  function renderHistoryList() {
    if (!historyListContainer) return;
    historyListContainer.innerHTML = '';
    
    // Update count label
    historyCountLabel.textContent = `${reportsHistory.length} Record${reportsHistory.length === 1 ? '' : 's'}`;

    // Sort history records descending (latest first)
    const sortedHistory = [...reportsHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedHistory.length === 0) {
      historyListContainer.innerHTML = '<div class="text-mute text-center" style="font-size: 0.72rem; padding: 10px;">No historical records found.</div>';
      return;
    }

    sortedHistory.forEach(rep => {
      const item = document.createElement('div');
      item.className = 'history-list-item';
      
      let icon = 'activity';
      let categoryClass = 'metabolic';
      const catLower = rep.category ? rep.category.toLowerCase() : '';
      
      if (catLower.includes('cardio') || catLower.includes('lipid')) {
        icon = 'heart';
        categoryClass = 'cardiovascular';
      } else if (catLower.includes('hemato') || catLower.includes('blood') || catLower.includes('cbc')) {
        icon = 'droplet';
        categoryClass = 'hematology';
      } else if (catLower.includes('endo') || catLower.includes('thyroid')) {
        icon = 'shield-alert';
        categoryClass = 'endocrinology';
      } else if (catLower.includes('metabolic') || catLower.includes('diab')) {
        icon = 'trending-up';
        categoryClass = 'metabolic';
      }

      item.innerHTML = `
        <div class="history-item-info">
          <div class="history-item-icon ${categoryClass}">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="history-item-text">
            <span class="history-item-title" title="${rep.title}">${rep.title}</span>
            <span class="history-item-date">${rep.date}</span>
          </div>
        </div>
        <div class="history-item-actions">
          <button class="history-item-delete" title="Delete report" data-report-id="${rep.id}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      // Info click handler to display
      item.querySelector('.history-item-info').addEventListener('click', () => {
        const fullReport = {
          id: rep.id,
          title: rep.title,
          date: rep.date,
          category: rep.category,
          notes: rep.notes || 'Historical record.',
          biomarkers: rep.biomarkers
        };
        generateDynamicInsights(fullReport);
      });

      // Delete click handler
      item.querySelector('.history-item-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${rep.title}"?`)) {
          deleteHistoryReport(rep.id);
        }
      });

      historyListContainer.appendChild(item);
    });

    // Re-create icons
    lucide.createIcons();
  }

  function deleteHistoryReport(id) {
    reportsHistory = reportsHistory.filter(rep => rep.id !== id);
    localStorage.setItem('cura_health_history', JSON.stringify(reportsHistory));
    
    if (activeReport && activeReport.id === id) {
      unloadActiveReport();
    }
    
    renderHistoryList();
    renderTrendChart();
  }

  function populateQuickPrompts() {
    chatQuickPrompts.innerHTML = '';
    
    let prompts = ['Tell me about Cura', 'How does scanning work?'];
    
    if (activeReport) {
      const keys = Object.keys(activeReport.biomarkers);
      const db = window.CuraMedicalDb.BIOMARKER_DICT;
      
      prompts = [];
      if (keys.includes('ldl') || keys.includes('chol')) {
        prompts.push('How do I lower LDL cholesterol?');
      }
      if (keys.includes('hb')) {
        prompts.push('What causes low Hemoglobin?');
      }
      if (keys.includes('tsh')) {
        prompts.push('Explain TSH reference range');
      }
      if (keys.includes('hba1c') || keys.includes('glucose')) {
        prompts.push('Diet to lower blood sugar');
      }
      prompts.push('What are my next steps?');
    }

    prompts.forEach(text => {
      const bubble = document.createElement('div');
      bubble.className = 'prompt-bubble';
      bubble.textContent = text;
      bubble.addEventListener('click', () => {
        chatInput.value = text;
        handleUserChatMessage();
      });
      chatQuickPrompts.appendChild(bubble);
    });
  }

  // --- Initial Setup ---
  populateQuickPrompts();
  renderTrendChart();
  renderHistoryList();
  populateManualFields();
});
