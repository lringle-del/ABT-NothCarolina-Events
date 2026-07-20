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
| `EVENT_WRTS`        | Optional | We Rock the Spectrum event IDs, **comma-separated** (one per time slot). Otherwise auto-discovered by name. |

After changing environment variables, **redeploy** for them to take effect.

### We Rock the Spectrum tab

The dashboard auto-detects the **We Rock the Spectrum** event on your Eventbrite
(any event whose name contains "we rock" / "rock the spectrum"). It runs at
three times, which on Eventbrite are three separate listings — the dashboard
merges all three and tags each registration with its time slot, so you can
filter by time and see per-slot counts.

This tab shows **every registration question and answer** dynamically (not a
fixed set of columns): a **Results by question** panel aggregates the answers,
and each registration expands to show the full Q&A per guest.

If auto-discovery ever grabs the wrong events (or misses one), open
`/api/attendees?debug=1` — the `candidates` list shows every event name + ID
your token can see. Copy the three We Rock the Spectrum IDs into `EVENT_WRTS`
(comma-separated) and redeploy to pin them exactly.

## Sending an email from the dashboard

The **✉ Compose email** button opens a panel to write a subject + message and
send it to everyone registered for the current event (one personalized email
each — `{{first}}` is replaced with the recipient's first name). It uses
[Resend](https://resend.com) and is **safe by default**: it only sends when ALL
of these are true, otherwise it just previews who it *would* email:

1. You enter the correct **passphrase** (`SEND_SECRET`).
2. `RESEND_API_KEY` is set.
3. `EMAIL_LIVE` = `1` (the master "go live" switch).
4. There is a subject, a message, and at least one recipient.

### Env vars for compose-and-send (Vercel → Settings → Environment Variables)

| Variable         | Purpose                                                          |
| ---------------- | --------------------------------------------------------------- |
| `SEND_SECRET`    | Passphrase you type in the dashboard to authorize sends. (Falls back to `CRON_SECRET` if unset.) |
| `RESEND_API_KEY` | From resend.com. Enables sending.                               |
| `EMAIL_LIVE`     | Set to `1` only when you're ready for real emails to go out.    |
| `EMAIL_FROM`     | (optional) From address. Default `events@abtaba.com`.           |

Until `EMAIL_LIVE=1`, the Send button is completely safe — it will only ever
show you the recipient list and the reason nothing was sent.

## Automated reminder emails

A daily Vercel Cron hits `/api/send-reminders`, which emails registrants via
[Resend](https://resend.com). It is **safe by default** — it only sends when
ALL of these are true, otherwise it runs in preview mode (sends nothing and
just reports who it would email):

1. Caller is authorized (`CRON_SECRET`)
2. `RESEND_API_KEY` is set
3. `REMINDERS_LIVE` = `1`  ← the master "go live" switch
4. Today is a reminder day for that event (2 days before + day-of by default)

### Env vars (Vercel → Settings → Environment Variables)

| Variable               | Purpose                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `CRON_SECRET`          | Any long random string; authorizes the cron / manual calls.   |
| `RESEND_API_KEY`       | From resend.com. Enables sending.                             |
| `REMINDERS_LIVE`       | Set to `1` only when you're ready for real emails to go out.   |
| `EVENT_CHARLOTTE_DATE` | Charlotte event date, `YYYY-MM-DD`.                           |
| `EVENT_CARY_DATE`      | Cary event date, `YYYY-MM-DD`.                               |
| `REMINDER_OFFSETS`     | (optional) days-before to send, e.g. `3,1,0`. Default `2,0`.  |
| `REMINDER_FROM`        | (optional) From address. Default `reminders@abtaba.com`.      |

### Preview it before going live

Open (while logged in):
`/api/send-reminders?event=charlotte&audience=pending&key=YOUR_CRON_SECRET&force=1`
It lists exactly who would be emailed. When happy, set `REMINDERS_LIVE=1`.

## Local / structure notes

- `index.html` — the dashboard UI; fetches `/api/attendees`.
- `api/attendees.js` — Vercel serverless function; Eventbrite sync (Charlotte,
  Cary, and We Rock the Spectrum) + static form families. Returns all questions.
- `api/send-email.js` — compose-and-send endpoint (Resend), preview-safe.
- `api/send-reminders.js` — automated daily reminder cron (Resend).
- No build step is required; Vercel serves the static file and the functions
  automatically.
