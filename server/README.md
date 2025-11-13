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

## Available Scripts

- `npm run dev` – Start Express with live reload via `ts-node-dev`.
- `npm run build` – Compile TypeScript into the `dist/` directory.
- `npm run start` – Run the compiled production build.
- `npm run lint` – Execute ESLint across the project.
- `npm run typecheck` – Validate TypeScript types without emitting output.
- `npm run format` – Check formatting with Prettier.
- `npm run format:write` – Apply Prettier formatting fixes.

## Supabase Setup Checklist

- Create a Supabase project and note the project URL, anon key, and service role key.
- Set up authentication providers (email/password to start).
- Provision the database schema described in `../docs/data_model.md`.
- Create a storage bucket (e.g., `highlights`) for highlight videos and media.
- Configure Row Level Security (RLS) policies to respect coach/player access rules.
