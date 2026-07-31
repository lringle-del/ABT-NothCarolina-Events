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

**Minimum to send:** just set `RESEND_API_KEY`, `CRON_SECRET`, and
`REMINDERS_LIVE=1` (plus the `EVENTBRITE_TOKEN` you already have). No database
needed.

### Preview & approve from the dashboard (optional)

On the dashboard, open **📧 Preview & approve emails** to see all four emails
rendered exactly as they'll send. The **Approve to send** buttons are an *optional*
gate: they only take effect if you connect **Vercel KV** (Storage). Without KV the
approval step is skipped and emails send purely on the schedule above. With KV
connected, each email must be approved (admin key = your `CRON_SECRET`, remembered
in your browser).

### Send yourself a sample

In the same panel there's a **Send samples to…** box: enter any address and click
**Send all 4 samples to me** (or **✉ Sample** on a single email). This calls
`/api/send-sample` and emails you a `[SAMPLE]`-prefixed copy via Resend — it needs
`RESEND_API_KEY` and your admin key, but ignores the `REMINDERS_LIVE` gate so you can
test to yourself anytime.

### Logo

The header uses `logo.png` at the site root (served by Vercel). Swap that file to
change the logo. Emails reference it by absolute URL (`<site>/logo.png`), derived
from the request host or `PUBLIC_BASE_URL`.

### Confirming a spot (reply-based)

Emails 1–3 ask families to **reply with the word "Confirm."** Those replies go to
`REMINDER_REPLY_TO` (default `lringle@abtaba.com`). To mark them on the dashboard,
add their email addresses (lowercase) to `CARY_CONFIRMED_EMAILS` in
`api/attendees.js` and redeploy — they'll show as ✓ Confirmed and drop out of the
later "not-confirmed" reminders.

(If you ever connect Vercel KV, the old one-tap confirm button + `/api/confirm`
endpoint also still work and merge with this list — but no database is required.)

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
- `api/send-sample.js` — sends `[SAMPLE]` copies to a chosen address (admin-key).
- `api/store.js` — Vercel KV (Upstash REST) helpers + signed confirm tokens.
- `logo.png` — brand logo shown in the email header and served at `/logo.png`.
- No build step is required; Vercel serves the static file and the functions
  automatically. `api/store.js` uses the KV REST API directly — no npm deps.
