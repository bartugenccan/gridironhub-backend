# Auth Smoke Test Checklist

Use these manual checks after configuring Supabase credentials in `.env`.

## Prerequisites

- Supabase project created with the schema from `docs/sql/0001_core_schema.sql`.
- RLS policies from `docs/sql/0002_rls_policies.sql` applied.
- At least one coach and one player account exist with `user_metadata.role` set appropriately.
- API server running locally via `npm run dev`.

## 1. Login with email and password

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

## 2. Refresh the session

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refresh-token-from-login>"
  }'
```

✅ Expected: HTTP 200 with a new `session.accessToken`.

❌ Failure: 401 if the refresh token is expired or malformed.

## 3. Access a protected route

```bash
curl http://localhost:3001/api/teams/<team-id> \
  -H "Authorization: Bearer <access-token-from-login>"
```

✅ Expected: HTTP 200 with mock team payload.

❌ Failure: 401 if the token is missing/invalid. 403 if role guard blocks access (e.g., try patch route as player).

## 4. Player permissions

Verify a player can update only their profile.

```bash
curl -X PATCH http://localhost:3001/api/profiles/players/<player-id> \
  -H "Authorization: Bearer <player-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Ready for playoffs"}'
```

✅ Expected: HTTP 200 with updated payload when `<player-id>` matches the token’s user ID.

❌ Failure: 403 when attempting to edit another player’s profile.

## 5. Coach permissions

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
