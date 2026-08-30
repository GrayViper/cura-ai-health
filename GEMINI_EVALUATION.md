# Semantic Search Evaluation

Gemini is intentionally not enabled by default. Medical search requests must be sanitized before leaving the local network, and deployment must have an enterprise agreement covering retention, training use, regional processing, and incident response before hosted-model use.

The current `/api/search` contract is provider-neutral:

```text
GET /api/search?q=<query>&sources=pubmed,nih,who,cdc
```

It returns `{ query, sources, results, disclaimer }`. A future semantic layer can consume the normalized `results` array, but must remain opt-in, receive only de-identified text, expose provenance for every summary, enforce a request quota, and fail closed when its budget or privacy policy is exceeded.

No API key, patient data, or hosted-model dependency belongs in this repository.
