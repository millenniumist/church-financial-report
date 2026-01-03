<!--
Sync Impact Report:
- Version change: (New) -> 1.0.0
- List of modified principles: Established initial principles based on system architecture.
- Added sections: Core Principles (Component-Based, Schema-Driven, Secure by Design, Automated Integrity, Observability & Resilience), Governance.
- Removed sections: N/A
- Templates requiring updates: ✅ None (Generic templates align with principles).
- Follow-up TODOs: None.
-->
# cc-financial Constitution

## Core Principles

### I. Component-Based Architecture
UI and logic must be encapsulated in reusable, self-contained components.
Page files (`page.js`) should be minimal wrappers around feature-specific components.
Shared UI elements (buttons, inputs, cards) must reside in `components/ui` or `components/shared`.
State management should remain local to components unless global reach is strictly necessary (e.g., auth, user preferences).

### II. Schema-Driven Development
The database schema (`schema.prisma`) is the single source of truth for data structures.
Changes to the data model must begin with a schema migration, followed by client generation.
Type safety extends from the database layer to the frontend via generated types.
Do not bypass the ORM (Prisma) for raw SQL unless for specific performance-critical aggregation queries.

### III. Secure by Design
Authentication and authorization checks are mandatory for all `admin` routes and mutations.
Environment variables must be used for all secrets (API keys, database URLs); never hardcode credentials.
Public API endpoints must validate input strictly (Zod or similar) to prevent injection or malformed data.
Access control is enforced at the server-side (API route/Server Action) level, not just the client UI.

### IV. Automated Integrity
Every critical path (Financial Data Sync, Auth, Admin CRUD) must have verifiable behavior.
Health checks (`/api/health`) must accurately reflect the system's operational status (DB connection, external services).
Linting and type-checking must pass before any code is merged or deployed.
Tests (Unit/Integration) should act as a safety net for core business logic (e.g., financial calculations).

### V. Observability & Resilience
The system must log structured events for critical actions (errors, login attempts, data syncs).
Failover mechanisms (e.g., Database Hot-Swap) must be preserved and tested periodically.
External dependencies (Google Sheets, Cloudinary) must have error handling and fallback states (graceful degradation).
Performance metrics (response time, memory) should be monitored via the existing health monitor service.

## Governance

### Amendment Process
This Constitution supersedes all other project guidelines.
Amendments require a documented rationale, version bump, and a check of all dependent templates.
Any change to "Core Principles" requires a MINOR version bump (at minimum).
Removal or fundamental redefinition of a principle requires a MAJOR version bump.

### Compliance & Review
All Pull Requests must verify compliance with these principles.
Architectural decisions conflicting with these principles must be justified in the implementation plan ("Constitution Check").
Use `SYSTEM_ARCHITECTURE.md` for specific implementation details and `README.md` for setup guidance.

**Version**: 1.0.0 | **Ratified**: 2026-01-03 | **Last Amended**: 2026-01-03