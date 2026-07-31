// Event email sequence for the Above & Beyond ABA "Free Magical Day of Fun" events.
// Triggered by Vercel Cron (daily). It only actually sends an email when ALL are true:
//   1. the caller is authorized (CRON_SECRET), AND
//   2. RESEND_API_KEY is set, AND
//   3. REMINDERS_LIVE === "1"  (the master "go live" switch), AND
//   4. today matches a send day for that event (date gate, driven by REMINDER_OFFSETS), AND
//   5. THAT email (this offset) has been APPROVED on the dashboard.
// Otherwise it runs in PREVIEW mode: it reports what it *would* do and sends nothing.
//
// Send cadence (days before the event) → which email:
//   7 → one-week welcome   3 → 3-day reminder   2 → 2-day reminder   0 → day-of
//
// Templates live in ./emails.js (shared with the dashboard preview). Approvals and
// spot-confirmations live in ./store.js (Vercel KV).
//
// Required env: EVENTBRITE_TOKEN, CRON_SECRET, RESEND_API_KEY,
//   EVENT_CHARLOTTE_DATE / EVENT_CARY_DATE (YYYY-MM-DD), REMINDERS_LIVE.
// Optional: REMINDER_OFFSETS (default "7,3,2,0"), REMINDER_FROM, REMINDER_REPLY_TO,
//   PUBLIC_BASE_URL (for absolute confirm links; else derived from the request host).

import { getEvents } from "./attendees.js";
import { buildEmail, EVENT_INFO } from "./emails.js";
import { getApprovals, getConfirmed, confirmToken } from "./store.js";

const OFFSETS = (process.env.REMINDER_OFFSETS || "7,3,2,0").split(",").map(n => parseInt(n, 10)).filter(n => !isNaN(n));
const FROM = process.env.REMINDER_FROM || "Above & Beyond ABA <reminders@abtaba.com>";
const REPLY_TO = process.env.REMINDER_REPLY_TO || "info@abtaba.com";

const EVENT_DATE = {
  charlotte: process.env.EVENT_CHARLOTTE_DATE || null,
  cary: process.env.EVENT_CARY_DATE || "2026-08-09",
};

function authorized(req){
  const secret = process.env.CRON_SECRET;
  if(!secret) return false;
  const auth = req.headers["authorization"] || "";
  const q = (req.query && (req.query.key || req.query.secret)) || "";
  return auth === `Bearer ${secret}` || q === secret;
}
function todayISO(){
  return new Intl.DateTimeFormat("en-CA", {timeZone:"America/New_York", year:"numeric", month:"2-digit", day:"2-digit"}).format(new Date());
}
function daysUntil(dateISO){
  if(!dateISO) return null;
  return Math.round((Date.parse(dateISO+"T00:00:00Z") - Date.parse(todayISO()+"T00:00:00Z")) / 86400000);
}
function baseUrl(req){
  if(process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

export default async function handler(req, res){
  if(!authorized(req)) return res.status(401).json({error:"unauthorized"});
  const token = process.env.EVENTBRITE_TOKEN;
  if(!token) return res.status(400).json({error:"No EVENTBRITE_TOKEN set"});

  const q = req.query || {};
  const which = (q.event || "charlotte").toLowerCase();     // charlotte | cary | all
  const audience = (q.audience || "pending").toLowerCase(); // pending | all
  const force = q.force === "1" || q.force === "true";       // bypass the DATE gate (manual testing)
  const forceOffset = q.offset !== undefined ? parseInt(q.offset, 10) : null;
  const secret = process.env.CRON_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const liveEnabled = process.env.REMINDERS_LIVE === "1";

  let out;
  try { ({out} = await getEvents(token)); }
  catch(e){ return res.status(502).json({error:String(e && e.message || e)}); }

  const wanted = out.events.filter(e => which === "all" ? true : e.key === which);

  // Per-event date gate + approval + confirmations, resolved once per event.
  const gated = [];
  for(const e of wanted){
    const d = daysUntil(EVENT_DATE[e.key]);
    const dueToday = force || (d !== null && OFFSETS.includes(d));
    const offset = forceOffset !== null ? forceOffset : d;
    const approvals = await getApprovals(e.key, OFFSETS);
    const approved = approvals[offset] === true;
    const confirmedSet = new Set(await getConfirmed(e.key));
    gated.push({ event:e, daysUntil:d, dueToday, offset, approved, confirmedSet });
  }

  // Gather recipients from events that are due today.
  const seen = new Set();
  const recipients = [];
  for(const g of gated){
    if(!g.dueToday) continue;
    for(const f of g.event.families){
      const email = (f.email||"").trim();
      const key = email.toLowerCase();
      if(!email || seen.has(key)) continue;
      if(audience === "pending" && (f.confirmed || g.confirmedSet.has(key))) continue;
      seen.add(key);
      recipients.push({ email, name:f.purchaser||"", eventKey:g.event.key, offset:g.offset, approved:g.approved });
    }
  }

  const origin = baseUrl(req);
  const logoUrl = `${origin}/logo.png`;
  const sendable = recipients.filter(r => r.approved);
  const willSend = liveEnabled && !!apiKey && sendable.length > 0;

  // PREVIEW: report only, send nothing.
  if(!willSend){
    const reasons = [];
    if(!apiKey) reasons.push("RESEND_API_KEY not set");
    if(!liveEnabled) reasons.push("REMINDERS_LIVE not '1' (still in preview)");
    if(recipients.length === 0) reasons.push("no recipients due today");
    else if(sendable.length === 0) reasons.push("today's email is not approved yet (approve it on the dashboard)");
    const sampleR = recipients[0];
    return res.status(200).json({
      mode:"preview", today:todayISO(), event:which, audience,
      schedule: gated.map(g => ({event:g.event.key, date:EVENT_DATE[g.event.key]||null, daysUntil:g.daysUntil, dueToday:g.dueToday, offset:g.offset, approved:g.approved})),
      wouldSend: sendable.length, dueButUnapproved: recipients.length - sendable.length, reasons,
      sample: sampleR ? (()=>{ const ev=EVENT_INFO[sampleR.eventKey]||EVENT_INFO.cary; const m=buildEmail(sampleR.offset, "there", ev, "#", logoUrl); return {offset:sampleR.offset, subject:m.subject}; })() : null,
      recipients: sendable.map(r => r.email)
    });
  }

  // LIVE: one personalized email per family via Resend.
  const results = { sent:0, failed:0, errors:[] };
  for(const r of sendable){
    const first = r.name ? r.name.trim().split(/\s+/)[0] : "there";
    const ev = EVENT_INFO[r.eventKey] || EVENT_INFO.cary;
    const tok = confirmToken(r.eventKey, r.email, secret);
    const confirmUrl = `${origin}/api/confirm?event=${encodeURIComponent(r.eventKey)}&email=${encodeURIComponent(r.email)}&token=${encodeURIComponent(tok)}`;
    const { subject, html } = buildEmail(r.offset, first, ev, confirmUrl, logoUrl);
    try{
      const resp = await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
        body: JSON.stringify({ from:FROM, to:[r.email], reply_to:REPLY_TO, subject, html })
      });
      if(resp.ok) results.sent++;
      else { results.failed++; if(results.errors.length < 5) results.errors.push(`${r.email}: HTTP ${resp.status}`); }
    }catch(err){ results.failed++; if(results.errors.length < 5) results.errors.push(`${r.email}: ${String(err && err.message || err)}`); }
  }
  return res.status(200).json({ mode:"sent", today:todayISO(), event:which, audience, offset:sendable[0] && sendable[0].offset, ...results });
}
