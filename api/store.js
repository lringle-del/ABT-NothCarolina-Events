// Tiny persistence layer over Vercel KV (Upstash Redis) using its REST API —
// no npm dependency, no build step. If KV isn't configured, every read returns
// a safe empty default and writes are no-ops, so the rest of the app keeps working
// (approvals simply stay "not approved" and confirmations aren't recorded).
//
// Stores two things per event:
//   approval:<event>:<offset>  = "1" when that email is approved to send
//   confirmed:<event>          = a set of lowercased emails who tapped "confirm"

import crypto from "node:crypto";

const URL_ = process.env.KV_REST_API_URL || null;
const TOKEN = process.env.KV_REST_API_TOKEN || null;

export function kvEnabled(){ return !!(URL_ && TOKEN); }

// Run one Upstash REST command, e.g. cmd(["set","k","v"]) or cmd(["smembers","k"]).
async function cmd(parts){
  if(!kvEnabled()) return null;
  const path = parts.map(p => encodeURIComponent(String(p))).join("/");
  const resp = await fetch(`${URL_}/${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if(!resp.ok) throw new Error(`KV ${resp.status}`);
  const j = await resp.json();
  return j.result;
}

// ---- Approvals ------------------------------------------------------------

export async function getApprovals(event, offsets){
  const result = {};
  for(const o of offsets) result[o] = false;
  if(!kvEnabled()) return result;
  try{
    const keys = offsets.map(o => `approval:${event}:${o}`);
    const vals = await cmd(["mget", ...keys]); // array aligned to keys
    offsets.forEach((o, i) => { result[o] = (vals && vals[i]) === "1"; });
  }catch(_){ /* leave defaults (all false) */ }
  return result;
}

export async function setApproval(event, offset, approved){
  if(!kvEnabled()) return false;
  const key = `approval:${event}:${offset}`;
  if(approved) await cmd(["set", key, "1"]);
  else await cmd(["del", key]);
  return true;
}

// ---- Confirmations --------------------------------------------------------

export async function getConfirmed(event){
  if(!kvEnabled()) return [];
  try{
    const members = await cmd(["smembers", `confirmed:${event}`]);
    return Array.isArray(members) ? members.map(m => String(m).toLowerCase()) : [];
  }catch(_){ return []; }
}

export async function addConfirmed(event, email){
  if(!kvEnabled()) return false;
  await cmd(["sadd", `confirmed:${event}`, String(email).toLowerCase()]);
  return true;
}

// ---- Confirm-link tokens (HMAC, so links can't be forged) -----------------

export function confirmToken(event, email, secret){
  return crypto.createHmac("sha256", secret || "")
    .update(`${event}:${String(email).toLowerCase()}`)
    .digest("base64url");
}

export function verifyToken(event, email, secret, token){
  if(!token) return false;
  const expected = confirmToken(event, email, secret);
  const a = Buffer.from(expected), b = Buffer.from(String(token));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Shared library, not an HTTP route. Inert default export keeps Vercel happy.
export default function handler(_req, res){ res.status(404).json({ error: "not a route" }); }
