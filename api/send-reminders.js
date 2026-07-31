// Event email sequence for the Above & Beyond ABA "Free Magical Day of Fun" events.
// Triggered by Vercel Cron (daily). It only actually sends when:
//   1. the caller is authorized (CRON_SECRET), AND
//   2. RESEND_API_KEY is set, AND
//   3. REMINDERS_LIVE === "1"  (the master "go live" switch), AND
//   4. today matches a send day for that event (date gate, driven by REMINDER_OFFSETS).
// Otherwise it runs in PREVIEW mode: it reports who it *would* email and sends nothing.
//
// Send cadence (days before the event) → which email goes out:
//   7 → "You're invited" one-week welcome (why we created this + what's waiting)
//   3 → "3 days to go" reminder
//   2 → "See you Sunday" reminder
//   0 → "Today's the day!" day-of note
//
// Required env vars: EVENTBRITE_TOKEN, CRON_SECRET, RESEND_API_KEY,
//   EVENT_CHARLOTTE_DATE / EVENT_CARY_DATE (YYYY-MM-DD), REMINDERS_LIVE.
// Optional: REMINDER_OFFSETS (default "7,3,2,0"),
//   REMINDER_FROM (default "Above & Beyond ABA <reminders@abtaba.com>").

import { getEvents } from "./attendees.js";

const OFFSETS = (process.env.REMINDER_OFFSETS || "7,3,2,0").split(",").map(n => parseInt(n, 10)).filter(n => !isNaN(n));
const FROM = process.env.REMINDER_FROM || "Above & Beyond ABA <reminders@abtaba.com>";
const REPLY_TO = process.env.REMINDER_REPLY_TO || "info@abtaba.com";

// Event date + logistics. Env date wins; falls back to the known Cary date.
const EVENT_DATE = {
  charlotte: process.env.EVENT_CHARLOTTE_DATE || null,
  cary: process.env.EVENT_CARY_DATE || "2026-08-09",
};
const EVENT_INFO = {
  cary: {
    title: "Free Magical Day of Fun",
    dateLabel: "Sunday, August 9",
    time: "11:00 AM – 2:00 PM",
    venue: "We Rock the Spectrum Kids Gym",
    address: "111 Mackenan Dr, Cary, NC 27511",
    mapHref: "https://maps.google.com/?q=111+Mackenan+Dr,+Cary,+NC+27511",
  },
  charlotte: {
    title: "Free Magical Day of Fun",
    dateLabel: process.env.EVENT_CHARLOTTE_DATE || "our event day",
    time: "11:00 AM – 2:00 PM",
    venue: "Above & Beyond ABA Therapy",
    address: "",
    mapHref: "",
  },
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
function esc(s){ return String(s||"").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }

// ---- Email building -------------------------------------------------------

const BRAND_ORANGE = "#F59E2C";
const BRAND_NAVY = "#1B3A6B";

// The things families will experience — reused across the sequence.
const HIGHLIGHTS = [
  ["🎩", "Live magic show"],
  ["🎈", "Balloon art & face painting"],
  ["🦸", "Meet a character (and our superhero van!)"],
  ["🤸", "Spacious, sensory-friendly indoor gym"],
  ["✂️", "Autism-friendly barber on site — free haircuts"],
  ["📖", "Social-stories workshop with Jill Wichern, licensed in special education"],
  ["🍎", "Refreshments & door prizes"],
];

function highlightsHtml(){
  return `<ul style="list-style:none;padding:0;margin:16px 0;">` +
    HIGHLIGHTS.map(([icon,text]) =>
      `<li style="margin:0 0 10px;font-size:16px;line-height:1.5;color:#333;">
         <span style="display:inline-block;width:26px;">${icon}</span>${esc(text)}</li>`
    ).join("") +
  `</ul>`;
}

function logisticsHtml(ev){
  const addr = ev.address
    ? `<div style="margin-top:4px;">📍 ${ev.mapHref ? `<a href="${ev.mapHref}" style="color:${BRAND_NAVY};">${esc(ev.address)}</a>` : esc(ev.address)}</div>`
    : "";
  return `<div style="background:#FFF6E8;border-radius:12px;padding:16px 20px;margin:20px 0;font-size:16px;line-height:1.6;color:${BRAND_NAVY};">
      <strong style="font-size:18px;">${esc(ev.title)}</strong><br>
      🗓️ ${esc(ev.dateLabel)} &nbsp;•&nbsp; ⏰ ${esc(ev.time)}
      ${addr}
    </div>`;
}

// Branded wrapper. `preheader` is the hidden inbox-preview line.
function shell(preheader, innerHtml){
  return `<div style="margin:0;padding:0;background:#f4f4f7;">
    <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${esc(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
          <tr><td style="background:${BRAND_ORANGE};padding:22px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;">above &amp; beyond</span>
            <span style="color:#ffffff;font-size:13px;letter-spacing:2px;display:block;">ABA THERAPY</span>
          </td></tr>
          <tr><td style="padding:32px;">${innerHtml}</td></tr>
          <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;font-size:12px;line-height:1.6;color:#888;">
            You're receiving this because you registered for our free community event.<br>
            Above &amp; Beyond ABA Therapy &nbsp;•&nbsp; Questions? Just reply to this email.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </div>`;
}

function greeting(first){ return `<p style="font-size:16px;color:#333;margin:0 0 16px;">Hi ${esc(first)},</p>`; }
function signoff(){ return `<p style="font-size:16px;color:#333;margin:24px 0 0;">Warmly,<br><strong>The Above &amp; Beyond ABA Team</strong></p>`; }
function h1(text){ return `<h1 style="font-size:26px;line-height:1.25;color:${BRAND_NAVY};margin:0 0 16px;">${esc(text)}</h1>`; }

// Build {subject, html} for a given offset (days before the event).
function buildEmail(offset, first, ev){
  // 7 days out — the "why + what" welcome.
  if(offset >= 7){
    return {
      subject: `You're invited — one week to our Free Magical Day of Fun! 🎉`,
      html: shell(
        `One week to go — here's why we created this day and what's waiting for your family.`,
        greeting(first) +
        h1("We're one week away! 🎉") +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 16px;">
          We created our <strong>Free Magical Day of Fun</strong> for one simple reason: every family in the
          autism community deserves a day to relax, play, and simply be themselves — with no judgment and no pressure.
          So we're bringing together a sensory-friendly space, welcoming faces, and a whole lot of joy, completely free.</p>` +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 8px;"><strong>Here's what's waiting for you:</strong></p>` +
        highlightsHtml() +
        logisticsHtml(ev) +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0;">
          Your spot is reserved — we can't wait to welcome you and your family. Watch for a few friendly reminders
          as the day gets closer!</p>` +
        signoff()
      ),
    };
  }
  // 3 days out.
  if(offset === 3){
    return {
      subject: `3 days to go — your Magical Day of Fun is almost here! ✨`,
      html: shell(
        `Just 3 days until the Free Magical Day of Fun. Here's everything you need.`,
        greeting(first) +
        h1("Just 3 days to go! ✨") +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 8px;">
          We're getting everything ready for you. Here's a peek at what your family can enjoy:</p>` +
        highlightsHtml() +
        logisticsHtml(ev) +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0;">
          Tip: our autism-friendly barber tends to stay busy — arriving early in your time slot is the best way
          to catch a free haircut. See you soon!</p>` +
        signoff()
      ),
    };
  }
  // 2 days out.
  if(offset === 2){
    return {
      subject: `See you this weekend! Your Magical Day of Fun is 2 days away 🎈`,
      html: shell(
        `Two days to go — here are the details for your Magical Day of Fun.`,
        greeting(first) +
        h1("Almost time — 2 days to go! 🎈") +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 16px;">
          We're so looking forward to seeing you and your family. Here are your details so everything's easy on the day:</p>` +
        logisticsHtml(ev) +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 8px;">A quick reminder of what's in store:</p>` +
        highlightsHtml() +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0;">
          Everything is free, and no special preparation is needed — just bring your family and come as you are.</p>` +
        signoff()
      ),
    };
  }
  // Day-of (offset 0) — or any other day if forced.
  return {
    subject: `Today's the day! 🎉 Your Free Magical Day of Fun`,
    html: shell(
      `It's here! Doors are open ${esc(ev.time)} today — we can't wait to see you.`,
      greeting(first) +
      h1("Today's the day! 🎉") +
      `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 16px;">
        It's finally here — our <strong>Free Magical Day of Fun</strong> is happening today.
        We can't wait to welcome you and your family!</p>` +
      logisticsHtml(ev) +
      `<p style="font-size:16px;line-height:1.6;color:#333;margin:0;">
        Come anytime during the event — magic, haircuts, the gym, and treats will all be going.
        Travel safe, and see you very soon!</p>` +
      signoff()
    ),
  };
}

// ---- Handler --------------------------------------------------------------

export default async function handler(req, res){
  if(!authorized(req)) return res.status(401).json({error:"unauthorized"});
  const token = process.env.EVENTBRITE_TOKEN;
  if(!token) return res.status(400).json({error:"No EVENTBRITE_TOKEN set"});

  const q = req.query || {};
  const which = (q.event || "charlotte").toLowerCase();     // charlotte | cary | all
  const audience = (q.audience || "pending").toLowerCase(); // pending | all
  const force = q.force === "1" || q.force === "true";       // bypass the date gate (manual testing)
  const forceOffset = q.offset !== undefined ? parseInt(q.offset, 10) : null; // preview a specific email
  const apiKey = process.env.RESEND_API_KEY;
  const liveEnabled = process.env.REMINDERS_LIVE === "1";

  let out;
  try { ({out} = await getEvents(token)); }
  catch(e){ return res.status(502).json({error:String(e && e.message || e)}); }

  const wanted = out.events.filter(e => which === "all" ? true : e.key === which);

  // Per-event date gate: only a scheduled send day passes (unless forced).
  const gated = wanted.map(e => {
    const d = daysUntil(EVENT_DATE[e.key]);
    const dueToday = force || (d !== null && OFFSETS.includes(d));
    return { event:e, daysUntil:d, dueToday };
  });

  // Gather recipients from events that are due today, tagging the offset that fired.
  const seen = new Set();
  const recipients = [];
  for(const g of gated){
    if(!g.dueToday) continue;
    const offset = forceOffset !== null ? forceOffset : g.daysUntil;
    for(const f of g.event.families){
      if(audience === "pending" && f.confirmed) continue;
      const email = (f.email||"").trim();
      const key = email.toLowerCase();
      if(!email || seen.has(key)) continue;
      seen.add(key);
      recipients.push({ email, name:f.purchaser||"", eventKey:g.event.key, offset });
    }
  }

  const willSend = liveEnabled && !!apiKey && recipients.length > 0;

  // PREVIEW: report only, send nothing.
  if(!willSend){
    const reasons = [];
    if(!apiKey) reasons.push("RESEND_API_KEY not set");
    if(!liveEnabled) reasons.push("REMINDERS_LIVE not '1' (still in preview)");
    if(recipients.length === 0) reasons.push("no recipients due today");
    return res.status(200).json({
      mode:"preview", today:todayISO(), event:which, audience,
      schedule: gated.map(g => ({event:g.event.key, date:EVENT_DATE[g.event.key]||null, daysUntil:g.daysUntil, dueToday:g.dueToday})),
      wouldSend: recipients.length, reasons,
      sample: recipients[0] ? (()=>{ const ev=EVENT_INFO[recipients[0].eventKey]||EVENT_INFO.cary; const m=buildEmail(recipients[0].offset, "there", ev); return {offset:recipients[0].offset, subject:m.subject}; })() : null,
      recipients: recipients.map(r => r.email)
    });
  }

  // LIVE: one personalized email per family via Resend.
  const results = { sent:0, failed:0, errors:[] };
  for(const r of recipients){
    const first = r.name ? r.name.trim().split(/\s+/)[0] : "there";
    const ev = EVENT_INFO[r.eventKey] || EVENT_INFO.cary;
    const { subject, html } = buildEmail(r.offset, first, ev);
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
  return res.status(200).json({ mode:"sent", today:todayISO(), event:which, audience, ...results });
}
