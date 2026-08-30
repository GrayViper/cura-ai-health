#!/bin/bash

# Complete stack smoke test. Requires the Docker stack to be running.
set -e

BASE_URL="${BASE_URL:-http://localhost}"

check() {
  name="$1"
  url="$2"
  if curl --fail --silent --show-error "$url" > /dev/null; then
    echo "$name: OK"
  else
    echo "$name: FAILED"
    exit 1
  fi
}

check_status() {
  name="$1"
  expected="$2"
  url="$3"
  actual="$(curl --silent --output /dev/null --write-out '%{http_code}' "$url")"
  if [ "$actual" = "$expected" ]; then
    echo "$name: OK ($actual)"
  else
    echo "$name: FAILED ($actual, expected $expected)"
    exit 1
  fi
}

check "Nginx" "$BASE_URL/health"
check "Web application" "$BASE_URL/"
check "OCR health" "$BASE_URL/api/ocr/status"
check "FHIR metadata" "$BASE_URL/fhir/metadata"
if curl --fail --silent --show-error "$BASE_URL/orthanc/system" > /dev/null; then
  echo "Orthanc system: OK"
else
  echo "Orthanc system: FAILED"
  exit 1
fi
check_status "Search proxy PHI validation" "400" "$BASE_URL/api/search?q=patient%20MRN%20123-45-6789"