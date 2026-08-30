#!/bin/bash

# Orthanc REST API smoke test for the development stack.
set -e

ORTHANC_URL="${ORTHANC_URL:-http://localhost/orthanc}"

echo "Checking Orthanc API at $ORTHANC_URL"
curl --fail --silent --show-error \
  "$ORTHANC_URL/system" > /dev/null
echo "Orthanc system API: OK"

curl --fail --silent --show-error \
  "$ORTHANC_URL/patients" > /dev/null
echo "Orthanc patient API: OK"

echo "No upload fixture supplied; use DicomService.uploadDicom(file) or curl -u user:pass -X POST --data-binary @file.dcm $ORTHANC_URL/instances"