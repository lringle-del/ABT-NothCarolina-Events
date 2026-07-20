# Event Platform — Decision Questionnaire

Fill in your answers below. Bring this into the next session and we'll pick the
right approach (own platform: **Vercel + Supabase + Resend**, vs a marketing
tool like **Mailchimp/Brevo/Constant Contact**) and start building.

## ⭐ The 4 deciding questions
1. Who edits marketing emails day-to-day? (drag-drop self-service vs mostly automated):
2. Own registration system (replace Eventbrite) or keep Eventbrite + just do marketing?
3. Will you have IT / a developer to own the custom system long-term?
4. How much do you value one connected system vs a separate polished marketing tool?

## Scale & sending
5. Contacts now / expected in a year:
6. Events per year / typical size:
7. Marketing email frequency (weekly / monthly / occasional):
8. Number of cities/locations:

## Channels, content & design
9. Email only, or also SMS/text later?
10. Simple reminders, or regular richly-designed newsletters?
11. Brand assets ready (logo, colors, fonts)?
12. Different content for different groups (attendees / leads / all)?

## Own registration (if built)
13. Signup fields to collect (add/remove vs current):
14. Time slots / capacity limits / waitlists needed?
15. Day-of check-in / attendance tracking needed?
16. Always free, or ever paid/ticketed/donations?
17. Staff who log into admin + permission levels:

## Data, privacy & compliance
18. Org policy on where contact data can live / who accesses it:
19. OK to add marketing opt-in checkbox at signup?
20. Keep children's health/diagnosis info separate from marketing list?
21. Privacy policy to link at signup (have one / need one)?
22. HIPAA / compliance requirements leadership will ask about:

## Operations & ownership
23. Accounts under an organization account? Who is the owner?
24. Technical point person / on-call before events:
25. Backup & data-export expectations:

## Integrations & budget
26. Must connect to (website / CRM / QuickBooks / forms / social)?
27. Embed signup form on existing website?
28. Already pay for an email tool, or Microsoft 365 features to reuse?
29. Comfortable monthly budget ceiling:
30. Timeline — which event should the full platform be ready for?

---

## Reference: recommended stack (for the custom option)
- **Vercel** — app + hosting + scheduled jobs (cron). Free to start.
- **Supabase** — Postgres database for events, registrants, contacts, journeys. Free tier generous.
- **Resend** — sends automated journeys AND recurring marketing broadcasts (with managed unsubscribe). Free up to 3,000 emails/mo.
- Emails send **from abtaba.com** with **reply-to → Outlook inbox**; optional BCC-to-Outlook for copies.
- Requires: 3 DNS records on abtaba.com (DKIM + SPF/MX) — IT adds once.

## Already built in this repo (Phase 0/1 foundations)
- Live dashboard pulling Charlotte + Cary from Eventbrite (`api/attendees.js`)
- `⬇` email CSV export + `✉ Email not-confirmed` / `✉ Email all` buttons (open Outlook)
- `api/send-reminders.js` — preview-safe automated mailer (Resend), daily cron in `vercel.json`
- Confirmed-family tracking + test-entry exclusion
