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
- `api/attendees.js` — Vercel serverless function; Eventbrite sync + static
  form families.
- No build step is required; Vercel serves the static file and the function
  automatically.
