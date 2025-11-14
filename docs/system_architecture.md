# System Architecture

## Overview

GridironHub backend uses a TypeScript Express API hosted on Node.js, with Supabase providing authentication, Postgres storage, and object storage for media. Clients (web and future mobile apps) interact exclusively through REST endpoints under `/api`, using JWTs issued by Supabase Auth.

## Core Components

- **Express API (`server/`):** Provides routing, validation, and response formatting. Organized into feature modules (`auth`, `profiles`, `teams`, `trainings`, `drills`, `highlights`).
- **Supabase Services:** Managed via Supabase JS client using persisted service role key (server-side) and user tokens (client-side). Handles authentication, Postgres DB, and storage buckets for highlight videos.
- **Configuration Layer:** Environment-driven settings loaded through `dotenv` with runtime validation to ensure required secrets are present.
- **Middleware Stack:**
  - Request logging (pino or winston).
  - JSON body parsing and compression.
  - Role-based access control enforcing coach/player boundaries.
  - Error normalization for consistent API errors.
- **Validation:** Zod (or equivalent) schemas ensure payload integrity before hitting business logic.

## Authentication Flow

1. User submits credentials through the landing page with selected role.
2. Supabase Auth verifies credentials and returns session token plus user metadata (including role).
3. Client stores access token; subsequent API calls include `Authorization: Bearer <token>`.
4. Express middleware validates token via Supabase JWT verifier and loads user context (id, role, team memberships).
5. Role-based guard checks the route's required permissions (e.g., only coaches may mutate team settings).

## Data Access Patterns

- Each module exposes a service layer wrapping Supabase client helpers; these services perform queries against the Postgres schema defined in `/docs/data_model.md`.
- Services never accept raw request objects; they receive validated DTOs.
- Transactions (via Supabase Postgres RPC or multi-statement SQL) enforce consistency for multi-table updates such as training session creation with associated drills.
- Read operations leverage filtered queries with pagination for scalable lists (e.g., highlight library).
- Caching layer may be added later (Redis) for read-heavy endpoints like public team pages.

## Module Boundaries

- **Auth Module:** Login, session refresh, role verification utilities.
- **Profiles Module:** CRUD for player and coach profiles, including personal metrics and bio data.
- **Teams Module:** Team creation, roster assignment, and customization controls (media, announcements).
- **Trainings Module:** Session scheduling, attendance tracking, drill assignments.
- **Drills Module:** Drill definitions with instructions, tags, and media references.
- **Highlights Module:** Manage highlight video metadata and storage links.

## Deployment Considerations

- Environment-specific configuration files for development vs production.
- Supabase project keys stored in secret managers (e.g., Supabase dashboard, GitHub Actions secrets).
- CI pipeline to run lint, type checks, and tests on pull requests.
- Production monitoring with structured logs, metrics (OpenTelemetry), and alerting hooks.
