// Secure Eventbrite sync for the Above & Beyond ABA event dashboard.
// The private Eventbrite token lives ONLY in the Vercel Environment Variable
// EVENTBRITE_TOKEN and is never sent to the browser.

const BASE = "https://www.eventbriteapi.com/v3";
// Test / non-attendee registrations to exclude from every count.
const TEST_EMAILS = new Set([
  "lringle@abtaba.com",
  "david@stradg.com",
  "kristen.porras@powerdigitalmarketinginc.com"
]);
const isTest = e => TEST_EMAILS.has((e||"").trim().toLowerCase());

// Static data not held in Eventbrite: Charlotte confirmations + Cary form families.
const CONFIRMED_EMAILS = ["asanthoshsagar@outlook.com", "bmsmall19@yahoo.com", "jasminebratton9023@gmail.com", "ms.s.burns@gmail.com", "nturner1st@gmail.com", "shakethacrawford@yahoo.com", "slouther@gmail.com", "swathi.gujjari9@gmail.com", "tfedwards85@gmail.com", "thebestofthebest24@gmail.com", "tuliamolinagarcia@gmail.com"];
const CARY_FORM_FAMILIES = [{"source": "Microsoft Form", "order": "Form #6", "date": "2026-06-19", "purchaser": "Monica Orellana", "email": "Moniyi80@gmail.com", "phone": "6464201430", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Mateo", "age": "10", "dx": "Yes", "aba": "No", "looking": "No", "gain": "Information", "haircut": "Yes"}, {"child": "Joseph", "age": "2", "dx": "Yes", "aba": "No", "looking": "I am exploring options", "gain": "Information", "haircut": "Yes"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #7", "date": "2026-07-09", "purchaser": "Jolanda Dixon", "email": "jolandadixon26@gmail.com", "phone": "9843014726", "timeslot": "1:00 PM-2:00 PM", "attendees": [{"child": "Jaxyn Dixon", "age": "10", "dx": "Yes", "aba": "No", "looking": "No", "gain": "Mingling", "haircut": "No"}], "confirmed": null, "count": 1}, {"source": "Microsoft Form", "order": "Form #8", "date": "2026-07-11", "purchaser": "Aldabbagh", "email": "mustafasaad88@gmail.com", "phone": "9195239459", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Taim Aldabbagh", "age": "11", "dx": "No", "aba": "No", "looking": "No", "gain": "Learning", "haircut": "Yes"}, {"child": "Jad Aldabbagh", "age": "4", "dx": "No", "aba": "No", "looking": "No", "gain": "Learning", "haircut": "Yes"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #9", "date": "2026-07-14", "purchaser": "Vidhyabharathi Janarthanan", "email": "j.vidhyabharathi@gmail.com", "phone": "9379792092", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Rudran", "age": "8", "dx": "Yes", "aba": "No", "looking": "No", "gain": "Just explore if anything would be suitable for the child", "haircut": "No"}], "confirmed": null, "count": 1}, {"source": "Microsoft Form", "order": "Form #10", "date": "2026-07-15", "purchaser": "Migdalis Clemmons", "email": "dmclemmons@hotmail.com", "phone": "9196568872", "timeslot": "1:00 PM-2:00 PM", "attendees": [{"child": "Ruby", "age": "6", "dx": "Yes", "aba": "No", "looking": "I am exploring options", "gain": "Different options", "haircut": "Yes"}], "confirmed": null, "count": 1}];
const CHARLOTTE_FORM_FAMILIES = [{"source": "Microsoft Form", "order": "Form #2", "date": "2026-05-22", "purchaser": "Rhonda Fernandez", "email": "rhonda.fernandez@stepstoneyouth.com", "phone": "704-351-8336", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "I am a community partner with StepStone Family and Youth Services", "age": "Not bringing a child. I will attend alone as a community partner.", "dx": "", "aba": "", "looking": "", "gain": "Tour your facilities", "haircut": "No"}], "confirmed": null, "count": 1}, {"source": "Microsoft Form", "order": "Form #3", "date": "2026-06-08", "purchaser": "Tammyfaye Gillespie", "email": "Tfedwards85@gmail.com", "phone": "980-307-9177", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Jermaine Gillespie Jr", "age": "9", "dx": "In the process of getting diagnosed", "aba": "No", "looking": "I am exploring options", "gain": "Behavioral, learning and socializing challenges", "haircut": "No"}, {"child": "Jayceon Gillespie", "age": "7", "dx": "In the process of getting diagnosed", "aba": "No", "looking": "I am exploring options", "gain": "Behavioral, learning and socializing challenges", "haircut": "No"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #4", "date": "2026-06-08", "purchaser": "Nicole Logan", "email": "Kleenish26@yahoo.com", "phone": "704-606-3983", "timeslot": "12:00 PM-1:00 PM", "attendees": [{"child": "Lauryn Redfearn", "age": "9", "dx": "No", "aba": "No", "looking": "No", "gain": "No", "haircut": "No"}], "confirmed": null, "count": 1}, {"source": "Microsoft Form", "order": "Form #5", "date": "2026-06-12", "purchaser": "Manal Bachan", "email": "sabahbachan169@gmail.com", "phone": "7047705675", "timeslot": "1:00 PM-2:00 PM", "attendees": [{"child": "Abdulmohsen", "age": "9 years", "dx": "No", "aba": "No", "looking": "", "gain": "Learning new stuff", "haircut": "Yes"}], "confirmed": null, "count": 1}, {"source": "Microsoft Form", "order": "Form #6", "date": "2026-06-24", "purchaser": "Elizabeth Almendarez", "email": "liz.zylizz@icloud.com", "phone": "9807292124", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Leslie", "age": "6", "dx": "Yes", "aba": "Previously received", "looking": "No", "gain": "Feel comfortable where My daughter can be herself and won’t be judged for having autism and she can enjoy herself", "haircut": "No"}, {"child": "Isabella", "age": "9", "dx": "No", "aba": "No", "looking": "No", "gain": "Feel comfortable where My daughter can be herself and won’t be judged for having autism and she can enjoy herself", "haircut": "No"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #7", "date": "2026-06-25", "purchaser": "Givens", "email": "Emilysgivens@gmail.com", "phone": "704-281-2529", "timeslot": "1:00 PM-2:00 PM", "attendees": [{"child": "Emryn", "age": "11", "dx": "No", "aba": "No", "looking": "No", "gain": "Family love and understanding", "haircut": "Yes"}, {"child": "Breylin Givens", "age": "18", "dx": "No", "aba": "No", "looking": "No", "gain": "Family love and understanding", "haircut": "No"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #8", "date": "2026-07-06", "purchaser": "Brittany Ridenhour", "email": "Bmsmall19@yahoo.com", "phone": "7046394003", "timeslot": "12:00 PM-1:00 PM", "attendees": [{"child": "Deagan Ridenhour", "age": "4", "dx": "Yes", "aba": "Yes", "looking": "No", "gain": "Learning experiences", "haircut": "Yes"}, {"child": "Destry Ridenhour", "age": "6", "dx": "No", "aba": "No", "looking": "No", "gain": "Learning experiences", "haircut": "Yes"}, {"child": "Dutton Ridenhour", "age": "2", "dx": "No", "aba": "No", "looking": "No", "gain": "Learning experiences", "haircut": "No"}], "confirmed": null, "count": 3}, {"source": "Microsoft Form", "order": "Form #9", "date": "2026-07-09", "purchaser": "Erricka Edmonds", "email": "errickadbrooks@gmail.com", "phone": "4043234188", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Todd Edmonds", "age": "7", "dx": "Yes", "aba": "Yes", "looking": "I am exploring options", "gain": "Learn more about this company", "haircut": "Yes"}, {"child": "Taylor Edmonds", "age": "9", "dx": "No", "aba": "No", "looking": "No", "gain": "Learn more about this company", "haircut": "No"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #10", "date": "2026-07-15", "purchaser": "Kimberly spencer", "email": "Kim.Spencer42@yahoo.com", "phone": "9432887751", "timeslot": "12:00 PM-1:00 PM", "attendees": [{"child": "Ava brown", "age": "7", "dx": "Yes", "aba": "Yes", "looking": "No", "gain": "My daughter is already a member at above and beyond aba", "haircut": "No"}, {"child": "Kha’mari green", "age": "7", "dx": "No", "aba": "No", "looking": "No", "gain": "My daughter is already a member at above and beyond aba", "haircut": "Yes"}, {"child": "Addisyn spencer", "age": "2", "dx": "No", "aba": "No", "looking": "No", "gain": "My daughter is already a member at above and beyond aba", "haircut": "No"}], "confirmed": null, "count": 3}, {"source": "Microsoft Form", "order": "Form #11", "date": "2026-07-17", "purchaser": "Razan Sirriyeh", "email": "Srrazan9@gmail.com", "phone": "9803953013", "timeslot": "12:00 PM-1:00 PM", "attendees": [{"child": "Zaina Alhawamleh", "age": "7", "dx": "Yes", "aba": "Yes", "looking": "No", "gain": "To explore and learn and have fun time with my two kids and to meet and learn from other parents of children of autism.", "haircut": "No"}, {"child": "Ibrahim Alhawamleh", "age": "5", "dx": "No", "aba": "No", "looking": "No", "gain": "To explore and learn and have fun time with my two kids and to meet and learn from other parents of children of autism.", "haircut": "Yes"}], "confirmed": null, "count": 2}];

function h(t){ return { Authorization: `Bearer ${t}` }; }
async function ebGet(path, token, params={}){
  const url = new URL(BASE + path);
  for (const [k,v] of Object.entries(params)) if (v!=null) url.searchParams.set(k,v);
  const r = await fetch(url,{headers:h(token)});
  if(!r.ok) throw new Error(`Eventbrite ${path} -> ${r.status}`);
  return r.json();
}
async function allAttendees(eventId, token){
  let out=[], cont=null, page=1, guard=0;
  // Eventbrite returns attendees ~50 at a time. Walk every page via the
  // continuation token, falling back to page numbers if no token is given.
  while(++guard<=200){
    const params={};
    if(cont) params.continuation=cont;
    else if(page>1) params.page=page;
    const d = await ebGet(`/events/${eventId}/attendees/`, token, params);
    const batch = d.attendees||[];
    out = out.concat(batch);
    const p = d.pagination||{};
    if(p.has_more_items && p.continuation){ cont=p.continuation; page++; continue; }
    if(p.has_more_items && p.page_count && page<p.page_count && batch.length){ page++; continue; }
    break;
  }
  return out;
}
function findAnswer(answers, keywords){
  for(const a of answers||[]){
    const q=(a.question||"").toLowerCase();
    if(keywords.every(k=>q.includes(k))) return (a.answer||"").trim();
  }
  return "";
}
function attendeeToChild(at){
  const ans=at.answers||[];
  return {
    child: findAnswer(ans,["child","name"]),
    age: findAnswer(ans,["child","age"]),
    dx: findAnswer(ans,["autism","diagnosis"]),
    aba: findAnswer(ans,["receiving","aba"]),
    looking: findAnswer(ans,["looking","aba"]),
    gain: findAnswer(ans,["gain"]) || findAnswer(ans,["get","out","event"]),
    haircut: findAnswer(ans,["haircut"])
  };
}
function buildFamilies(attendees){
  const orders=new Map();
  for(const at of attendees){
    if(at.cancelled||at.refunded) continue;
    const email=((at.profile&&at.profile.email)||"").trim();
    if(isTest(email)) continue;
    const oid=String(at.order_id||at.id);
    if(!orders.has(oid)) orders.set(oid,{source:"Eventbrite",order:oid,
      date:(at.created||"").slice(0,10),
      purchaser:((at.profile&&at.profile.name)||"").trim(),
      email, phone:((at.profile&&at.profile.cell_phone)||"").trim(),
      timeslot:"", ticket:((at.ticket_class_name)||"").trim(), emails:new Set(), attendees:[]});
    const fam=orders.get(oid);
    if(!fam.ticket && at.ticket_class_name) fam.ticket=String(at.ticket_class_name).trim();
    fam.emails.add(email.toLowerCase());
    fam.attendees.push(attendeeToChild(at));
  }
  return [...orders.values()];
}
// Discover EVERY event this token can see (across all the user's organizations),
// returning each event's id, name, status, start date and venue. Grouping into
// dashboard tabs happens later in getEvents so that all events — Charlotte, Cary,
// We Rock the Spectrum, and anything added in the future — show up automatically.
async function discoverEvents(token){
  const found=[], candidates=[];
  try{
    const me=await ebGet(`/users/me/organizations/`, token);
    for(const org of me.organizations||[]){
      let page=1, pages=1;
      do{
        // status:"all" so already-passed events are still returned; expand the
        // venue so we can label each tab with where it takes place.
        const d=await ebGet(`/organizations/${org.id}/events/`, token, {order_by:"start_asc",status:"all",page,expand:"venue"});
        for(const ev of d.events||[]){
          const name=((ev.name&&ev.name.text)||"").trim();
          const item={
            id:ev.id, name, status:ev.status,
            start:((ev.start&&ev.start.local)||"").slice(0,10),
            venue:((ev.venue&&ev.venue.name)||"").trim()
          };
          found.push(item);
          candidates.push({id:ev.id, name, status:ev.status});
        }
        pages=d.pagination?d.pagination.page_count:1;
      } while(page++<pages && page<=20);
    }
  }catch(e){}
  return {found, candidates};
}
// Fetch and merge attendees across a list of event ids. A single unreadable
// event id is skipped rather than failing the whole payload.
async function attendeesForAll(idList, token){
  let raw=[];
  for(const id of idList){
    try{ raw = raw.concat(await allAttendees(id, token)); }
    catch(e){ /* skip an event id that can't be read */ }
  }
  return raw;
}
function slug(s){ return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "event"; }
// Known "We Rock the Spectrum" listing id, used only if name discovery misses it.
const WRTS_FALLBACK_IDS=["1993615746364"];

// Build the full events payload (shared by the dashboard API and the reminder mailer).
// Every event the token can see becomes its own dashboard tab:
//   • Charlotte & Cary are both the "Magical Day of Fun" (split by the word "cary").
//   • We Rock the Spectrum's several time-slot listings merge into one tab.
//   • Any other event becomes its own tab, keyed by name, so nothing is left out.
export async function getEvents(token){
  const envList=v=>v?String(v).split(",").map(s=>s.trim()).filter(Boolean):null;
  const {found, candidates}=await discoverEvents(token);

  // Group discovered events into logical dashboard tabs.
  const groups=new Map();
  const ensure=(key,meta)=>{ if(!groups.has(key)) groups.set(key,{key,ids:new Set(),start:"",...meta}); return groups.get(key); };
  const addId=(g,id,start)=>{ g.ids.add(String(id)); if(start&&(!g.start||start<g.start)) g.start=start; };

  for(const ev of found){
    const n=ev.name.toLowerCase();
    let g;
    if(n.includes("we rock the spectrum") || n.includes("spectrum kids gym")){
      g=ensure("wrts",{name:"We Rock the Spectrum",venue:ev.venue||"We Rock the Spectrum Kids Gym",hasConfirm:false});
    } else if(n.includes("magical") && n.includes("cary")){
      g=ensure("cary",{name:"Cary",venue:ev.venue||"We Rock the Spectrum Kids Gym",hasConfirm:false});
    } else if(n.includes("magical")){
      g=ensure("charlotte",{name:"Charlotte",venue:ev.venue||"Free Magical Day of Fun",hasConfirm:true});
    } else {
      g=ensure(slug(ev.name),{name:ev.name||"Event",venue:ev.venue||"",hasConfirm:false});
    }
    addId(g,ev.id,ev.start);
  }

  // Explicit env overrides (comma-separated event ids) win over name discovery.
  const applyOverride=(key,meta,ids)=>{ if(!ids)return; ensure(key,meta).ids=new Set(ids.map(String)); };
  applyOverride("charlotte",{name:"Charlotte",venue:"Free Magical Day of Fun",hasConfirm:true},envList(process.env.EVENT_CHARLOTTE));
  applyOverride("cary",{name:"Cary",venue:"We Rock the Spectrum Kids Gym",hasConfirm:false},envList(process.env.EVENT_CARY));
  applyOverride("wrts",{name:"We Rock the Spectrum",venue:"We Rock the Spectrum Kids Gym",hasConfirm:false},envList(process.env.EVENT_WRTS));

  // If We Rock the Spectrum wasn't found by name or override, fall back to the
  // known listing id so its tab still appears.
  if(!groups.has("wrts")){
    const g=ensure("wrts",{name:"We Rock the Spectrum",venue:"We Rock the Spectrum Kids Gym",hasConfirm:false});
    for(const id of WRTS_FALLBACK_IDS) g.ids.add(id);
  }
  // Charlotte & Cary always exist — they carry static Microsoft Form families.
  ensure("charlotte",{name:"Charlotte",venue:"Free Magical Day of Fun",hasConfirm:true});
  ensure("cary",{name:"Cary",venue:"We Rock the Spectrum Kids Gym",hasConfirm:false});

  const confirmed=new Set(CONFIRMED_EMAILS.map(e=>e.toLowerCase()));
  const built=[];
  for(const g of groups.values()){
    const raw=await attendeesForAll([...g.ids], token);
    const fams=buildFamilies(raw).map(f=>{
      const isConf=[...f.emails].some(e=>confirmed.has(e));
      delete f.emails;
      // Surface the Eventbrite ticket class as a time slot (useful for the
      // multi-slot We Rock the Spectrum event); Charlotte/Cary don't use it.
      if(g.key!=="charlotte" && g.key!=="cary") f.timeslot=f.timeslot||f.ticket||"";
      delete f.ticket;
      return {...f, confirmed:g.hasConfirm?isConf:null, count:f.attendees.length};
    });
    // Static Microsoft Form families (Charlotte & Cary only).
    const formFams = g.key==="charlotte"?CHARLOTTE_FORM_FAMILIES : g.key==="cary"?CARY_FORM_FAMILIES : [];
    const ebEmails=new Set(fams.map(f=>(f.email||"").toLowerCase()));
    for(const ff of formFams){
      if(isTest(ff.email)) continue;
      if(ebEmails.has((ff.email||"").toLowerCase())) continue; // avoid double-count
      fams.push({...ff, confirmed:g.hasConfirm?confirmed.has((ff.email||"").toLowerCase()):null, count:(ff.attendees||[]).length});
    }
    built.push({key:g.key,name:g.name,venue:g.venue,hasConfirm:g.hasConfirm,start:g.start||"",families:fams,_ids:[...g.ids],_raw:raw.length});
  }

  // Keep Charlotte & Cary always; other tabs appear only when they have registrations.
  const visible=built.filter(e=> e.key==="charlotte"||e.key==="cary"||e.families.length>0);
  if(!visible.length) throw new Error("No matching events found for this token.");

  // Order: Charlotte, Cary, We Rock the Spectrum, then any others by date.
  const rank=e=> e.key==="charlotte"?0 : e.key==="cary"?1 : e.key==="wrts"?2 : 3;
  visible.sort((a,b)=> rank(a)-rank(b) || String(a.start).localeCompare(String(b.start)) || a.name.localeCompare(b.name));

  const dbg={candidates, groups: visible.map(e=>({key:e.key,name:e.name,ids:e._ids,attendeesFetched:e._raw,families:e.families.length}))};
  for(const e of visible){ delete e._ids; delete e._raw; }

  const out={events:visible};
  return {out, dbg};
}

export default async function handler(req,res){
  const debug = req.query && req.query.debug;
  const token = process.env.EVENTBRITE_TOKEN;
  if(!token) return res.status(200).json(meta(null,false,"No EVENTBRITE_TOKEN set yet.",debug));
  try{
    const {out, dbg}=await getEvents(token);
    res.setHeader("Cache-Control","s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(meta(out,true,null,debug,dbg));
  }catch(err){
    return res.status(200).json(meta(null,false,String(err&&err.message||err),debug,{}));
  }
}
function meta(data,live,message,debug,extra){
  const base = data&&data.events ? data : {events:[]};
  const m={live,message:message||null};
  if(debug) m.debug=extra||{};
  return {...base,_meta:m};
}
