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
const CONFIRMED_EMAILS = ["aissatou.naima29@gmail.com", "amandalopez0512@icloud.com", "asanthoshsagar@outlook.com", "bmsmall19@yahoo.com", "jasminebratton9023@gmail.com", "judygrodgers@gmail.com", "kionnadockery@yahoo.com", "kleenish26@yahoo.com", "ms.s.burns@gmail.com", "nturner1st@gmail.com", "shakethacrawford@yahoo.com", "slouther@gmail.com", "swathi.gujjari9@gmail.com", "tfedwards85@gmail.com", "thebestofthebest24@gmail.com", "tuliamolinagarcia@gmail.com"];
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
      timeslot:"", emails:new Set(), attendees:[]});
    const fam=orders.get(oid);
    fam.emails.add(email.toLowerCase());
    fam.attendees.push(attendeeToChild(at));
  }
  return [...orders.values()];
}
async function discoverEvents(token){
  // There can be several similarly-named events (a Charlotte "Magical Day" AND
  // a Cary "Magical Day", plus multiple "We Rock the Spectrum" time slots), so
  // collect ALL matching ids per event rather than just the first.
  const charlotteIds=[], caryIds=[], candidates=[];
  try{
    const me=await ebGet(`/users/me/organizations/`, token);
    for(const org of me.organizations||[]){
      let page=1, pages=1;
      do{
        // status:"all" so already-passed events are still returned.
        const d=await ebGet(`/organizations/${org.id}/events/`, token, {order_by:"created_desc",status:"all",page});
        for(const ev of d.events||[]){
          const name=((ev.name&&ev.name.text)||"");
          const n=name.toLowerCase();
          candidates.push({id:ev.id, name, status:ev.status});
          // Both events are "Magical Day of Fun" — split by city.
          // (The separate "We Rock the Spectrum" events are intentionally ignored.)
          if(n.includes("magical") && !n.includes("cary")) charlotteIds.push(ev.id);
          if(n.includes("magical") && n.includes("cary")) caryIds.push(ev.id);
        }
        pages=d.pagination?d.pagination.page_count:1;
      } while(page++<pages && page<=20);
    }
  }catch(e){}
  return {charlotteIds, caryIds, candidates};
}
// Fetch and merge attendees across a list of event ids.
async function attendeesForAll(idList, token){
  let raw=[];
  for(const id of idList) raw = raw.concat(await allAttendees(id, token));
  return raw;
}

// Build the full events payload (shared by the dashboard API and the reminder mailer).
export async function getEvents(token){
  const envList=v=>v?String(v).split(",").map(s=>s.trim()).filter(Boolean):null;
  const {charlotteIds, caryIds, candidates}=await discoverEvents(token);
  const charList=envList(process.env.EVENT_CHARLOTTE)||charlotteIds;
  const caryList=envList(process.env.EVENT_CARY)||caryIds;
  if(!charList.length && !caryList.length) throw new Error("No matching events found for this token.");
  const confirmed=new Set(CONFIRMED_EMAILS.map(e=>e.toLowerCase()));

  const charRaw=await attendeesForAll(charList,token);
  const charFams=buildFamilies(charRaw).map(f=>{
    const c=[...f.emails].some(e=>confirmed.has(e)); delete f.emails;
    return {...f, confirmed:c, count:f.attendees.length};
  });
  // Charlotte families who registered via the Microsoft Form (not Eventbrite).
  const charEbEmails=new Set(charFams.map(f=>(f.email||"").toLowerCase()));
  for(const ff of CHARLOTTE_FORM_FAMILIES){
    if(isTest(ff.email)) continue;
    if(charEbEmails.has((ff.email||"").toLowerCase())) continue; // avoid double-count
    charFams.push({...ff, confirmed:confirmed.has((ff.email||"").toLowerCase()), count:(ff.attendees||[]).length});
  }
  const caryRaw=await attendeesForAll(caryList,token);
  const caryFams=buildFamilies(caryRaw).map(f=>{
    delete f.emails; return {...f, confirmed:null, count:f.attendees.length};
  });
  for(const ff of CARY_FORM_FAMILIES){ if(isTest(ff.email)) continue; caryFams.push({...ff, confirmed:null, count:(ff.attendees||[]).length}); }

  const out={events:[
    {key:"charlotte",name:"Charlotte",venue:"Free Magical Day of Fun",hasConfirm:true,families:charFams},
    {key:"cary",name:"Cary",venue:"We Rock the Spectrum Kids Gym",hasConfirm:false,families:caryFams}
  ]};
  return {out, dbg:{
    charlotteIds:charList, caryIds:caryList,
    charlotteAttendeesFetched:charRaw.length, charlotteFamilies:charFams.length,
    caryAttendeesFetched:caryRaw.length, caryFamilies:caryFams.length,
    candidates
  }};
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
