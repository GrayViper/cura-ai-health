# Cura AI Health - Services Integration Guide

## Overview

The `services-integration.js` module provides clean, promise-based APIs for integrating the new backend services into the Cura AI frontend. All services are available globally as `CuraServices` and can be used alongside the existing app.js code.

## Quick Start Examples

### 1. OCR Integration - Extract Text from Medical Documents

```javascript
// Handle file upload in your UI
async function handleMedicalDocumentUpload(file) {
  try {
    // Show loading indicator
    showLoadingSpinner('Extracting text from document...');
    
    // Extract text and parse fields
    const result = await CuraServices.OCRService.extractFromFile(file, true);
    
    console.log('Extracted Text:', result.text);
    console.log('Pages:', result.pages);
    console.log('Parsed Fields:', result.parsed_fields);
    
    // Display results in UI
    displayExtractedData(result);
    
    // Store in local state
    activeReport.extractedText = result.text;
    activeReport.ocrFields = result.parsed_fields;
    
  } catch (error) {
    showError('Failed to extract text: ' + error.message);
  }
}

// Example: In your file upload handler
const fileInput = document.getElementById('fileUpload');
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) {
    handleMedicalDocumentUpload(e.target.files[0]);
  }
});
```

### 2. FHIR Integration - Store Lab Values and Observations

```javascript
// Create a patient
async function createPatientRecord(patientInfo) {
  try {
    const patient = await CuraServices.FHIRService.createPatient({
      name: [{ given: [patientInfo.firstName], family: patientInfo.lastName }],
      gender: patientInfo.gender,
      birthDate: patientInfo.birthDate,
      identifier: [{
        system: 'http://example.com/mrn',
        value: patientInfo.mrn
      }]
    });
    
    console.log('Patient created:', patient.id);
    return patient.id;
  } catch (error) {
    console.error('Failed to create patient:', error);
  }
}

// Store lab values as FHIR observations
async function storeLabValue(patientId, labName, value, unit, code) {
  try {
    const observation = await CuraServices.FHIRService.createObservation({
      subject: { reference: `Patient/${patientId}` },
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: code,  // e.g., '2345-7' for hemoglobin
          display: labName
        }]
      },
      valueQuantity: {
        value: parseFloat(value),
        unit: unit,
        system: 'http://unitsofmeasure.org'
      }
    });
    
    console.log('Observation created:', observation.id);
    return observation.id;
  } catch (error) {
    console.error('Failed to store observation:', error);
  }
}

// Example usage with existing report data
async function syncCurrentReportToFHIR() {
  const patientId = activeReport.patientId;
  
  // Store each biomarker
  for (const [key, value] of Object.entries(activeReport.biomarkers)) {
    const labCode = getBiomarkerCode(key);  // Map biomarker to LOINC code
    await storeLabValue(patientId, key, value.value, value.unit, labCode);
  }
}
```

### 3. Medical Literature Search

```javascript
// Search for information about a lab value
async function searchForBiomarkerInfo(biomarker) {
  try {
    const results = await CuraServices.MedicalSearch.searchBiomarker(biomarker);
    
    console.log(`Found ${results.length} results for ${biomarker}`);
    
    // Display in UI
    displaySearchResults(results);
    
    return results;
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Search for clinical condition information
async function searchConditionInfo(condition) {
  try {
    const results = await CuraServices.MedicalSearch.searchCondition(condition);
    
    // Filter and format results
    const formattedResults = results.map(r => ({
      title: r.title,
      url: r.url,
      summary: r.content?.substring(0, 200)
    }));
    
    return formattedResults;
  } catch (error) {
    console.error('Condition search failed:', error);
  }
}

// Integrate with existing biomarker analysis
async function analyzeBiomarkerWithLiterature(biomarkerKey) {
  const biomarker = activeReport.biomarkers[biomarkerKey];
  const literature = await searchForBiomarkerInfo(biomarkerKey);
  
  return {
    ...biomarker,
    relevantResearch: literature.slice(0, 3)  // Top 3 results
  };
}
```

### 4. Complete Workflow - Upload → OCR → FHIR → Search

```javascript
// Comprehensive medical analysis workflow
async function analyzemedicalReport(file, patientId) {
  try {
    showLoadingSpinner('Analyzing medical report...');
    
    // Step 1: Extract text with OCR
    console.log('Step 1: Extracting text...');
    const ocrResult = await CuraServices.OCRService.extractFromFile(file, true);
    
    // Step 2: Create FHIR observation for the document
    console.log('Step 2: Storing in FHIR...');
    const observation = await CuraServices.FHIRService.createObservation({
      subject: { reference: `Patient/${patientId}` },
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: '11545-9',
          display: 'Clinical Report'
        }]
      },
      valueString: ocrResult.text.substring(0, 5000),  // Store extracted text
      note: [{ text: `From: ${file.name}` }]
    });
    
    // Step 3: Search for related clinical information
    console.log('Step 3: Searching for related information...');
    const searchResults = await CuraServices.MedicalSearch.search(
      ocrResult.text.substring(0, 500)
    );
    
    // Step 4: Compile and display results
    hideLoadingSpinner();
    displayAnalysisResults({
      extracted: ocrResult,
      stored: observation,
      literature: searchResults.slice(0, 5),
      timestamp: new Date().toISOString()
    });
    
    // Step 5: Store in local state for future reference
    activeReport.analysis = {
      extracted: ocrResult,
      fhirId: observation.id,
      literature: searchResults
    };
    
  } catch (error) {
    hideLoadingSpinner();
    showError('Analysis failed: ' + error.message);
  }
}
```

## Integration with Existing App Structure

### Adding to UI Elements

```javascript
// In your report analysis UI
function addServiceIntegrationPanel() {
  const panel = document.createElement('div');
  panel.className = 'services-panel';
  panel.innerHTML = `
    <div class="panel-section">
      <h3>Document Processing</h3>
      <input type="file" id="reportUpload" accept=".pdf,.jpg,.png" />
      <button onclick="handleMedicalDocumentUpload(document.getElementById('reportUpload').files[0])">
        Extract & Analyze
      </button>
    </div>
    
    <div class="panel-section">
      <h3>Related Research</h3>
      <input type="text" id="searchQuery" placeholder="Search medical literature..." />
      <button onclick="performMedicalSearch(document.getElementById('searchQuery').value)">
        Search
      </button>
      <div id="searchResults"></div>
    </div>
  `;
  
  return panel;
}

// Handle search
async function performMedicalSearch(query) {
  const results = await CuraServices.MedicalSearch.search(query);
  displaySearchResults(results);
}

// Display results
function displaySearchResults(results) {
  const container = document.getElementById('searchResults');
  container.innerHTML = results.map(r => `
    <div class="search-result">
      <h4>${r.title}</h4>
      <p>${r.content?.substring(0, 150)}...</p>
      <a href="${r.url}" target="_blank">Read More →</a>
    </div>
  `).join('');
}
```

### Health Check Integration

```javascript
// Add service health status to UI
async function updateServiceStatus() {
  const health = await CuraServices.ServiceHealth.checkAll();
  
  const statusDiv = document.getElementById('serviceStatus');
  statusDiv.innerHTML = `
    <div class="health-status ${health.overall}">
      <h4>Backend Services</h4>
      <ul>
        <li>OCR: <span class="${health.services.ocr}">${health.services.ocr}</span></li>
        <li>FHIR: <span class="${health.services.fhir}">${health.services.fhir}</span></li>
        <li>DICOM: <span class="${health.services.dicom}">${health.services.dicom}</span></li>
      </ul>
    </div>
  `;
}

// Check status on app load
document.addEventListener('DOMContentLoaded', () => {
  updateServiceStatus();
  // Update every 30 seconds
  setInterval(updateServiceStatus, 30000);
});
```

## Key Integration Points in app.js

### Modify existing report upload handler

```javascript
// In your existing file upload handler, add OCR extraction
const originalHandleUpload = handleFileUpload;
async function handleFileUpload(file) {
  // Original functionality
  originalHandleUpload(file);
  
  // NEW: Extract text with OCR
  if (file.type.includes('pdf') || file.type.includes('image')) {
    try {
      const ocrResult = await CuraServices.OCRService.extractFromFile(file, true);
      activeReport.extractedText = ocrResult.text;
      
      // Update UI with extracted data
      displayExtractedFields(ocrResult.parsed_fields);
    } catch (error) {
      console.warn('OCR extraction failed:', error);
      // App continues to work without OCR
    }
  }
}
```

### Enhance biomarker trending with FHIR data

```javascript
// In your biomarker trending function
async function getTrendData(biomarkerKey) {
  // Existing logic...
  let trendData = getTrendDataFromLocal();
  
  // NEW: Also fetch from FHIR server
  try {
    if (activeReport.patientId) {
      const fhirObs = await CuraServices.FHIRService.getPatientObservations(
        activeReport.patientId
      );
      
      // Merge with local data
      trendData = mergeFHIRWithLocal(trendData, fhirObs);
    }
  } catch (error) {
    console.warn('FHIR fetch failed, using local data', error);
  }
  
  return trendData;
}
```

### Add literature search to biomarker tooltips

```javascript
// Enhance biomarker info tooltips
async function createBiomarkerTooltip(biomarkerKey, value) {
  let tooltip = `<div class="biomarker-tooltip">
    <h4>${biomarkerKey}</h4>
    <p>Value: ${value}</p>`;
  
  // NEW: Add search results
  try {
    const research = await CuraServices.MedicalSearch.searchBiomarker(biomarkerKey);
    tooltip += `<div class="related-research">
      <h5>Related Research:</h5>
      <ul>${research.slice(0, 3).map(r => 
        `<li><a href="${r.url}">${r.title}</a></li>`
      ).join('')}</ul>
    </div>`;
  } catch (error) {
    console.warn('Literature search failed');
  }
  
  tooltip += '</div>';
  return tooltip;
}
```

## Error Handling & Fallbacks

```javascript
// Graceful degradation - app works even if services fail
async function safeOCRExtraction(file) {
  try {
    return await CuraServices.OCRService.extractFromFile(file, true);
  } catch (error) {
    console.warn('OCR service unavailable:', error);
    // Fallback to existing Tesseract.js OCR
    return await performLocalOCR(file);
  }
}

async function safeFHIRStorage(data) {
  try {
    return await CuraServices.FHIRService.createObservation(data);
  } catch (error) {
    console.warn('FHIR service unavailable:', error);
    // Fallback to localStorage
    saveToLocalStorage(data);
    return { status: 'stored_locally' };
  }
}

async function safeSearch(query) {
  try {
    return await CuraServices.MedicalSearch.search(query);
  } catch (error) {
    console.warn('Search service unavailable:', error);
    // Fallback - show informational message
    return [];
  }
}
```

## Testing Your Integration

```javascript
// Console tests (run in browser console)

// Test OCR
await CuraServices.OCRService.getStatus();

// Test FHIR
await CuraServices.FHIRService.getCapabilities();

// Test Search
await CuraServices.MedicalSearch.search('diabetes');

// Check all services
const health = await CuraServices.ServiceHealth.checkAll();
console.log(health);
```

## Performance Considerations

1. **Lazy Load**: Don't load search results until user requests them
2. **Cache**: Store search results in localStorage for common queries
3. **Debounce**: Debounce search input to avoid excessive requests
4. **Error Handling**: All services handle errors gracefully

```javascript
// Debounced search
const debouncedSearch = debounce(async (query) => {
  const results = await CuraServices.MedicalSearch.search(query);
  displayResults(results);
}, 500);

// Cache search results
const searchCache = {};
async function cachedSearch(query) {
  if (searchCache[query]) return searchCache[query];
  
  const results = await CuraServices.MedicalSearch.search(query);
  searchCache[query] = results;
  return results;
}
```

## Documentation

- **OCR Service**: Extract text from images/PDFs
- **FHIR Service**: Store and retrieve clinical data
- **DICOM Service**: Manage medical imaging
- **Medical Search**: Literature search integration
- **Health Check**: Service status monitoring

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full API documentation.
