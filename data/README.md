# Sample Data

This folder contains small sample data to quickly demo ingestion and anomaly detection.

- `sample/financials.csv` — synthetic quarterly financials with one intentionally anomalous row (`MEGA,Q5,5000000,...`).

Usage:
- Ingestion (RAG): you can upload any `.txt`, `.csv`, `.tsv`, or `.pdf` via `/ingest`.
- Anomaly: upload `financials.csv` to `/anomaly/detect` (file upload), or send JSON `{ "records": [...] }`.
