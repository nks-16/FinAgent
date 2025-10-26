```markdown
---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

Additional project-wide requirements:

- Architecture: Follow a microservice architecture for major components (ingestion, embeddings/vector-store, RAG/LLM service, anomaly detection, backend API, and frontend). Each microservice should have a clear API contract, its own Dockerfile, and minimal infra configuration so it can run independently. Keep interfaces between services explicit (OpenAPI/REST contracts or gRPC proto) and versioned.

- Design principles: Adhere to SOLID single-responsibility and dependency inversion principles in all produced code. Use small classes or functions, depend on abstractions (interfaces) in higher-level modules, and prefer composition over inheritance when extending behavior.

- Implementation workflow (MANDATORY for the assistant): After implementing any feature or module the agent MUST follow this sequence:
  1. Announce what was created: list of files changed/added and a 1–2 sentence description of the change.
  2. Request explicit permission from the user before committing/pushing or proceeding to the next task. The agent should wait for the user's approval.
  3. Run a minimal verification step: run unit tests, a health endpoint, or a smoke test relevant to the change. Report PASS/FAIL and attach test output or error traces.
  4. Only after the user gives permission and verification passes, mark the step completed in the project todo list and proceed.

- Testing & verification: Add at least one automated test (pytest or equivalent) for critical behavior (parsers, ingestion, health endpoints). Tests should be runnable locally. The agent should run those tests automatically after implementing the module and report the results.

- Communication & contracts: For any public API or service interface change, include a short contract describing:
  - Inputs (types, required/optional fields)
  - Outputs (success response, error responses with status codes)
  - Error modes and how the client should handle them
  - Success criteria (what counts as a working implementation)

These rules are repository-level policies the assistant must obey when generating code, editing files, or performing automated changes.
```
---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.