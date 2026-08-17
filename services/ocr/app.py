"""
OCR Microservice for Cura AI Health
Extracts text and structured data from medical images and PDFs
"""

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import json
import os
from datetime import datetime
import logging

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = '/tmp/ocr'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'tiff', 'bmp'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_image(image_path):
    """Extract text from image using Tesseract OCR"""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return None


def extract_text_from_pdf(file_content):
    """Extract text from PDF by converting pages to images"""
    try:
        images = convert_from_bytes(file_content, first_page=1, last_page=5)  # First 5 pages
        extracted_text = []
        
        for page_num, image in enumerate(images, 1):
            text = pytesseract.image_to_string(image)
            extracted_text.append({
                "page": page_num,
                "text": text
            })
        
        return extracted_text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return None


def parse_medical_fields(text):
    """
    Basic parser to extract common medical fields
    This is a simple implementation - enhance with NLP for production
    """
    fields = {
        "raw_text": text,
        "parsed_fields": {}
    }
    
    # Simple pattern matching for common medical fields
    text_lower = text.lower()
    
    # Look for date patterns (simplified)
    if 'date' in text_lower:
        fields["parsed_fields"]["has_date"] = True
    
    # Look for patient identifiers
    if 'patient' in text_lower or 'name' in text_lower:
        fields["parsed_fields"]["has_patient_info"] = True
    
    # Look for lab values
    if any(term in text_lower for term in ['hemoglobin', 'glucose', 'cholesterol', 'hematocrit', 'wbc', 'rbc', 'plt']):
        fields["parsed_fields"]["has_lab_values"] = True
    
    # Look for imaging reports
    if any(term in text_lower for term in ['image', 'imaging', 'xray', 'ct', 'mri', 'ultrasound']):
        fields["parsed_fields"]["has_imaging_report"] = True
    
    return fields


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "cura-ocr-service",
        "timestamp": datetime.utcnow().isoformat()
    }), 200


@app.route('/api/v1/ocr/extract', methods=['POST'])
def extract_ocr():
    """
    Extract text from uploaded image or PDF
    
    Request:
        - file: Image or PDF file
        - extract_fields: Boolean (default: True) - Parse medical fields
    
    Response:
        - text: Extracted text
        - fields: Parsed medical fields (optional)
        - pages: For PDFs, per-page extraction
    """
    try:
        # Validate file exists
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
        # Save temporary file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Extract based on file type
        ext = filename.rsplit('.', 1)[1].lower()
        
        if ext == 'pdf':
            file_content = file.read()
            file.seek(0)
            file_content = file.read()
            extraction_result = extract_text_from_pdf(file_content)
            if extraction_result is None:
                return jsonify({"error": "Failed to extract text from PDF"}), 500
            
            response = {
                "filename": filename,
                "file_type": "pdf",
                "pages": extraction_result,
                "full_text": "\n\n".join([page["text"] for page in extraction_result])
            }
        else:
            # Image file
            text = extract_text_from_image(file_path)
            if text is None:
                return jsonify({"error": "Failed to extract text from image"}), 500
            
            response = {
                "filename": filename,
                "file_type": "image",
                "text": text
            }
        
        # Parse medical fields if requested
        extract_fields = request.form.get('extract_fields', 'true').lower() == 'true'
        if extract_fields:
            full_text = response.get("full_text") or response.get("text", "")
            response["parsed_fields"] = parse_medical_fields(full_text)
        
        response["timestamp"] = datetime.utcnow().isoformat()
        
        # Cleanup temp file
        try:
            os.remove(file_path)
        except:
            pass
        
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"OCR extraction error: {e}")
        return jsonify({"error": f"OCR extraction failed: {str(e)}"}), 500


@app.route('/api/v1/ocr/batch', methods=['POST'])
def batch_ocr():
    """
    Process multiple files in batch
    
    Request:
        - files: Multiple file uploads
    
    Response:
        - results: Array of extraction results
        - total: Total files processed
        - successful: Number of successful extractions
    """
    try:
        if 'files' not in request.files:
            return jsonify({"error": "No files provided"}), 400
        
        files = request.files.getlist('files')
        results = []
        successful = 0
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                ext = filename.rsplit('.', 1)[1].lower()
                
                try:
                    if ext == 'pdf':
                        file_content = open(file_path, 'rb').read()
                        text_result = extract_text_from_pdf(file_content)
                        results.append({
                            "filename": filename,
                            "status": "success",
                            "pages": text_result
                        })
                    else:
                        text = extract_text_from_image(file_path)
                        results.append({
                            "filename": filename,
                            "status": "success",
                            "text": text
                        })
                    
                    successful += 1
                except Exception as e:
                    results.append({
                        "filename": filename,
                        "status": "error",
                        "error": str(e)
                    })
                
                try:
                    os.remove(file_path)
                except:
                    pass
        
        return jsonify({
            "total": len(files),
            "successful": successful,
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"Batch OCR error: {e}")
        return jsonify({"error": f"Batch processing failed: {str(e)}"}), 500


@app.route('/api/v1/status', methods=['GET'])
def status():
    """Get service status and capabilities"""
    return jsonify({
        "service": "cura-ocr-service",
        "version": "1.0.0",
        "status": "running",
        "capabilities": [
            "image_ocr",
            "pdf_ocr",
            "field_parsing",
            "batch_processing"
        ],
        "supported_formats": list(ALLOWED_EXTENSIONS),
        "max_file_size_mb": MAX_FILE_SIZE / (1024 * 1024)
    }), 200


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large"""
    return jsonify({"error": f"File too large. Maximum size: {MAX_FILE_SIZE / (1024 * 1024)}MB"}), 413


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    logger.error(f"Internal error: {error}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
