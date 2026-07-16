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

## Local / structure notes

- `index.html` — the dashboard UI; fetches `/api/attendees`.
- `api/attendees.js` — Vercel serverless function; Eventbrite sync + static
  form families.
- No build step is required; Vercel serves the static file and the function
  automatically.
