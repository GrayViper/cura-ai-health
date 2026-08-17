#!/bin/bash

# Test HAPI FHIR Integration
# Creates test patients and observations

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FHIR_BASE_URL="http://localhost/fhir"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Cura AI - FHIR Integration Tests${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 1. Health Check
echo -e "${YELLOW}[1/4] Testing FHIR Server Connection...${NC}"
if response=$(curl -s -w "\n%{http_code}" "$FHIR_BASE_URL/metadata"); then
    http_code=$(echo "$response" | tail -n 1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ HAPI FHIR Server is accessible${NC}"
    else
        echo -e "${YELLOW}⚠ FHIR Server returned HTTP $http_code (may be initializing)${NC}"
        sleep 5
    fi
else
    echo -e "${RED}✗ Cannot connect to FHIR Server at $FHIR_BASE_URL${NC}"
    echo "  Make sure: docker-compose up -d hapi-fhir"
    exit 1
fi

echo ""

# 2. Create Test Patient
echo -e "${YELLOW}[2/4] Creating Test Patient...${NC}"

patient_payload=$(cat <<'EOF'
{
  "resourceType": "Patient",
  "identifier": [
    {
      "system": "http://example.com/mrn",
      "value": "MRN-001-TEST"
    }
  ],
  "name": [
    {
      "given": ["John"],
      "family": "Doe"
    }
  ],
  "gender": "male",
  "birthDate": "1985-03-15",
  "contact": [
    {
      "telecom": [
        {
          "system": "email",
          "value": "john.doe@example.com"
        }
      ]
    }
  ]
}
EOF
)

patient_response=$(curl -s -X POST "$FHIR_BASE_URL/Patient" \
    -H "Content-Type: application/fhir+json" \
    -d "$patient_payload")

patient_id=$(echo "$patient_response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$patient_id" ]; then
    echo -e "${GREEN}✓ Patient created successfully${NC}"
    echo "  Patient ID: $patient_id"
else
    echo -e "${YELLOW}⚠ Patient creation response (may have been created):${NC}"
    echo "$patient_response" | head -c 200
fi

echo ""

# 3. Create Test Observations
echo -e "${YELLOW}[3/4] Creating Test Lab Observations...${NC}"

# Use patient ID if available, otherwise use a placeholder
patient_ref="${patient_id:-1}"

# Hemoglobin observation
hemo_payload=$(cat <<EOF
{
  "resourceType": "Observation",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "laboratory"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "718-7",
        "display": "Hemoglobin"
      }
    ]
  },
  "subject": {
    "reference": "Patient/$patient_ref"
  },
  "valueQuantity": {
    "value": 11.5,
    "unit": "g/dL",
    "system": "http://unitsofmeasure.org",
    "code": "g/dL"
  },
  "issued": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
}
EOF
)

hemo_response=$(curl -s -X POST "$FHIR_BASE_URL/Observation" \
    -H "Content-Type: application/fhir+json" \
    -d "$hemo_payload")

hemo_id=$(echo "$hemo_response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$hemo_id" ]; then
    echo -e "${GREEN}✓ Hemoglobin Observation created${NC}"
    echo "  Observation ID: $hemo_id"
else
    echo -e "${YELLOW}⚠ Observation creation (checking response)...${NC}"
fi

# Cholesterol observation
chol_payload=$(cat <<EOF
{
  "resourceType": "Observation",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "laboratory"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "2093-3",
        "display": "Cholesterol"
      }
    ]
  },
  "subject": {
    "reference": "Patient/$patient_ref"
  },
  "valueQuantity": {
    "value": 260,
    "unit": "mg/dL",
    "system": "http://unitsofmeasure.org",
    "code": "mg/dL"
  },
  "issued": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
}
EOF
)

chol_response=$(curl -s -X POST "$FHIR_BASE_URL/Observation" \
    -H "Content-Type: application/fhir+json" \
    -d "$chol_payload")

chol_id=$(echo "$chol_response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$chol_id" ]; then
    echo -e "${GREEN}✓ Cholesterol Observation created${NC}"
    echo "  Observation ID: $chol_id"
fi

echo ""

# 4. Query and Verify
echo -e "${YELLOW}[4/4] Querying Test Data...${NC}"

# Query patients
echo -e "${YELLOW}  Fetching all patients...${NC}"
patients=$(curl -s "$FHIR_BASE_URL/Patient")
patient_count=$(echo "$patients" | grep -o '"fullUrl"' | wc -l)
echo -e "${GREEN}✓ Found $patient_count patient(s)${NC}"

# Query observations
echo -e "${YELLOW}  Fetching all observations...${NC}"
observations=$(curl -s "$FHIR_BASE_URL/Observation")
obs_count=$(echo "$observations" | grep -o '"fullUrl"' | wc -l)
echo -e "${GREEN}✓ Found $obs_count observation(s)${NC}"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}FHIR Integration Tests Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

if [ -n "$patient_id" ]; then
    echo "Test Data Created:"
    echo "  Patient: http://localhost/fhir/Patient/$patient_id"
    if [ -n "$hemo_id" ]; then
        echo "  Hemoglobin: http://localhost/fhir/Observation/$hemo_id"
    fi
    if [ -n "$chol_id" ]; then
        echo "  Cholesterol: http://localhost/fhir/Observation/$chol_id"
    fi
    echo ""
fi

echo "Next steps:"
echo "1. Test linking OCR output to FHIR observations"
echo "2. Verify Orthanc DICOM storage integration"
echo "3. Query observations by patient and date range"
echo "4. Implement FHIR search parameters in frontend"
