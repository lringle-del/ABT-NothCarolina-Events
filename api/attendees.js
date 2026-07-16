// Secure Eventbrite sync for the Above & Beyond ABA event dashboard.
// The private Eventbrite token lives ONLY in the Vercel Environment Variable
// EVENTBRITE_TOKEN and is never sent to the browser.

const BASE = "https://www.eventbriteapi.com/v3";
const TEST_EMAIL = "lringle@abtaba.com";

// Static data not held in Eventbrite: Charlotte confirmations + Cary form families.
const CONFIRMED_EMAILS = ["asanthoshsagar@outlook.com", "bmsmall19@yahoo.com", "nturner1st@gmail.com", "shakethacrawford@yahoo.com", "swathi.gujjari9@gmail.com", "tfedwards85@gmail.com", "thebestofthebest24@gmail.com", "tuliamolinagarcia@gmail.com"];
const CARY_FORM_FAMILIES = [{"source": "Microsoft Form", "order": "Form #6", "date": "2026-06-19", "purchaser": "Monica Orellana", "email": "Moniyi80@gmail.com", "phone": "6464201430", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Mateo", "age": "10", "dx": "Yes", "aba": "No", "looking": "No", "gain": "Information", "haircut": "Yes"}, {"child": "Joseph", "age": "2", "dx": "Yes", "aba": "No", "looking": "I am exploring options", "gain": "Information", "haircut": "Yes"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #7", "date": "2026-07-09", "purchaser": "Jolanda Dixon", "email": "jolandadixon26@gmail.com", "phone": "9843014726", "timeslot": "1:00 PM-2:00 PM", "attendees": [{"child": "Jaxyn Dixon", "age": "10", "dx": "Yes", "aba": "No", "looking": "No", "gain": "Mingling", "haircut": "No"}], "confirmed": null, "count": 1}, {"source": "Microsoft Form", "order": "Form #8", "date": "2026-07-11", "purchaser": "Aldabbagh", "email": "mustafasaad88@gmail.com", "phone": "9195239459", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Taim Aldabbagh", "age": "11", "dx": "No", "aba": "No", "looking": "No", "gain": "Learning", "haircut": "Yes"}, {"child": "Jad Aldabbagh", "age": "4", "dx": "No", "aba": "No", "looking": "No", "gain": "Learning", "haircut": "Yes"}], "confirmed": null, "count": 2}, {"source": "Microsoft Form", "order": "Form #9", "date": "2026-07-14", "purchaser": "Vidhyabharathi Janarthanan", "email": "j.vidhyabharathi@gmail.com", "phone": "9379792092", "timeslot": "11:00 AM-12:00 PM", "attendees": [{"child": "Rudran", "age": "8", "dx": "Yes", "aba": "No", "looking": "No", "gain": "Just explore if anything would be suitable for the child", "haircut": "No"}], "confirmed": null, "count": 1}, {"source": "Microsoft Form", "order": "Form #10", "date": "2026-07-15", "purchaser": "Migdalis Clemmons", "email": "dmclemmons@hotmail.com", "phone": "9196568872", "timeslot": "1:00 PM-2:00 PM", "attendees": [{"child": "Ruby", "age": "6", "dx": "Yes", "aba": "No", "looking": "I am exploring options", "gain": "Different options", "haircut": "Yes"}], "confirmed": null, "count": 1}];

function h(t){ return { Authorization: `Bearer ${t}` }; }
async function ebGet(path, token, params={}){
  const url = new URL(BASE + path);
  for (const [k,v] of Object.entries(params)) if (v!=null) url.searchParams.set(k,v);
  const r = await fetch(url,{headers:h(token)});
  if(!r.ok) throw new Error(`Eventbrite ${path} -> ${r.status}`);
  return r.json();
}
async function allAttendees(eventId, token){
  let out=[], cont=null, guard=0;
  do{
    const d = await ebGet(`/events/${eventId}/attendees/`, token, cont?{continuation:cont}:{});
    out = out.concat(d.attendees||[]);
    cont = d.pagination && d.pagination.has_more_items ? d.pagination.continuation : null;
  } while(cont && ++guard<50);
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
    if(email.toLowerCase()===TEST_EMAIL) continue;
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
  const map={};
  try{
    const me=await ebGet(`/users/me/organizations/`, token);
    for(const org of me.organizations||[]){
      let page=1, pages=1;
      do{
        const d=await ebGet(`/organizations/${org.id}/events/`, token, {order_by:"created_desc",page});
        for(const ev of d.events||[]){
          const n=((ev.name&&ev.name.text)||"").toLowerCase();
          if(n.includes("magical")) map.charlotte=map.charlotte||ev.id;
          if(n.includes("spectrum")||n.includes("cary")||n.includes("we rock")) map.cary=map.cary||ev.id;
        }
        pages=d.pagination?d.pagination.page_count:1;
      } while(page++<pages && page<=20);
    }
  }catch(e){}
  return map;
}

export default async function handler(req,res){
  const debug = req.query && req.query.debug;
  const token = process.env.EVENTBRITE_TOKEN;
  if(!token) return res.status(200).json(meta(null,false,"No EVENTBRITE_TOKEN set yet.",debug));
  try{
    const ids=await discoverEvents(token);
    const charlotteId=process.env.EVENT_CHARLOTTE||ids.charlotte;
    const caryId=process.env.EVENT_CARY||ids.cary;
    if(!charlotteId && !caryId) throw new Error("No matching events found for this token.");
    const confirmed=new Set(CONFIRMED_EMAILS.map(e=>e.toLowerCase()));

    let charFams=[];
    if(charlotteId) charFams=buildFamilies(await allAttendees(charlotteId,token)).map(f=>{
      const c=[...f.emails].some(e=>confirmed.has(e)); delete f.emails;
      return {...f, confirmed:c, count:f.attendees.length};
    });
    let caryFams=[];
    if(caryId) caryFams=buildFamilies(await allAttendees(caryId,token)).map(f=>{
      delete f.emails; return {...f, confirmed:null, count:f.attendees.length};
    });
    for(const ff of CARY_FORM_FAMILIES) caryFams.push({...ff, confirmed:null, count:(ff.attendees||[]).length});

    const out={events:[
      {key:"charlotte",name:"Charlotte",venue:"Free Magical Day of Fun",hasConfirm:true,families:charFams},
      {key:"cary",name:"Cary",venue:"We Rock the Spectrum Kids Gym",hasConfirm:false,families:caryFams}
    ]};
    res.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(meta(out,true,null,debug,{charlotteId,caryId}));
  }catch(err){
    return res.status(200).json(meta(null,false,String(err&&err.message||err),debug));
  }
}
function meta(data,live,message,debug,extra){
  const base = data&&data.events ? data : {events:[]};
  const m={live,message:message||null};
  if(debug) m.debug=extra||{};
  return {...base,_meta:m};
}
