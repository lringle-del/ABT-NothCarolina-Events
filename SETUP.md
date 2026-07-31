# ABT North Carolina Events — Dashboard Setup

Live attendee dashboard for the Above & Beyond ABA events (Charlotte + Cary),
hosted on Vercel. It's a static page (`index.html`) plus one serverless
function (`api/attendees.js`) that securely pulls attendees from Eventbrite.

## Making the site public to everyone

If people get a **Vercel login page**, an **"Authentication Required" / 401**,
or a **password prompt** when opening the link, that is Vercel's
**Deployment Protection** — not a bug in this code. Turn it off in the
dashboard:

1. Go to <https://vercel.com> → open this project.
2. **Settings** → **Deployment Protection** (left sidebar).
3. Set **Vercel Authentication** to **Disabled / Off**.
4. Make sure **Password Protection** and **Trusted IPs** are also **off**.
5. **Save**, then redeploy (Deployments → latest → ⋯ → **Redeploy**).

Once disabled, anyone with the link can view the dashboard — no login needed.

> Deployment Protection is a Pro/Enterprise feature. On the free (Hobby) plan
> it is off by default, so the link should already be public.

## Required environment variables (Vercel → Settings → Environment Variables)

| Variable            | Required | Purpose                                                        |
| ------------------- | -------- | -------------------------------------------------------------- |
| `EVENTBRITE_TOKEN`  | Yes      | Private Eventbrite API token. Server-side only; never exposed. |
| `EVENT_CHARLOTTE`   | Optional | Charlotte Eventbrite event ID (otherwise auto-discovered).     |
| `EVENT_CARY`        | Optional | Cary Eventbrite event ID (otherwise auto-discovered).          |

After changing environment variables, **redeploy** for them to take effect.

## Automated event email sequence

A daily Vercel Cron hits `/api/send-reminders`, which emails registrants via
[Resend](https://resend.com). Each family gets a **sequence of four emails**
tied to how many days remain before the event:

| Days before | Email |
| ----------- | ----- |
| 7  | "You're invited" — one-week welcome: why we created the day + what's waiting |
| 3  | "3 days to go" reminder |
| 2  | "See you this weekend" reminder |
| 0  | "Today's the day!" day-of note |

It is **safe by default** — it only sends when ALL of these are true, otherwise
it runs in preview mode (sends nothing and just reports who it would email):

1. Caller is authorized (`CRON_SECRET`)
2. `RESEND_API_KEY` is set
3. `REMINDERS_LIVE` = `1`  ← the master "go live" switch
4. Today is a send day for that event (7, 3, 2, and 0 days before, by default)
5. **That specific email has been approved** on the dashboard (see below)

### Preview & approve from the dashboard

On the dashboard, open **📧 Preview & approve emails**. You'll see all four
emails rendered exactly as they'll send, each with an **Approve to send** button.
Nothing goes out until you approve it — approve individually or approve them all.
Approvals persist in Vercel KV. The first time you approve you'll be asked for the
admin key (your `CRON_SECRET`); it's remembered in your browser after that.

### Confirming a spot

Emails 1–3 include a **"Yes — confirm our spot"** button. Tapping it records the
family as confirmed (in Vercel KV) and flips them to ✅ Confirmed on the dashboard.
Confirmed families are automatically dropped from later "not-confirmed" reminders.
The link is signed with `CRON_SECRET` so it can't be forged.

### Env vars (Vercel → Settings → Environment Variables)

| Variable               | Purpose                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `CRON_SECRET`          | Any long random string; authorizes the cron, approvals, and confirm links. |
| `RESEND_API_KEY`       | From resend.com. Enables sending.                             |
| `REMINDERS_LIVE`       | Set to `1` only when you're ready for real emails to go out.   |
| `EVENT_CHARLOTTE_DATE` | Charlotte event date, `YYYY-MM-DD`.                           |
| `EVENT_CARY_DATE`      | Cary event date, `YYYY-MM-DD`. Defaults to `2026-08-09`.     |
| `KV_REST_API_URL`      | Added automatically when you connect **Vercel KV** (Storage tab). Stores approvals + confirmations. |
| `KV_REST_API_TOKEN`    | Added automatically with Vercel KV.                           |
| `REMINDER_OFFSETS`     | (optional) days-before to send. Default `7,3,2,0`.           |
| `REMINDER_FROM`        | (optional) From address. Default `reminders@abtaba.com`.      |
| `REMINDER_REPLY_TO`    | (optional) Reply-to address. Default `info@abtaba.com`.       |
| `PUBLIC_BASE_URL`      | (optional) Base URL for confirm links; else derived from the request host. |

> **Connect Vercel KV:** in your Vercel project → **Storage** → **Create** →
> **KV** → connect it to this project. That injects `KV_REST_API_URL` and
> `KV_REST_API_TOKEN` automatically. Redeploy afterward. Without KV the dashboard
> still previews emails, but approvals and confirmations won't save.

### Preview it before going live

Open (while logged in):
`/api/send-reminders?event=cary&audience=pending&key=YOUR_CRON_SECRET&force=1`
It lists exactly who would be emailed, the subject line, and how many are held
because they're not approved yet. Add `&offset=7` (or `3`, `2`, `0`) to preview a
specific email. When happy, approve on the dashboard and set `REMINDERS_LIVE=1`.

## Local / structure notes

- `index.html` — the dashboard UI; fetches `/api/attendees`, previews/approves emails.
- `api/attendees.js` — Eventbrite sync + static form families + KV confirmations.
- `api/emails.js` — shared email templates (used by the mailer and the preview).
- `api/send-reminders.js` — the cron mailer (gated by approvals + confirmations).
- `api/email-preview.js` — renders one email as HTML for the dashboard preview.
- `api/approve.js` — read/set per-email approval state (admin-key protected).
- `api/confirm.js` — target of the "confirm our spot" button.
- `api/store.js` — Vercel KV (Upstash REST) helpers + signed confirm tokens.
- No build step is required; Vercel serves the static file and the functions
  automatically. `api/store.js` uses the KV REST API directly — no npm deps.
