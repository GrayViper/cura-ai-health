# Cura AI Health

#Demo
Check live demo at : https://grayviper.github.io/cura-ai-health/

Self-hosted clinical report analysis with browser-based parsing, OCR, Orthanc
DICOM storage, HAPI FHIR, and privacy-focused medical literature search.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

For the complete Docker stack, copy `.env.template` to `.env`, replace every
password, then run:

```bash
docker compose up -d --build
bash scripts/test-stack.sh
```

## Deployment Modes

- Development: `docker compose up -d --build`
- Staging HTTP: `bash stack.sh staging` on `http://localhost:8080`
- Production HTTPS and monitoring: `bash stack.sh production`
- Kubernetes: apply [k8s/cura-stack.yaml](k8s/cura-stack.yaml) after replacing
	image, hostname, TLS, storage, and secret values.

## Operations

- TLS material: `bash scripts/generate-certificates.sh`
- Orthanc credentials: `bash scripts/setup-authentication.sh`
- MySQL and Orthanc backup: `bash scripts/backup.sh`
- JavaScript and Python checks: `npm test`

Never use real patient information in development. See
[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for security, recovery, and
troubleshooting guidance.
