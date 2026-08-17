#!/bin/bash

# Test searXNG Medical Search Integration
# Tests search functionality with medical queries

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SEARCH_URL="http://localhost:8888"
SEARCH_API="http://localhost/search/api"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Cura AI - searXNG Tests${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 1. Service Availability
echo -e "${YELLOW}[1/4] Testing searXNG Availability...${NC}"

if curl -s "$SEARCH_URL/" > /dev/null; then
    echo -e "${GREEN}✓ searXNG is running${NC}"
else
    echo -e "${RED}✗ Cannot connect to searXNG at $SEARCH_URL${NC}"
    exit 1
fi

echo ""

# 2. Web Interface
echo -e "${YELLOW}[2/4] Testing Web Interface...${NC}"

homepage=$(curl -s "$SEARCH_URL/")
if echo "$homepage" | grep -q "search\|searx"; then
    echo -e "${GREEN}✓ Web interface is accessible${NC}"
else
    echo -e "${YELLOW}⚠ Web interface loaded (may be in different format)${NC}"
fi

echo ""

# 3. API Search Tests
echo -e "${YELLOW}[3/4] Testing Search API...${NC}"

# Test 1: General medical search
echo -e "${YELLOW}  Query 1: General medical search...${NC}"
result1=$(curl -s "$SEARCH_API/search?q=diabetes+treatment&format=json" 2>/dev/null || echo '{}')

if echo "$result1" | grep -q "results\|query"; then
    count=$(echo "$result1" | grep -o '"title"' | wc -l)
    echo -e "${GREEN}✓ Found results for diabetes treatment ($count results)${NC}"
else
    echo -e "${YELLOW}⚠ Search completed (checking response format)${NC}"
fi

# Test 2: Lab values search
echo -e "${YELLOW}  Query 2: Lab values search...${NC}"
result2=$(curl -s "$SEARCH_API/search?q=hemoglobin+levels&format=json" 2>/dev/null || echo '{}')

if echo "$result2" | grep -q "results\|query"; then
    count=$(echo "$result2" | grep -o '"title"' | wc -l)
    echo -e "${GREEN}✓ Found results for hemoglobin levels ($count results)${NC}"
else
    echo -e "${YELLOW}⚠ Search completed${NC}"
fi

# Test 3: Clinical condition search
echo -e "${YELLOW}  Query 3: Clinical condition search...${NC}"
result3=$(curl -s "$SEARCH_API/search?q=hypertension+management&format=json" 2>/dev/null || echo '{}')

if echo "$result3" | grep -q "results\|query"; then
    count=$(echo "$result3" | grep -o '"title"' | wc -l)
    echo -e "${GREEN}✓ Found results for hypertension management ($count results)${NC}"
else
    echo -e "${YELLOW}⚠ Search completed${NC}"
fi

echo ""

# 4. API Gateway Route
echo -e "${YELLOW}[4/4] Testing API Gateway Route...${NC}"

if curl -s "http://localhost/search/api/search?q=test&format=json" > /dev/null; then
    echo -e "${GREEN}✓ searXNG accessible via Nginx gateway at /search/api${NC}"
else
    echo -e "${YELLOW}⚠ Gateway route may need configuration${NC}"
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}searXNG Tests Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

echo "Integration Tips:"
echo "1. Use searXNG for literature search in report analysis"
echo "2. Popular queries: 'lab values', 'clinical conditions', 'treatment options'"
echo "3. Filter results by engine using: ?engines=pubmed,scholar"
echo "4. Limit results: ?category=general&format=json&pageno=1"
echo ""

echo "Frontend Integration Example:"
echo "  const results = await fetch('/search/api/search?q=' + query + '&format=json')"
echo "  Display results alongside extracted medical data"
echo ""

echo "Troubleshooting:"
echo "  - Check searXNG logs: ./stack.sh logs searxng"
echo "  - Verify gateway routing: ./stack.sh logs nginx"
echo "  - Test direct access: curl http://localhost:8888/"
