# Project Plan - LLM-Based Financial Analyzer

Milestones & Timeline (suggested for 12 weeks):

1. Week 1-2: Project setup & scaffolding
   - Create agent prompt, repo structure, Docker and CI skeletons.
   - Deliverables: README, agent_prompt, Dockerfile, Jenkinsfile.

2. Week 3-4: Ingestion & embedding pipeline
   - Implement document parsers (PDF, CSV), chunking, embedding, and Chroma ingestion.
   - Deliverables: ingestion module, tests, sample dataset.

3. Week 5-6: Retrieval + RAG answering
   - Build query endpoint, retriever, and LLM answer composition.
   - Deliverables: /query endpoint; example queries and tests.

4. Week 7-8: Anomaly detection & explainability
   - Implement IsolationForest and Autoencoder detectors; integrate SHAP explanations.
   - Deliverables: anomaly module and explanation outputs.

5. Week 9-10: Backend & frontend integration
   - Scaffold Spring Boot backend APIs and React frontend pages.
   - Deliverables: basic UI for upload and dashboard; API contract.

6. Week 11: CI/CD and deployment
   - Configure Jenkins pipeline, Docker images, and docker-compose for local demo.

7. Week 12: Final report, testing, and demo
   - Assemble documentation, Postman collection, and demo runbook.

Risks & Mitigations:
- API keys/external services cost: Use smaller LLMs and local vector DB during development.
- Time constraints: Prioritize a working MVP (ingest -> query -> explain) before full microservices.

Next immediate tasks:
- Implement a minimal FastAPI app with health, ingest, and query endpoints (see `requirements.txt`).
- Add unit tests for PDF parsing and embedding.
