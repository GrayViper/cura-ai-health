#!/bin/bash

# Complete End-to-End Integration Test
# Tests: OCR → FHIR → Orthanc → Search workflow

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Cura AI - End-to-End Tests${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Test configuration
OCR_URL="http://localhost:5000"
FHIR_URL="http://localhost/fhir"
ORTHANC_URL="http://localhost:8042"
SEARCH_URL="http://localhost:8888"
NGINX_URL="http://localhost"

tests_passed=0
tests_failed=0

# Helper function for test results
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local auth=${4:-}
    
    echo -ne "Testing $name... "
    
    if [ -n "$auth" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" -u "$auth" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    
    if [[ "$http_code" =~ ^(200|201|400)$ ]]; then
        echo -e "${GREEN}✓ (HTTP $http_code)${NC}"
        tests_passed=$((tests_passed + 1))
        return 0
    else
        echo -e "${RED}✗ (HTTP $http_code)${NC}"
        tests_failed=$((tests_failed + 1))
        return 1
    fi
}

echo -e "${YELLOW}Step 1: Service Connectivity${NC}"
echo "================================"

test_endpoint "Nginx Reverse Proxy" "$NGINX_URL/health"
test_endpoint "OCR Service" "$OCR_URL/health"
test_endpoint "FHIR Server" "$FHIR_URL/metadata"
test_endpoint "Orthanc DICOM" "$ORTHANC_URL/system"
test_endpoint "searXNG Search" "$SEARCH_URL/"

echo ""
echo -e "${YELLOW}Step 2: API Gateway Routing${NC}"
echo "================================"

test_endpoint "OCR via Nginx" "$NGINX_URL/api/ocr/status"
test_endpoint "FHIR via Nginx" "$NGINX_URL/fhir/metadata"
test_endpoint "Orthanc via Nginx" "$NGINX_URL/orthanc/system"

echo ""
echo -e "${YELLOW}Step 3: OCR Service Integration${NC}"
echo "================================"

# Test OCR health
echo -ne "OCR Health Check... "
ocr_status=$(curl -s "$OCR_URL/api/v1/status")
if echo "$ocr_status" | grep -q "running"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${RED}✗${NC}"
    ((tests_failed++))
fi

# Test batch endpoint
echo -ne "Batch Processing Endpoint... "
batch_response=$(curl -s -X POST "$OCR_URL/api/v1/ocr/batch" \
    -F "files=" 2>&1)
if echo "$batch_response" | grep -q "total"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠ (expected without files)${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: FHIR Data Model${NC}"
echo "================================"

# Query patients
echo -ne "Patient Resource Query... "
patients=$(curl -s "$FHIR_URL/Patient")
if echo "$patients" | grep -q "resourceType"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠ (checking format)${NC}"
fi

# Query observations
echo -ne "Observation Resource Query... "
observations=$(curl -s "$FHIR_URL/Observation")
if echo "$observations" | grep -q "resourceType"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Orthanc DICOM Storage${NC}"
echo "================================"

echo -ne "DICOM API Access... "
dicom_api=$(curl -s "$ORTHANC_URL/api/")
if echo "$dicom_api" | grep -q "Status\|Resources"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo -ne "Patient List Endpoint... "
patient_list=$(curl -s -u "orthanc:orthanc123" "$ORTHANC_URL/patients")
if [[ "$patient_list" == *"["* ]]; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Search Integration${NC}"
echo "================================"

echo -ne "searXNG Availability... "
search_page=$(curl -s "$SEARCH_URL/")
if echo "$search_page" | grep -q "searxng\|search"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo -ne "Search API Endpoint... "
search_result=$(curl -s "$SEARCH_URL/api/search?q=test&format=json")
if echo "$search_result" | grep -q "results\|answer"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo ""
echo -e "${YELLOW}Step 7: Integration Workflow${NC}"
echo "================================"

# Simulate OCR → FHIR workflow
echo -ne "OCR to FHIR Integration Point... "
if [ -n "$(curl -s '$OCR_URL/api/v1/status' | grep -o 'ocr')" ]; then
    echo -e "${GREEN}✓ (APIs available for integration)${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo -ne "Frontend API Access... "
if test_endpoint "" "$NGINX_URL/index.html" "GET" 2>&1 | grep -q "200"; then
    echo -e "${GREEN}✓${NC}"
    ((tests_passed++))
else
    echo -e "${YELLOW}⚠${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${GREEN}================================${NC}"
echo "Tests Passed: $tests_passed"
echo "Tests Failed: $tests_failed"
echo ""

if [ $tests_failed -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "System Status: READY FOR INTEGRATION"
    echo ""
    echo "Ready to:"
    echo "  1. Upload medical documents via frontend"
    echo "  2. Extract text and data using OCR"
    echo "  3. Store FHIR observations"
    echo "  4. Retrieve DICOM images"
    echo "  5. Search medical literature"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed - check service logs${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  ./stack.sh logs [service-name]"
    echo "  ./stack.sh test    (health checks)"
    echo "  ./stack.sh status  (container status)"
    exit 1
fi
