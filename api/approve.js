// Approval state for the email sequence, driven from the dashboard.
//
//   GET /api/approve?event=cary
//     → public read: { enabled, approvals:{7:false,...}, confirmedCount }
//
//   GET /api/approve?event=cary&offset=7&approved=1&key=<CRON_SECRET>
//     → admin write: sets/clears one email's approval, returns the new state.
//
// The write requires the admin key (CRON_SECRET) so a public dashboard visitor
// can view status but only you can approve.

import { getApprovals, setApproval, getConfirmed, kvEnabled } from "./store.js";
import { SEQUENCE_OFFSETS } from "./emails.js";

export default async function handler(req, res){
  const q = req.query || {};
  const event = String(q.event || "cary").toLowerCase();

  // Admin write path.
  if(q.offset !== undefined && q.approved !== undefined){
    const secret = process.env.CRON_SECRET;
    if(!secret || q.key !== secret) return res.status(401).json({ error: "unauthorized" });
    if(!kvEnabled()) return res.status(400).json({ error: "storage not configured (add Vercel KV)" });
    const offset = parseInt(q.offset, 10);
    if(!SEQUENCE_OFFSETS.includes(offset)) return res.status(400).json({ error: "unknown offset" });
    const approved = q.approved === "1" || q.approved === "true";
    try{ await setApproval(event, offset, approved); }
    catch(e){ return res.status(502).json({ error: String(e && e.message || e) }); }
  }

  const approvals = await getApprovals(event, SEQUENCE_OFFSETS);
  const confirmed = await getConfirmed(event);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    event,
    enabled: kvEnabled(),
    approvals,
    confirmedCount: confirmed.length,
  });
}
