# GridironHub Product Specification

## Vision

GridironHub is a digital operations hub for American football organizations. It gives coaches and players a shared workspace for planning practices, monitoring performance, and keeping team knowledge current. The application focuses on role-aware experiences so that coaches can curate team content while players track their individual progress.

## Personas

- **Coach:** Owns team strategy, practice plans, and roster management. Needs tools to publish schedules, drills, and video highlights while tailoring information per team.
- **Player:** Consumes team content, logs personal metrics, and collaborates with coaches. Requires quick access to workout plans, performance history, and team communications.

## Key User Journeys

- **Login:** Landing page provides a single sign-in form with role toggle (`Coach` or `Player`). After successful authentication, the user is routed to a dashboard tailored to their role.
- **Coach Dashboard:** Coach views upcoming training events, recently uploaded highlights, assigned drills, and quick links to customize team pages. Coaches can create or edit practice plans and manage team roster metadata.
- **Player Dashboard:** Player accesses latest drills, assigned workouts, personal performance logs (body metrics, PR lifts), and upcoming training schedule. Players can update their personal page data.
- **Team Page Customization (Coach):** Coach selects a team, edits hero content, adds highlight videos, publishes drills, and configures the training calendar. Changes propagate to all players on that team.
- **Training Session Review (Player and Coach):** Coach creates a training entry detailing objectives, drills, and media. Players review assigned content, mark drills as completed, and add notes.
- **Performance Tracking (Player):** Player updates body measurements, strength personal records, and positional information. Coaches can view aggregated player metrics per team.

## Feature List

- **Authentication & Authorization**
  - Role-aware login for coaches and players.
  - Session handling with Supabase Auth tokens.
- **Coach Experience**
  - Manage team rosters and metadata.
  - Configure team landing pages (media, announcements, drill lists).
  - Publish training sessions and calendars.
  - Upload or link highlight videos.
- **Player Experience**
  - Personalized dashboard showing assigned drills, workouts, and events.
  - Update profile details: height, weight, max lifts (PRs), team, jersey number, position.
  - View team-specific media and announcements.
- **Content Management**
  - Drill definitions with instructions, equipment, and position focus.
  - Highlight video library with tagging (team, drill, training session).
  - Training calendar with session objectives and attendance status.
- **Analytics & Monitoring (Phase 2)**
  - Aggregated team metrics (PR trends, attendance).
  - Progress tracking dashboards per player.
- **Notifications (Phase 2)**
  - Optional push/email reminders for upcoming trainings or new drills.

## Non-Functional Goals

- Mobile-friendly UI to support sideline usage.
- Role-based access control to protect sensitive player data.
- Fast load times for media-rich pages via CDN links or Supabase storage.
- Strong auditability for changes made by coaches to team content.
