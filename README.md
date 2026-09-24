# Process Work Tracker

A responsive process-engineering task manager using GitHub for source and hosting automation, and Supabase for authentication and persistent workspaces.

## Finish website setup

1. In this repository, open **Settings → Pages → Build and deployment → Source**, and choose **GitHub Actions**.
2. Open **Actions → Publish task manager → Run workflow**. When it succeeds, GitHub Pages shows the website link.
3. In Supabase project **dashboard**, open **Authentication → URL Configuration**. Set **Site URL** to the deployed website URL. Add that exact URL to the **Redirect URLs** allowlist too. This makes signup confirmations and password-reset emails return to this app. Keep email confirmation enabled. Existing apps using this Supabase project may depend on the current Site URL; preserve their callback URLs in the allowlist.
4. Open the website, create your account, confirm the email, then sign in. Configure custom SMTP in Supabase if its built-in email service limits delivery to your account or team.

No ChatGPT sign-in is required on the GitHub Pages website. Do not assume a predicted Pages URL is live until the deployment succeeds.

## Usage

- Add people and recipients in **People & teams**, then create tasks.
- All task views, checklists, comments, delivery acceptance, archive/restore, filters, reminders and CSV export are included.
- **Account & sync → Refresh tasks** loads changes made on another device. Conflicting edits are rejected rather than overwriting newer data. If a save fails, keep the form open and copy any notes before refreshing.
- Every signed-in user gets a private workspace. To collaborate, the owner adds a colleague's verified account email under **Account & sync → Workspace access**. The colleague refreshes and selects the shared workspace. Access is to all tasks in that workspace. Assignment-directory names alone never grant access. No invitation email is sent.
- New workspaces start empty. No fictional people are added.

## Move tasks from the old app

In the old browser-local app, clear filters and export **All Tasks** to CSV. In this app, sign in and select **Account & sync → Import**. Export/import archived records separately if needed. Importing the same file twice creates duplicates. IDs are regenerated and imported dependencies remapped; comments and checklists are preserved. The original history stays in the exported CSV; imported records receive a new import-history entry.

## Local development

Node.js 22 or newer:

```sh
npm ci --ignore-scripts
npm run check
node tests/cloud.test.cjs
npm run build
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Add the local URL to Supabase's allowed redirects if testing confirmation/reset emails. The static website is generated in `dist/`; it includes the pinned Supabase client bundle and license. No runtime CDN dependency is needed.

## Database and security

- Connected project: `dashboard` (`dlcbnseimiogmxdqrwis`).
- `db/schema.sql` and `db/verified-members.sql` document the two migrations already applied. They create `public.pwt_workspaces` and `pwt_private.verified_email()`; they do not alter the pre-existing `public.tasks` table.
- Each workspace stores its complete task/directory document, with an optimistic revision number to prevent stale overwrites. This is intended for a small engineering team, not high-volume concurrent editing.
- Database row-level security restricts access to the owner and explicitly authorized users with verified emails. Members cannot change ownership or the access list. Anonymous users have no table privileges.
- The small private security-definer function reads only the current signed-in user's verified email. It has an empty search path and restricted execution grants. It never accepts another user's ID.
- `config.js` contains only the public project URL and a publishable client key. These are intended to be browser-visible. Never place service-role keys, database passwords, or GitHub tokens in this repository.
- The repository is public. Task data lives in Supabase and is not included in Git commits.

## Verification and remaining setup

JavaScript syntax/build and automated tests cover rendering, date validation, successful/failed saves, stale-write rejection, and CSV import. Database tests exercise owner/member/outsider isolation and access-list protection using rolled-back temporary records. Full email signup and browser end-to-end verification require the final hosted URL and your account setup.

The project's existing `public.set_updated_at` function has a Supabase advisory for a mutable search path. It belongs to the pre-existing project schema and was not changed. See https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable .
