// Sends a SAMPLE of the sequence emails to a chosen address, from the dashboard.
//   GET /api/send-sample?event=cary&offset=7&to=you@abtaba.com&key=<CRON_SECRET>
//   offset=all sends all four. Subjects are prefixed [SAMPLE]. The confirm button
//   is inert (points at "#") so a sample can't accidentally confirm anyone.
//
// Admin-key protected (CRON_SECRET). Requires RESEND_API_KEY. Ignores the
// REMINDERS_LIVE gate on purpose — this is a manual test to yourself.

import { buildEmail, EVENT_INFO, SEQUENCE_OFFSETS } from "./emails.js";

const FROM = process.env.REMINDER_FROM || "Above & Beyond ABA <reminders@abtaba.com>";
const REPLY_TO = process.env.REMINDER_REPLY_TO || "info@abtaba.com";

function baseUrl(req){
  if(process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}
function validEmail(e){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

export default async function handler(req, res){
  const q = req.query || {};
  const secret = process.env.CRON_SECRET;
  if(!secret || q.key !== secret) return res.status(401).json({ error: "unauthorized" });

  const apiKey = process.env.RESEND_API_KEY;
  if(!apiKey) return res.status(400).json({ error: "RESEND_API_KEY not set" });

  const event = String(q.event || "cary").toLowerCase();
  const to = String(q.to || "").trim();
  if(!validEmail(to)) return res.status(400).json({ error: "provide a valid ?to= email" });

  const offsets = String(q.offset) === "all"
    ? SEQUENCE_OFFSETS
    : [parseInt(q.offset, 10)].filter(o => SEQUENCE_OFFSETS.includes(o));
  if(!offsets.length) return res.status(400).json({ error: "provide ?offset=7|3|2|0|all" });

  const ev = EVENT_INFO[event] || EVENT_INFO.cary;
  const logoUrl = `${baseUrl(req)}/logo.png`;

  const results = { to, sent: 0, failed: 0, errors: [] };
  for(const offset of offsets){
    const { subject, html } = buildEmail(offset, "there", ev, "#", logoUrl);
    try{
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject: `[SAMPLE] ${subject}`, html })
      });
      if(resp.ok) results.sent++;
      else { results.failed++; results.errors.push(`offset ${offset}: HTTP ${resp.status}`); }
    }catch(err){ results.failed++; results.errors.push(`offset ${offset}: ${String(err && err.message || err)}`); }
  }
  return res.status(200).json({ ok: results.failed === 0, ...results });
}
