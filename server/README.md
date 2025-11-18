# GridironHub API

TypeScript Express backend powered by Supabase for authentication, data, and media storage.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project credentials.
3. Run the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable                    | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `SUPABASE_URL`              | Project URL from Supabase dashboard (`Settings → API`).             |
| `SUPABASE_ANON_KEY`         | Public anon key used for user-scoped clients.                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used only on the server for privileged operations. |

> **Security:** Never expose the service role key to browsers or mobile apps. Keep it server-side only.

## Available Scripts

- `npm run dev` – Start Express with live reload via `ts-node-dev`.
- `npm run build` – Compile TypeScript into the `dist/` directory.
- `npm run start` – Run the compiled production build.
- `npm run lint` – Execute ESLint across the project.
- `npm run typecheck` – Validate TypeScript types without emitting output.
- `npm run format` – Check formatting with Prettier.
- `npm run format:write` – Apply Prettier formatting fixes.

## Authentication Endpoints

### Player Registration

- **POST** `/api/auth/register` – Public endpoint for players to create an account.
  - Payload: `{ email, password, fullName, teamId, position }`
  - `teamId`: UUID of the team (e.g., "Sakarya Tatankaları")
  - `position`: Player position (e.g., "QB", "WR", "RB", "LB", etc.)
  - Returns: Session tokens and user info (instant login)
  - Creates user with `role: "player"` and inserts into `player_profiles`
  - Automatically assigns player to selected team in `team_members` with selected position

### Coach Registration

- **POST** `/api/auth/invite-coach` – Public endpoint for coach registration (no authentication required).
  - Payload: `{ email, fullName, teamId, position }`
  - `teamId`: UUID of the team (e.g., "Sakarya Tatankaları")
  - `position`: Coach position (e.g., "Head Coach", "Offensive Coordinator", etc.)
  - Sends invitation email via Supabase; coach sets password via link
  - Creates user with `role: "coach"` and inserts into `coach_profiles`
  - Automatically assigns coach to selected team in `team_members` with selected position

### Login & Session

- **POST** `/api/auth/login` – Authenticate with email/password and role.
- **POST** `/api/auth/refresh` – Refresh access token using refresh token.
- **POST** `/api/auth/logout` – Client-side token invalidation endpoint.

See `../docs/testing/auth_smoke.md` for detailed test scenarios.

## Supabase Setup Checklist

- Create a Supabase project and note the project URL, anon key, and service role key.
- Set up authentication providers (email/password to start).
- Configure email templates in Supabase dashboard for coach invitations.
- Provision the database schema described in `../docs/data_model.md`:
  - Run `docs/sql/0001_core_schema.sql`.
  - Run `docs/sql/0002_rls_policies.sql`.
  - Run `docs/sql/0003_profile_triggers.sql` (automatically creates profiles when users accept invitations).
  - Run `docs/sql/0004_default_team_seed.sql` (creates default team "Sakarya Tatankaları").
  - Run `docs/sql/0005_team_assignment_trigger.sql` (automatically assigns coaches to teams when they accept invitations).
- Create a storage bucket (e.g., `highlights`) for highlight videos and media.
- Configure Row Level Security (RLS) policies to respect coach/player access rules.

### Running the SQL scripts

You can execute the SQL files through the Supabase SQL editor or CLI:

```bash
supabase db remote commit \
  --project-ref <your-project-ref> \
  --file ../docs/sql/0001_core_schema.sql

supabase db remote commit \
  --project-ref <your-project-ref> \
  --file ../docs/sql/0002_rls_policies.sql

supabase db remote commit \
  --project-ref <your-project-ref> \
  --file ../docs/sql/0003_profile_triggers.sql

supabase db remote commit \
  --project-ref <your-project-ref> \
  --file ../docs/sql/0004_default_team_seed.sql

supabase db remote commit \
  --project-ref <your-project-ref> \
  --file ../docs/sql/0005_team_assignment_trigger.sql
```

Alternatively, copy the contents into the Supabase web SQL editor and run them sequentially.
