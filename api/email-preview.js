// Renders a single email from the sequence as HTML, for the dashboard preview.
//   GET /api/email-preview?event=cary&offset=7[&name=Gladys]
// The confirm button points at "#" here (it's just a preview).

import { buildEmail, EVENT_INFO, SEQUENCE_OFFSETS } from "./emails.js";

export default function handler(req, res){
  const q = req.query || {};
  const event = String(q.event || "cary").toLowerCase();
  let offset = parseInt(q.offset, 10);
  if(!SEQUENCE_OFFSETS.includes(offset)) offset = 7;
  const first = q.name ? String(q.name) : "there";
  const ev = EVENT_INFO[event] || EVENT_INFO.cary;

  const { html } = buildEmail(offset, first, ev, "#");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(html);
}
