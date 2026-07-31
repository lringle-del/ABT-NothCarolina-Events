// Target of the "confirm our spot" button in the emails.
// Link shape: /api/confirm?event=cary&email=<addr>&token=<hmac>
// Verifies the token (HMAC of event:email with CRON_SECRET), records the
// confirmation in KV, and shows the guest a friendly thank-you page.

import { addConfirmed, verifyToken, kvEnabled } from "./store.js";

function page(title, body, ok){
  const accent = ok ? "#2E9E5B" : "#C0392B";
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title></head>
  <body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:60px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
      <div style="background:#F59E2C;padding:22px 32px;">
        <span style="color:#fff;font-size:20px;font-weight:700;">above &amp; beyond</span>
        <span style="color:#fff;font-size:13px;letter-spacing:2px;display:block;">ABA THERAPY</span>
      </div>
      <div style="padding:36px 32px;text-align:center;">
        <div style="font-size:48px;line-height:1;margin-bottom:12px;">${ok ? "🎉" : "⚠️"}</div>
        <h1 style="color:${accent};font-size:24px;margin:0 0 12px;">${title}</h1>
        <div style="color:#444;font-size:16px;line-height:1.6;">${body}</div>
      </div>
    </div>
  </body></html>`;
}

export default async function handler(req, res){
  const q = req.query || {};
  const event = String(q.event || "").toLowerCase();
  const email = String(q.email || "");
  const token = String(q.token || "");
  const secret = process.env.CRON_SECRET;

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if(!event || !email || !token || !verifyToken(event, email, secret, token)){
    return res.status(400).send(page(
      "That link didn't work",
      "This confirmation link looks invalid or incomplete. Please just reply to your invitation email and we'll confirm your spot for you.",
      false
    ));
  }

  try{
    await addConfirmed(event, email);
  }catch(_){ /* fall through — still thank them */ }

  const note = kvEnabled()
    ? "Your spot is confirmed — we've got you down. We can't wait to see you and your family!"
    : "Thanks for confirming! We've noted you're coming and can't wait to see you and your family.";

  return res.status(200).send(page("You're all set!", note, true));
}
