// Shared email templates for the Above & Beyond ABA "Free Magical Day of Fun"
// event sequence. Imported by both the mailer (send-reminders.js) and the
// dashboard preview endpoint (email-preview.js) so what you approve is exactly
// what sends.

function esc(s){ return String(s||"").replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }

const BRAND_ORANGE = "#F59E2C";
const BRAND_NAVY = "#1B3A6B";
const CONFIRM_GREEN = "#2E9E5B";

export const EVENT_INFO = {
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

// What families will experience — reused across the sequence.
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

// The "confirm your spot" call-to-action. Renders nothing without a URL.
function confirmButton(confirmUrl){
  if(!confirmUrl) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td align="center">
      <a href="${confirmUrl}" style="background:${CONFIRM_GREEN};color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:15px 30px;border-radius:10px;display:inline-block;">✅ Yes — confirm our spot</a>
    </td></tr></table>
    <p style="text-align:center;font-size:13px;color:#888;margin:8px 0 0;">One tap lets us know your family is coming.</p>`;
}

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
// confirmUrl is the per-recipient "confirm my spot" link (omit for generic preview).
export function buildEmail(offset, first, ev, confirmUrl){
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
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 8px;">
          Can we count you in? Tap below to lock in your family's spot:</p>` +
        confirmButton(confirmUrl) +
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
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 8px;">
          Haven't confirmed yet? One tap helps us plan for you:</p>` +
        confirmButton(confirmUrl) +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:16px 0 0;">
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
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 8px;">
          Still need to confirm? It only takes a tap:</p>` +
        confirmButton(confirmUrl) +
        `<p style="font-size:16px;line-height:1.6;color:#333;margin:16px 0 0;">
          Everything is free, and no special preparation is needed — just bring your family and come as you are.</p>` +
        signoff()
      ),
    };
  }
  // Day-of (offset 0) — or any other day if forced. No confirm button; it's game day.
  return {
    subject: `Today's the day! 🎉 Your Free Magical Day of Fun`,
    html: shell(
      `It's here! We're open ${esc(ev.time)} today — we can't wait to see you.`,
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

// Shared library, not an HTTP route. Inert default export keeps Vercel happy.
export default function handler(_req, res){ res.status(404).json({ error: "not a route" }); }

export const SEQUENCE_OFFSETS = [7, 3, 2, 0];
export const OFFSET_LABELS = {
  7: "One-week welcome (why + what's included)",
  3: "3-day reminder",
  2: "2-day reminder",
  0: "Day-of note",
};
