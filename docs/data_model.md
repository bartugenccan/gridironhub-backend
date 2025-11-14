# Data Model

## Entity Overview

- `users`: Authentication identities synchronized with Supabase Auth metadata.
- `coach_profiles`: Extended information for coaches (bio, certifications).
- `player_profiles`: Player-specific metrics (height, weight, position, jersey number, PR lifts).
- `teams`: American football teams managed within the platform.
- `team_members`: Join table linking users to teams with role and status.
- `team_customizations`: Content managed by coaches for team landing pages.
- `trainings`: Scheduled training sessions with objectives and status.
- `training_assignments`: Player-specific participation and completion state for trainings.
- `drills`: Drill definitions with instructions and tags.
- `training_drills`: Association of drills to trainings with ordering and notes.
- `highlights`: Highlight video metadata stored in Supabase storage.
- `strength_logs`: Player strength metrics with 1RM/PR records.
- `body_metrics`: Periodic player measurements (height, weight, body fat if available).
- `calendars`: Coach-authored calendar entries (meetings, games, deadlines).

## Table Definitions

### users

| Column     | Type                     | Notes                         |
| ---------- | ------------------------ | ----------------------------- |
| id         | uuid (PK)                | Mirrors Supabase Auth user id |
| email      | text                     | Unique, indexed               |
| role       | enum (`coach`, `player`) | Matches application roles     |
| created_at | timestamptz              | Default `now()`               |
| updated_at | timestamptz              | Maintained via trigger        |

### coach_profiles

| Column              | Type                   | Notes                      |
| ------------------- | ---------------------- | -------------------------- |
| user_id             | uuid (PK, FK users.id) | One-to-one with users      |
| full_name           | text                   |                            |
| bio                 | text                   |                            |
| certifications      | text[]                 | Coaching credentials       |
| preferred_positions | text[]                 | Focus areas (e.g., QB, OL) |
| created_at          | timestamptz            |                            |
| updated_at          | timestamptz            |                            |

### player_profiles

| Column        | Type                   | Notes                 |
| ------------- | ---------------------- | --------------------- |
| user_id       | uuid (PK, FK users.id) | One-to-one with users |
| full_name     | text                   |                       |
| jersey_number | integer                |                       |
| position      | text                   | e.g., WR, LB          |
| dominant_hand | text                   | Optional              |
| height_cm     | numeric                | Stored in centimeters |
| weight_kg     | numeric                | Stored in kilograms   |
| bio           | text                   |                       |
| created_at    | timestamptz            |                       |
| updated_at    | timestamptz            |                       |

### teams

| Column       | Type               | Notes                     |
| ------------ | ------------------ | ------------------------- |
| id           | uuid (PK)          |                           |
| name         | text               | Unique per organization   |
| level        | text               | e.g., HS Varsity, College |
| organization | text               | School or club            |
| created_by   | uuid (FK users.id) | Typically a coach         |
| created_at   | timestamptz        |                           |
| updated_at   | timestamptz        |                           |

### team_members

| Column                         | Type                                   | Notes                                     |
| ------------------------------ | -------------------------------------- | ----------------------------------------- |
| team_id                        | uuid (FK teams.id)                     |                                           |
| user_id                        | uuid (FK users.id)                     |                                           |
| role                           | enum (`coach`, `player`)               | Redundant for quick lookups               |
| status                         | enum (`active`, `inactive`, `invited`) | Membership state                          |
| joined_at                      | timestamptz                            |                                           |
| primary_position               | text                                   | Override player_profiles if team-specific |
| jersey_number                  | integer                                | Team-specific jersey                      |
| PRIMARY KEY (team_id, user_id) |                                        |                                           |

### team_customizations

| Column        | Type                   | Notes                    |
| ------------- | ---------------------- | ------------------------ |
| team_id       | uuid (PK, FK teams.id) |                          |
| hero_title    | text                   |                          |
| hero_message  | text                   |                          |
| highlight_ids | uuid[]                 | References highlights.id |
| announcements | jsonb                  | Array of message objects |
| resources     | jsonb                  | Links, documents         |
| updated_by    | uuid (FK users.id)     | Coach who last updated   |
| updated_at    | timestamptz            |                          |

### trainings

| Column      | Type                                         | Notes                     |
| ----------- | -------------------------------------------- | ------------------------- |
| id          | uuid (PK)                                    |                           |
| team_id     | uuid (FK teams.id)                           |                           |
| title       | text                                         | e.g., \"Speed & Agility\" |
| description | text                                         | Session objectives        |
| start_at    | timestamptz                                  |                           |
| end_at      | timestamptz                                  |                           |
| location    | text                                         | Optional                  |
| created_by  | uuid (FK users.id)                           | Coach author              |
| status      | enum (`scheduled`, `completed`, `cancelled`) |                           |
| created_at  | timestamptz                                  |                           |

### training_assignments

| Column                             | Type                                              | Notes              |
| ---------------------------------- | ------------------------------------------------- | ------------------ |
| training_id                        | uuid (FK trainings.id)                            |                    |
| user_id                            | uuid (FK users.id)                                | Player participant |
| attendance                         | enum (`pending`, `attended`, `missed`, `excused`) |                    |
| completion_notes                   | text                                              | Player feedback    |
| PRIMARY KEY (training_id, user_id) |                                                   |                    |

### drills

| Column          | Type               | Notes                  |
| --------------- | ------------------ | ---------------------- |
| id              | uuid (PK)          |                        |
| title           | text               |                        |
| instructions    | text               | Step-by-step guidance  |
| focus_positions | text[]             | e.g., `['QB','WR']`    |
| equipment       | text[]             |                        |
| video_url       | text               | Optional external link |
| created_by      | uuid (FK users.id) | Typically coach        |
| created_at      | timestamptz        |                        |
| updated_at      | timestamptz        |                        |

### training_drills

| Column                              | Type                   | Notes                 |
| ----------------------------------- | ---------------------- | --------------------- |
| training_id                         | uuid (FK trainings.id) |                       |
| drill_id                            | uuid (FK drills.id)    |                       |
| sequence                            | integer                | Order within training |
| notes                               | text                   | Coach adjustments     |
| PRIMARY KEY (training_id, drill_id) |                        |                       |

### highlights

| Column       | Type               | Notes                       |
| ------------ | ------------------ | --------------------------- |
| id           | uuid (PK)          |                             |
| team_id      | uuid (FK teams.id) |                             |
| uploaded_by  | uuid (FK users.id) | Coach or player             |
| title        | text               |                             |
| description  | text               |                             |
| storage_path | text               | Supabase storage key        |
| tags         | text[]             | e.g., `['Week1','Defense']` |
| published_at | timestamptz        |                             |
| created_at   | timestamptz        |                             |

### strength_logs

| Column      | Type               | Notes                 |
| ----------- | ------------------ | --------------------- |
| id          | uuid (PK)          |                       |
| user_id     | uuid (FK users.id) | Player                |
| lift_name   | text               | e.g., \"Bench Press\" |
| one_rep_max | numeric            | PR value              |
| recorded_at | date               |                       |
| notes       | text               |                       |
| created_at  | timestamptz        |                       |

### body_metrics

| Column       | Type               | Notes                       |
| ------------ | ------------------ | --------------------------- |
| id           | uuid (PK)          |                             |
| user_id      | uuid (FK users.id) | Player                      |
| height_cm    | numeric            | Optional historic overrides |
| weight_kg    | numeric            |                             |
| body_fat_pct | numeric            | Optional                    |
| recorded_at  | date               |                             |
| created_at   | timestamptz        |                             |

### calendars

| Column      | Type                                | Notes            |
| ----------- | ----------------------------------- | ---------------- |
| id          | uuid (PK)                           |                  |
| team_id     | uuid (FK teams.id)                  |                  |
| author_id   | uuid (FK users.id)                  | Coach            |
| title       | text                                |                  |
| description | text                                |                  |
| start_at    | timestamptz                         |                  |
| end_at      | timestamptz                         |                  |
| visibility  | enum (`team`, `players`, `coaches`) | Audience control |
| created_at  | timestamptz                         |                  |
| updated_at  | timestamptz                         |                  |

## Relationships Summary

- A `user` has one profile (`coach_profiles` or `player_profiles`) depending on role.
- Coaches can belong to multiple teams via `team_members`.
- Teams aggregate trainings, drills, highlights, and calendar events.
- Trainings relate to drills (many-to-many) through `training_drills`.
- Players log strength metrics and body measurements independent of specific trainings.

## Supabase Migration Notes

- Run the SQL scripts in `docs/sql/0001_core_schema.sql` to provision tables.
- Apply `docs/sql/0002_rls_policies.sql` to enable row level security aligned with coach/player roles.
- These scripts are idempotent; rerunning them will skip existing definitions.
