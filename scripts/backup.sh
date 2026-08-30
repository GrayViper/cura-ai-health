#!/bin/bash

# Backup persistent clinical data. Store the output outside the host running Docker.
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

docker compose exec -T mysql mysqldump \
  -u"${DB_USER:-hapi_user}" \
  -p"${DB_PASSWORD:-hapi_pass123}" \
  hapi_fhir > "$BACKUP_DIR/hapi_fhir_$STAMP.sql"

docker run --rm \
  -v cura-ai-health_orthanc-storage:/source:ro \
  -v "$(cd "$BACKUP_DIR" && pwd):/backup" \
  alpine:3.20 tar czf "/backup/orthanc_$STAMP.tar.gz" -C /source .

echo "Backup created in $BACKUP_DIR"