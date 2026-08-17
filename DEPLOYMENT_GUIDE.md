# Cura AI Health - Self-Hosted Medical Stack

A complete, containerized medical record scanning and analysis stack combining:
- **OCR Service**: Extract text from medical images and PDFs
- **Orthanc**: DICOM medical imaging storage
- **HAPI FHIR**: Clinical data standards server
- **searXNG**: Private medical literature search
- **Nginx**: Reverse proxy with API gateway

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                 Cura AI Health Frontend                 │
│          (React App + Medical Report Analysis)          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Nginx Reverse Proxy (Port 80/443)          │
│  Routes & Load Balancing & TLS Termination              │
└────┬──────────────────────┬──────────────────────┬──────┘
     │                      │                      │
     ▼                      ▼                      ▼
 ┌────────────┐      ┌──────────────┐      ┌───────────┐
 │ OCR Service│      │   Orthanc    │      │HAPI FHIR  │
 │(Port 5000) │      │ DICOM Server │      │(Port 8080)│
 │            │      │(Port 8042)   │      │           │
 │ Tesseract  │      │              │      │ MySQL DB  │
 │ Flask API  │      │ DICOM Storage│      │           │
 └────────────┘      └──────────────┘      └───────────┘
                            │
                     ┌──────▼──────┐
                     │   searXNG   │
                     │   Search    │
                     │(Port 8888)  │
                     └─────────────┘
```

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 10GB free disk space
- Linux/Mac with bash, or Windows with WSL2

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd cura-ai-health
   ```

2. **Create environment file**
   ```bash
   cp .env.template .env
   # Review and update sensitive values in .env
   ```

3. **Start the stack**
   ```bash
   # Make script executable (Linux/Mac)
   chmod +x stack.sh
   
   # Start all services
   ./stack.sh start
   
   # Or use Docker Compose directly
   docker-compose up -d
   ```

4. **Verify services are running**
   ```bash
   ./stack.sh status
   # or
   docker-compose ps
   ```

5. **Run health checks**
   ```bash
   ./stack.sh test
   ```

### Service Access

Once running, services are available at:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost | - |
| **OCR API** | http://localhost/api/ocr/ | - |
| **Orthanc DICOM** | http://localhost:8042 | orthanc / orthanc123 |
| **HAPI FHIR** | http://localhost/fhir/ | - |
| **searXNG Search** | http://localhost:8888 | - |

## Service Details

### OCR Service (Port 5000)
Extracts text from medical images and PDFs using Tesseract OCR.

**API Endpoints:**

#### Extract from single file
```bash
curl -X POST http://localhost/api/ocr/extract \
  -F "file=@medical_report.pdf" \
  -F "extract_fields=true"
```

**Response:**
```json
{
  "filename": "medical_report.pdf",
  "file_type": "pdf",
  "pages": [
    {
      "page": 1,
      "text": "Extracted text from page 1..."
    }
  ],
  "full_text": "Complete extracted text...",
  "parsed_fields": {
    "has_date": true,
    "has_patient_info": true,
    "has_lab_values": true
  },
  "timestamp": "2026-08-17T10:30:45.123456"
}
```

#### Batch processing
```bash
curl -X POST http://localhost/api/ocr/batch \
  -F "files=@report1.pdf" \
  -F "files=@report2.jpg" \
  -F "files=@report3.png"
```

#### Service status
```bash
curl http://localhost/api/ocr/status
```

### Orthanc DICOM Server (Port 8042)
Medical imaging server supporting DICOM standard.

**Web UI:** http://localhost:8042  
**REST API:** http://localhost:8042/api/

**Sample Operations:**
```bash
# List patients
curl -u orthanc:orthanc123 http://localhost:8042/api/patients

# List studies
curl -u orthanc:orthanc123 http://localhost:8042/api/studies

# Upload DICOM file
curl -u orthanc:orthanc123 --data-binary @sample.dcm \
  http://localhost:8042/api/instances
```

### HAPI FHIR Server (Port 8080)
Standards-based clinical data server.

**API Base:** http://localhost/fhir/

**Sample Operations:**
```bash
# Create a Patient
curl -X POST http://localhost/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "name": [{"given": ["John"], "family": "Doe"}],
    "gender": "male"
  }'

# Search patients
curl http://localhost/fhir/Patient?family=Doe

# Create an Observation
curl -X POST http://localhost/fhir/Observation \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Observation",
    "status": "final",
    "code": {"coding": [{"system": "http://loinc.org", "code": "2345-7"}]},
    "valueQuantity": {"value": 11.0, "unit": "g/dL"}
  }'
```

### searXNG Search Engine (Port 8888)
Privacy-focused metasearch for medical literature.

**Web UI:** http://localhost:8888  
**API:** http://localhost:8888/api/search

**Usage:**
```bash
# Search medical literature
curl "http://localhost:8888/api/search?q=diabetes+treatment&format=json"

# Advanced search
curl "http://localhost:8888/api/search?q=hemoglobin+levels&engines=pubmed,scholar&format=json"
```

## Frontend Integration

### OCR Integration
```javascript
// In app.js
async function extractTextFromFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('extract_fields', 'true');
  
  const response = await fetch('/api/ocr/extract', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}
```

### searXNG Integration
```javascript
// Search medical literature
async function searchMedicalLiterature(query) {
  const response = await fetch(
    `/search/api/search?q=${encodeURIComponent(query)}&format=json`
  );
  const results = await response.json();
  return results.results;
}
```

### FHIR Integration
```javascript
// Create FHIR observation from OCR data
async function createObservation(patientId, labValue, unit) {
  const observation = {
    resourceType: "Observation",
    status: "final",
    subject: { reference: `Patient/${patientId}` },
    code: { coding: [{ system: "http://loinc.org", code: "2345-7" }] },
    valueQuantity: { value: labValue, unit: unit }
  };
  
  const response = await fetch('/fhir/Observation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify(observation)
  });
  
  return await response.json();
}
```

## Management Commands

### Using the stack management script

```bash
# Start all services
./stack.sh start

# Stop all services
./stack.sh stop

# Restart specific service
./stack.sh restart

# View logs
./stack.sh logs                    # All services
./stack.sh logs ocr-service        # Specific service

# Health checks
./stack.sh test

# Rebuild images
./stack.sh rebuild

# Clean up (removes containers and volumes)
./stack.sh clean

# View status
./stack.sh status
```

### Using Docker Compose directly

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f [service-name]

# Build
docker-compose build

# Execute command in container
docker-compose exec ocr-service pytest
```

## Configuration

### Environment Variables (.env)

```bash
# Orthanc
ORTHANC_PASSWORD=orthanc123

# Database
DB_USER=hapi_user
DB_PASSWORD=hapi_pass123
DB_ROOT_PASSWORD=root_pass123

# searXNG
SEARXNG_BASE_URL=http://localhost:8888
```

### Service Configuration Files

- `config/nginx.conf` - Reverse proxy routing
- `config/orthanc.json` - DICOM server settings
- `config/searxng-settings.yml` - Search engine configuration
- `config/mysql-init.sql` - Database initialization
- `services/ocr/requirements.txt` - Python dependencies

## Security Considerations

### Current State (Development)
- ✓ Basic authentication for Orthanc
- ✓ Container network isolation
- ✗ HTTPS disabled (for local development)
- ✗ No firewall rules
- ✗ Default passwords

### Production Deployment
1. **Enable HTTPS**
   - Uncomment HTTPS blocks in `nginx.conf`
   - Use Let's Encrypt certificates

2. **Change Credentials**
   - Update all `.env` values
   - Use strong passwords (32+ chars)

3. **Network Security**
   - Firewall: Only expose Nginx ports (80, 443)
   - Internal network isolation
   - API authentication tokens

4. **Data Security**
   - Enable disk encryption
   - Regular backups
   - PHI handling compliance (HIPAA)

5. **Access Control**
   - OAuth2/OIDC integration
   - Role-based access (RBAC)
   - Audit logging

## Testing

### Health Checks
```bash
./stack.sh test
```

### Manual API Testing

```bash
# OCR Service
curl http://localhost/api/ocr/status

# Orthanc
curl -u orthanc:orthanc123 http://localhost:8042/system

# HAPI FHIR
curl http://localhost/fhir/metadata

# searXNG
curl http://localhost:8888/
```

### Test Data
Place sample medical images/PDFs in a `test-data/` directory:
```bash
mkdir -p test-data
cp your-medical-report.pdf test-data/
./scripts/test-ocr.sh test-data/your-medical-report.pdf
```

## Troubleshooting

### Service won't start
```bash
# Check logs
./stack.sh logs

# Verify Docker is running
docker ps

# Rebuild images
./stack.sh rebuild
```

### Port conflicts
```bash
# Find process using port
lsof -i :8042  # For Orthanc
# or on Windows
netstat -ano | findstr :8042

# Stop container and retry
docker-compose down
./stack.sh start
```

### Database connection issues
```bash
# Check MySQL status
./stack.sh logs mysql

# Verify connection
docker-compose exec mysql mysql -u hapi_user -p -D hapi_fhir -e "SELECT 1"
```

### OCR not extracting text
```bash
# Test tesseract
docker-compose exec ocr-service tesseract --version

# Check file permissions
docker-compose exec ocr-service ls -la /tmp/ocr
```

## Performance Optimization

- OCR workers: Adjust `WORKERS` in `.env` based on CPU cores
- MySQL buffer pool: Edit `docker-compose.yml` for `hapi-fhir` service
- Nginx caching: Configure in `config/nginx.conf`
- Volume mounts: Use native drivers for performance

## Backup & Recovery

### Backup databases
```bash
# HAPI FHIR
docker-compose exec mysql mysqldump -u root -p hapi_fhir > backup_hapi.sql

# Orthanc
docker cp cura-orthanc:/var/lib/orthanc/db ./orthanc-backup
```

### Restore databases
```bash
# HAPI FHIR
cat backup_hapi.sql | docker-compose exec -T mysql mysql -u root -p hapi_fhir

# Orthanc
docker cp ./orthanc-backup cura-orthanc:/var/lib/orthanc/db
```

## Next Steps

1. **Integrate with frontend** - Add API calls to `app.js`
2. **Add authentication** - Implement OAuth2/JWT tokens
3. **Enable HTTPS** - Generate certificates for production
4. **Deploy to cloud** - Use Kubernetes or cloud container services
5. **Add monitoring** - Prometheus + Grafana for metrics
6. **Implement HIPAA compliance** - Audit logging, encryption, access control

## Support & Documentation

- **Orthanc Book**: https://book.orthanc-server.com/
- **HAPI FHIR Docs**: https://hapifhir.io/
- **searXNG Docs**: https://docs.searxng.org/
- **FHIR Standards**: https://www.hl7.org/fhir/

## License

This project is part of Cura AI Health. See LICENSE for details.

## Additional Resources

- [DICOM Standard](https://www.dicomstandard.org/)
- [FHIR Implementation Guides](https://www.hl7.org/fhir/implementation/)
- [Medical Imaging Best Practices](https://www.dicomstandard.org/overview/)
- [Healthcare Data Security](https://www.hhs.gov/hipaa/)
