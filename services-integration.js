/**
 * Cura AI Health - Backend Services Integration Module
 * 
 * This module provides integration with:
 * - OCR Service for medical document analysis
 * - HAPI FHIR for clinical data management
 * - Orthanc for DICOM image storage
 * - searXNG for medical literature search
 * 
 * All functions are async and return promise-based results
 * for seamless integration with the existing React app.
 */

// ============================================================================
// OCR SERVICE INTEGRATION
// ============================================================================

const OCRService = {
  baseURL: '/api/ocr',
  
  /**
   * Extract text from a medical image or PDF
   * @param {File} file - The image or PDF file to process
   * @param {boolean} extractFields - Parse medical fields (default: true)
   * @returns {Promise<Object>} Extracted text and parsed fields
   */
  async extractFromFile(file, extractFields = true) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extract_fields', extractFields);
      
      const response = await fetch(`${this.baseURL}/extract`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`OCR extraction failed: HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log('OCR extraction successful:', result);
      return result;
    } catch (error) {
      console.error('OCR service error:', error);
      throw error;
    }
  },
  
  /**
   * Process multiple files in batch
   * @param {FileList|File[]} files - Multiple files to process
   * @returns {Promise<Object>} Batch processing results
   */
  async batchExtract(files) {
    try {
      const formData = new FormData();
      
      // Handle both FileList and array of Files
      const fileArray = files instanceof FileList ? Array.from(files) : files;
      fileArray.forEach(file => formData.append('files', file));
      
      const response = await fetch(`${this.baseURL}/batch`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Batch processing failed: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Batch OCR error:', error);
      throw error;
    }
  },
  
  /**
   * Get OCR service status
   * @returns {Promise<Object>} Service capabilities and status
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseURL}/status`);
      return await response.json();
    } catch (error) {
      console.error('OCR status check failed:', error);
      return { status: 'error', message: error.message };
    }
  }
};

// ============================================================================
// FHIR SERVICE INTEGRATION
// ============================================================================

const FHIRService = {
  baseURL: '/fhir',
  
  /**
   * Create a FHIR Patient resource
   * @param {Object} patientData - Patient information
   * @returns {Promise<Object>} Created patient with ID
   */
  async createPatient(patientData) {
    try {
      const patient = {
        resourceType: 'Patient',
        ...patientData
      };
      
      const response = await fetch(`${this.baseURL}/Patient`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json'
        },
        body: JSON.stringify(patient)
      });
      
      if (!response.ok) {
        throw new Error(`Patient creation failed: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('FHIR patient creation error:', error);
      throw error;
    }
  },
  
  /**
   * Create a FHIR Observation (lab value, measurement, etc)
   * @param {Object} observationData - Observation details
   * @returns {Promise<Object>} Created observation with ID
   */
  async createObservation(observationData) {
    try {
      const observation = {
        resourceType: 'Observation',
        status: 'final',
        ...observationData
      };
      
      const response = await fetch(`${this.baseURL}/Observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json'
        },
        body: JSON.stringify(observation)
      });
      
      if (!response.ok) {
        throw new Error(`Observation creation failed: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('FHIR observation creation error:', error);
      throw error;
    }
  },
  
  /**
   * Search for patients
   * @param {string} query - Search query (name, ID, etc)
   * @returns {Promise<Object>} Search results
   */
  async searchPatients(query) {
    try {
      const response = await fetch(`${this.baseURL}/Patient?name=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Patient search failed: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('FHIR patient search error:', error);
      return { entry: [] };
    }
  },
  
  /**
   * Get observations for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Patient observations
   */
  async getPatientObservations(patientId) {
    try {
      const response = await fetch(`${this.baseURL}/Observation?subject=Patient/${patientId}`);
      if (!response.ok) {
        throw new Error(`Observation retrieval failed: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('FHIR observation retrieval error:', error);
      return { entry: [] };
    }
  },
  
  /**
   * Get FHIR server metadata
   * @returns {Promise<Object>} Server capabilities
   */
  async getCapabilities() {
    try {
      const response = await fetch(`${this.baseURL}/metadata`);
      return await response.json();
    } catch (error) {
      console.error('FHIR capabilities check failed:', error);
      return { status: 'error' };
    }
  }
};

// ============================================================================
// ORTHANC DICOM SERVICE INTEGRATION
// ============================================================================

const DicomService = {
  baseURL: '/orthanc',
  
  /**
   * Get list of all patients in DICOM storage
   * @returns {Promise<Array>} Array of patient IDs
   */
  async getPatients() {
    try {
      const response = await fetch(`${this.baseURL}/patients`);
      if (!response.ok) {
        throw new Error(`Patient list failed: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('DICOM patient list error:', error);
      return [];
    }
  },
  
  /**
   * Get studies for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of study IDs
   */
  async getPatientStudies(patientId) {
    try {
      const response = await fetch(`${this.baseURL}/patients/${encodeURIComponent(patientId)}`);
      if (!response.ok) {
        throw new Error(`Studies retrieval failed: HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.Studies || [];
    } catch (error) {
      console.error('DICOM studies retrieval error:', error);
      return [];
    }
  },
  
  /**
   * Get study details
   * @param {string} studyId - Study ID
   * @returns {Promise<Object>} Study information
   */
  async getStudy(studyId) {
    try {
      const response = await fetch(`${this.baseURL}/studies/${encodeURIComponent(studyId)}`);
      if (!response.ok) {
        throw new Error(`Study retrieval failed: HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('DICOM study retrieval error:', error);
      return {};
    }
  },
  
  /**
   * Upload DICOM file
   * @param {File} file - DICOM file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadDicom(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${this.baseURL}/instances`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`DICOM upload failed: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('DICOM upload error:', error);
      throw error;
    }
  },
  
  /**
   * Get Orthanc server status
   * @returns {Promise<Object>} Server statistics
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseURL}/system`);
      return await response.json();
    } catch (error) {
      console.error('DICOM status check failed:', error);
      return { status: 'error' };
    }
  }
};

// ============================================================================
// MEDICAL SEARCH INTEGRATION
// ============================================================================

const MedicalSearch = {
  baseURL: '/api/search',
  
  /**
   * Search medical literature and resources
   * @param {string} query - Search query
   * @param {Object} options - Search options (engines, format, etc)
   * @returns {Promise<Object>} Search results
   */
  async search(query, options = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        ...options
      });
      
      const response = await fetch(`${this.baseURL}?${params}`);
      if (!response.ok) {
        throw new Error(`Search failed: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      return { results: [], error: error.message };
    }
  },
  
  /**
   * Search specific medical engines (PubMed, Google Scholar, etc)
   * @param {string} query - Search query
   * @param {string[]} engines - Array of engine names
   * @returns {Promise<Object>} Search results from specified engines
   */
  async searchByEngines(query, engines = ['pubmed', 'scholar']) {
    return this.search(query, {
      sources: engines.join(',')
    });
  },
  
  /**
   * Search for specific biomarker/lab value information
   * @param {string} biomarker - Biomarker name (e.g., 'hemoglobin', 'cholesterol')
   * @returns {Promise<Array>} Relevant search results
   */
  async searchBiomarker(biomarker) {
    const queries = [
      `${biomarker} normal range values`,
      `${biomarker} clinical interpretation`,
      `${biomarker} abnormal levels treatment`
    ];
    
    const results = [];
    for (const query of queries) {
      const res = await this.search(query, { sources: 'pubmed,nih,who,cdc' });
      results.push(...(res.results || []));
    }
    
    return results.slice(0, 10); // Return top 10 results
  },
  
  /**
   * Search clinical condition information
   * @param {string} condition - Medical condition name
   * @returns {Promise<Array>} Clinical information results
   */
  async searchCondition(condition) {
    return this.search(`${condition} clinical management diagnosis treatment`, {
      sources: 'pubmed,nih,who,cdc'
    });
  }
};

const SemanticSearch = {
  async search(query) {
    try {
      const response = await fetch(`/api/semantic-search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Semantic search failed: HTTP ${response.status}`);
      return data;
    } catch (error) {
      console.error('Semantic search error:', error);
      return { error: error.message };
    }
  }
};

// ============================================================================
// INTEGRATED WORKFLOW - OCR TO FHIR
// ============================================================================

const MedicalWorkflow = {
  /**
   * Complete workflow: Upload file → OCR → Create FHIR Observation
   * @param {File} file - Medical document file
   * @param {string} patientId - FHIR Patient ID
   * @returns {Promise<Object>} Workflow result with observation ID
   */
  async processReportToFHIR(file, patientId) {
    try {
      console.log('Starting workflow: OCR → FHIR');
      
      // Step 1: Extract text and fields
      console.log('Step 1: Extracting text from document...');
      const ocrResult = await OCRService.extractFromFile(file, true);
      
      // Step 2: Parse medical data
      console.log('Step 2: Parsing medical fields...');
      const parsedFields = ocrResult.parsed_fields || {};
      
      // Step 3: Create FHIR observation
      console.log('Step 3: Creating FHIR observation...');
      const observation = await FHIRService.createObservation({
        subject: { reference: `Patient/${patientId}` },
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '11548-2',
            display: 'Medical Document'
          }]
        },
        valueString: ocrResult.text,
        note: [{
          text: `Extracted from: ${file.name}`
        }]
      });
      
      console.log('Workflow complete:', observation);
      return {
        success: true,
        ocrData: ocrResult,
        fhirObservation: observation,
        message: 'Document processed and stored successfully'
      };
    } catch (error) {
      console.error('Workflow error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Enhanced workflow with literature search
   * @param {File} file - Medical document
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Complete analysis with search results
   */
  async analyzeReportWithSearch(file, patientId) {
    try {
      // Extract and create FHIR observation
      const workflowResult = await this.processReportToFHIR(file, patientId);
      
      if (!workflowResult.success) {
        return workflowResult;
      }
      
      // Search for related clinical information
      console.log('Searching for related clinical information...');
      const searchResults = await MedicalSearch.search(
        workflowResult.ocrData.raw_text.substring(0, 200)
      );
      
      return {
        ...workflowResult,
        searchResults: searchResults.slice(0, 5) // Top 5 results
      };
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      return { success: false, error: error.message };
    }
  }
};

// ============================================================================
// SERVICE HEALTH CHECK
// ============================================================================

const ServiceHealth = {
  /**
   * Check all backend services
   * @returns {Promise<Object>} Health status of all services
   */
  async checkAll() {
    const health = {
      timestamp: new Date().toISOString(),
      services: {}
    };
    
    // Check OCR Service
    try {
      const ocrStatus = await OCRService.getStatus();
      health.services.ocr = ocrStatus.status === 'running' ? 'healthy' : 'degraded';
    } catch {
      health.services.ocr = 'offline';
    }
    
    // Check FHIR Service
    try {
      const fhirStatus = await FHIRService.getCapabilities();
      health.services.fhir = fhirStatus.status === 'active' ? 'healthy' : 'degraded';
    } catch {
      health.services.fhir = 'offline';
    }
    
    // Check DICOM Service
    try {
      const dicomStatus = await DicomService.getStatus();
      health.services.dicom = dicomStatus.Status === 'Running' ? 'healthy' : 'degraded';
    } catch {
      health.services.dicom = 'offline';
    }
    
    // Determine overall health
    const statuses = Object.values(health.services);
    health.overall = statuses.every(s => s === 'healthy') ? 'healthy' : 'degraded';
    
    return health;
  }
};

function initializeLiteratureSearch() {
  const form = document.getElementById('literatureSearchForm');
  const queryInput = document.getElementById('literatureQuery');
  const resultsContainer = document.getElementById('literatureResults');
  if (!form || !queryInput || !resultsContainer) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const sources = Array.from(form.parentElement.querySelectorAll('.source-filters input:checked'))
      .map(input => input.value);
    resultsContainer.textContent = 'Searching public references...';
    const searchResponse = await MedicalSearch.search(queryInput.value, { sources: sources.join(',') });
    resultsContainer.textContent = '';
    if (searchResponse.error || !searchResponse.results?.length) {
      resultsContainer.textContent = searchResponse.error || 'No matching references were found.';
      return;
    }
    searchResponse.results.forEach(result => {
      const article = document.createElement('article');
      article.className = 'literature-result';
      article.innerHTML = '<a target="_blank" rel="noopener noreferrer"></a><p></p><small></small>';
      article.querySelector('a').href = result.url;
      article.querySelector('a').textContent = result.title;
      article.querySelector('p').textContent = result.content;
      article.querySelector('small').textContent = result.engine;
      resultsContainer.appendChild(article);
    });
    if (document.getElementById('semanticSearchToggle').checked) {
      const semanticResponse = await SemanticSearch.search(queryInput.value);
      if (!semanticResponse.error && semanticResponse.summary) {
        const summary = document.createElement('p');
        summary.className = 'semantic-summary';
        summary.textContent = `Summary for clinician review: ${semanticResponse.summary}`;
        resultsContainer.prepend(summary);
      }
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeLiteratureSearch);
}

// ============================================================================
// EXPORTS - Make available globally for integration
// ============================================================================

// Make services available globally
if (typeof window !== 'undefined') {
  window.CuraServices = {
    OCRService,
    FHIRService,
    DicomService,
    MedicalSearch,
    SemanticSearch,
    MedicalWorkflow,
    ServiceHealth
  };
}

// Also export as module for bundled environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OCRService,
    FHIRService,
    DicomService,
    MedicalSearch,
    SemanticSearch,
    MedicalWorkflow,
    ServiceHealth
  };
}
