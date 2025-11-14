# Auth Smoke Test Checklist

Use these manual checks after configuring Supabase credentials in `.env`.

## Prerequisites

- Supabase project created with the schema from `docs/sql/0001_core_schema.sql`.
- RLS policies from `docs/sql/0002_rls_policies.sql` applied.
- Profile triggers from `docs/sql/0003_profile_triggers.sql` applied.
- API server running locally via `npm run dev`.

### Creating the First Coach

Before you can invite coaches via the API, you need to create the first coach. You have two options:

**Option 1: Via Supabase Dashboard** (Recommended for testing)

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email (e.g., `coach1@example.com`) and password
4. In "Additional user metadata", add:
   ```json
   {
     "role": "coach",
     "full_name": "First Coach"
   }
   ```
5. Create the user
6. Go to SQL Editor and create the coach profile:
   ```sql
   insert into public.coach_profiles (user_id, full_name)
   select id, 'First Coach'
   from auth.users
   where email = 'coach1@example.com';
   ```

**Option 2: Via SQL** (Quick setup)

```sql
-- Create coach user
select auth.admin.create_user(
  email => 'coach1@example.com',
  password => 'CoachPassword123',
  user_metadata => jsonb_build_object('role', 'coach', 'full_name', 'First Coach')
);

-- Create coach profile (or wait for trigger if 0003_profile_triggers.sql is applied)
insert into public.coach_profiles (user_id, full_name)
select id, 'First Coach'
from auth.users
where email = 'coach1@example.com';
```

## 1. Register a new player

Player registration flow: User selects team and position, registers with email and password.

**First, get the default team ID:**

```sql
-- In Supabase SQL Editor
select id, name from public.teams where name = 'Sakarya Tatankaları';
```

**Available player positions:**

- `QB` (Quarterback), `RB` (Running Back), `FB` (Fullback)
- `WR` (Wide Receiver), `TE` (Tight End)
- `OL` (Offensive Lineman), `C` (Center), `G` (Guard), `T` (Tackle)
- `DL` (Defensive Lineman), `DE` (Defensive End), `DT` (Defensive Tackle)
- `LB` (Linebacker), `ILB` (Inside Linebacker), `OLB` (Outside Linebacker)
- `DB` (Defensive Back), `CB` (Cornerback), `S` (Safety), `FS` (Free Safety), `SS` (Strong Safety)
- `K` (Kicker), `P` (Punter), `LS` (Long Snapper)

**Register a new player:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "player@example.com",
    "password": "Password123",
    "fullName": "John Doe",
    "teamId": "<team-id-from-above-query>",
    "position": "QB"
  }'
```

✅ Expected: HTTP 201 with `session.accessToken`, `session.refreshToken`, and user information with `role: "player"`.

- Player profile should be created automatically in `player_profiles` table with position.
- Player should be assigned to selected team in `team_members` table with selected position via trigger (`docs/sql/0005_team_assignment_trigger.sql`).

❌ Failure cases:

- 400 if email is already registered.
- 400 if password doesn't meet requirements (min 8 chars, uppercase, lowercase, number).
- 400 if fullName is too short or too long.
- 400 if team ID is invalid or team doesn't exist.
- 400 if position is not a valid player position.

**Verify registration:**

```sql
-- Profile created
select * from public.player_profiles
where user_id = (select id from auth.users where email = 'player@example.com');

-- Team assignment
select * from public.team_members
where user_id = (select id from auth.users where email = 'player@example.com');
```

## 2. Coach Registration (Public - No authentication required)

Coach registration flow: User selects team and position, receives invitation email.

**First, get the default team ID:**

```sql
-- In Supabase SQL Editor
select id, name from public.teams where name = 'Sakarya Tatankaları';
```

**Available coach positions:**

- Head Coach
- Offensive Coordinator
- Defensive Coordinator
- Special Teams Coach
- Quarterbacks Coach
- Running Backs Coach
- Wide Receivers Coach
- Tight Ends Coach
- Offensive Line Coach
- Defensive Line Coach
- Linebackers Coach
- Defensive Backs Coach
- Strength and Conditioning Coach
- Assistant Coach

**Send coach invitation:**

```bash
curl -X POST http://localhost:3001/api/auth/invite-coach \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcoach@example.com",
    "fullName": "Jane Coach",
    "teamId": "<team-id-from-above-query>",
    "position": "Head Coach"
  }'
```

✅ Expected: HTTP 200 with success message. Supabase will send an invitation email to the coach.

**Important:** When the coach clicks the invitation link and sets their password:

- Their account is created with `role: "coach"` in metadata
- A profile is **automatically** created in `coach_profiles` table via database trigger (`docs/sql/0003_profile_triggers.sql`)
- They are **automatically** assigned to the selected team in `team_members` table with the selected position via trigger (`docs/sql/0005_team_assignment_trigger.sql`)
- They can then login using the standard login endpoint

❌ Failure cases:

- 400 if team ID is invalid or team doesn't exist.
- 400 if position is not a valid coach position.
- 400 if email is already registered.

**Testing the full flow:**

1. Ensure default team exists (run `docs/sql/0004_default_team_seed.sql`)
2. Get team ID from teams table
3. Send invitation (curl above with teamId and position)
4. Check email inbox for invitation link (or check Supabase Dashboard → Authentication → Users)
5. Click link and set password
6. Verify profile was created: `select * from public.coach_profiles where user_id = '<new-user-id>';`
7. Verify team assignment: `select * from public.team_members where user_id = '<new-user-id>';`
8. Login with the new credentials

## 3. Login with email and password

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@example.com",
    "password": "your-password",
    "role": "coach"
  }'
```

✅ Expected: HTTP 200 with `session.accessToken`, `session.refreshToken`, and the coach profile information (role `coach`).

❌ Failure cases:

- 401 if password is wrong.
- 403 if the account’s role metadata does not match the requested role.

## 4. Refresh the session

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh-token-from-login>"
  }'
```

✅ Expected: HTTP 200 with a new `session.accessToken`.

❌ Failure: 401 if the refresh token is expired or malformed.

## 5. Access a protected route

```bash
curl http://localhost:3001/api/teams/<team-id> \
  -H "Authorization: Bearer <access-token-from-login>"
```

✅ Expected: HTTP 200 with mock team payload.

❌ Failure: 401 if the token is missing/invalid. 403 if role guard blocks access (e.g., try patch route as player).

## 6. Player permissions

Verify a player can update only their profile.

```bash
curl -X PATCH http://localhost:3001/api/profiles/players/<player-id> \
  -H "Authorization: Bearer <player-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Ready for playoffs"}'
```

✅ Expected: HTTP 200 with updated payload when `<player-id>` matches the token’s user ID.

❌ Failure: 403 when attempting to edit another player’s profile.

## 7. Coach permissions

```bash
curl -X PATCH http://localhost:3001/api/teams/<team-id>/customization \
  -H "Authorization: Bearer <coach-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"heroTitle":"All In"}'
```

✅ Expected: HTTP 200 with updated mock customization.

❌ Failure: 401 for missing token, or 403 when using a player token.

---

Record any failures and update `docs/testing/auth_smoke.md` with findings or additional scenarios as the API matures.
