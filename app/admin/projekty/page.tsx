"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Project={id:string;name:string;filming_date:string|null;location:string|null;notes:string|null;meeting_time:string|null;fee:string|null;role_notes:string|null;status:string;created_at:string};
type Assignment={project_id:string;candidate_id:string;casting_status:string;attendance_status:string;note:string|null;candidates?:{first_name:string;last_name:string;phone:string|null;email:string|null}|null};

export default function ProjectsPage(){
 const router=useRouter();
 const [projects,setProjects]=useState<Project[]>([]);
 const [active,setActive]=useState<Project|null>(null);
 const [people,setPeople]=useState<Assignment[]>([]);
 const [loading,setLoading]=useState(true);
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const supabase=url&&key?createBrowserClient(url,key):null;

 useEffect(()=>{loadProjects()},[]);
 async function loadProjects(){
  if(!supabase)return;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.push("/prihlaseni");return}
  const {data}=await supabase.from("casting_projects").select("*").order("created_at",{ascending:false});
  setProjects(data||[]);setLoading(false);
 }
 async function openProject(p:Project){
  if(!supabase)return;setActive(p);
  const {data}=await supabase.from("project_candidates").select("*, candidates(first_name,last_name,phone,email)").eq("project_id",p.id);
  setPeople((data as Assignment[])||[]);
 }
 function smsPeople(list: Assignment[], label: string){
  const phones=list.map(a=>a.candidates?.phone?.replace(/[^+\d]/g,"")).filter(Boolean) as string[];
  if(!phones.length){alert("V této skupině není žádné telefonní číslo.");return}
  const message=window.prompt(`Text SMS – ${label} (${phones.length} lidí):`, active ? `Dobrý den, informace k natáčení „${active.name}“. LEXAPA CASTING` : "LEXAPA CASTING");
  if(!message?.trim())return;
  window.location.href=`sms:${phones.join(",")}?&body=${encodeURIComponent(message.trim())}`;
 }
 async function saveProjectDetails(){
  if(!supabase||!active)return;
  const {error}=await supabase.from("casting_projects").update({filming_date:active.filming_date||null,location:active.location||null,meeting_time:active.meeting_time||null,fee:active.fee||null,role_notes:active.role_notes||null,notes:active.notes||null}).eq("id",active.id);
  if(error){alert("Údaje se nepodařilo uložit: "+error.message);return}
  setProjects(cur=>cur.map(p=>p.id===active.id?active:p));
  alert("Údaje projektu byly uloženy.");
 }
 async function setStatus(a:Assignment,field:"casting_status"|"attendance_status",value:string){
  if(!supabase)return;
  await supabase.from("project_candidates").update({[field]:value}).eq("project_id",a.project_id).eq("candidate_id",a.candidate_id);
  setPeople(cur=>cur.map(x=>x.candidate_id===a.candidate_id?{...x,[field]:value}:x));
 }
 return <main style={{minHeight:"100vh",background:"#000",color:"#fff",padding:24,fontFamily:"Arial"}}>
  <div style={{maxWidth:1200,margin:"0 auto"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
    <div><h1>🎬 Projekty a shortlisty</h1><p style={{color:"#aaa"}}>LEXAPA CASTING – interní správa natáčení</p></div>
    <button onClick={()=>router.push("/admin")} style={btn}>← Zpět na kandidáty</button>
   </div>
   {loading?<p>Načítám…</p>:projects.length===0?<p>Zatím nejsou vytvořené žádné projekty. Projekt vytvoříš výběrem lidí v Pořadateli.</p>:
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
    {projects.map(p=><button key={p.id} onClick={()=>openProject(p)} style={{...card,textAlign:"left",cursor:"pointer"}}><strong>{p.name}</strong><div style={{color:"#aaa",marginTop:8}}>{p.filming_date||"Datum neuvedeno"} {p.location?(" • "+p.location):""}</div></button>)}
   </div>}
   {active&&<section style={{...card,marginTop:24}}>
    <h2>{active.name}</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginBottom:14}}>
      <label>Datum natáčení<input type="date" value={active.filming_date||""} onChange={e=>setActive({...active,filming_date:e.target.value||null})} style={{...input,width:"100%",boxSizing:"border-box",marginTop:5}} /></label>
      <label>Lokace<input value={active.location||""} onChange={e=>setActive({...active,location:e.target.value})} placeholder="Místo natáčení" style={{...input,width:"100%",boxSizing:"border-box",marginTop:5}} /></label>
      <label>Čas srazu<input type="time" value={active.meeting_time?.slice(0,5)||""} onChange={e=>setActive({...active,meeting_time:e.target.value||null})} style={{...input,width:"100%",boxSizing:"border-box",marginTop:5}} /></label>
      <label>Honorář<input value={active.fee||""} onChange={e=>setActive({...active,fee:e.target.value})} placeholder="např. 2 000 Kč / den" style={{...input,width:"100%",boxSizing:"border-box",marginTop:5}} /></label>
    </div>
    <label style={{display:"block",marginBottom:10}}>Poznámky k roli<textarea value={active.role_notes||""} onChange={e=>setActive({...active,role_notes:e.target.value})} placeholder="Role, kostým, požadavky…" style={{...input,width:"100%",boxSizing:"border-box",minHeight:70,display:"block",marginTop:5}} /></label>
    <label style={{display:"block",marginBottom:10}}>Interní poznámky projektu<textarea value={active.notes||""} onChange={e=>setActive({...active,notes:e.target.value})} placeholder="Interní organizační poznámky…" style={{...input,width:"100%",boxSizing:"border-box",minHeight:70,display:"block",marginTop:5}} /></label>
    <button style={btn} onClick={saveProjectDetails}>💾 Uložit údaje projektu</button>
    <p>Shortlist: <strong>{people.length}</strong> • Vybraní: <strong>{people.filter(x=>x.casting_status==="selected").length}</strong> • Potvrzení: <strong>{people.filter(x=>x.attendance_status==="confirmed").length}</strong></p>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
      <button style={btn} onClick={()=>smsPeople(people,"celý projekt")}>📱 SMS všem</button>
      <button style={btn} onClick={()=>smsPeople(people.filter(x=>x.casting_status==="selected"),"vybraní")}>📱 SMS vybraným</button>
      <button style={btn} onClick={()=>smsPeople(people.filter(x=>x.attendance_status==="pending"),"čekající na potvrzení")}>📱 SMS čekajícím</button>
    </div>
    <div style={{display:"grid",gap:10}}>
     {people.map(a=><div key={a.candidate_id} style={{background:"#181818",padding:14,borderRadius:10,display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
      <div><strong>{a.candidates?.first_name} {a.candidates?.last_name}</strong><div style={{color:"#aaa",fontSize:13}}>{a.candidates?.phone||""} {a.candidates?.email||""}</div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
       <select value={a.casting_status} onChange={e=>setStatus(a,"casting_status",e.target.value)} style={input}><option value="shortlist">Shortlist</option><option value="selected">Vybraný</option><option value="backup">Náhradník</option><option value="rejected">Nevybraný</option></select>
       <select value={a.attendance_status} onChange={e=>setStatus(a,"attendance_status",e.target.value)} style={input}><option value="pending">Čeká na potvrzení</option><option value="confirmed">Potvrzeno</option><option value="declined">Nemůže</option></select>
      </div>
     </div>)}
    </div>
   </section>}
  </div>
 </main>
}
const btn={background:"#fff",color:"#000",border:0,borderRadius:8,padding:"11px 16px",fontWeight:700,cursor:"pointer"} as const;
const card={background:"#111",color:"#fff",border:"1px solid #2a2a2a",borderRadius:12,padding:18} as const;
const input={background:"#222",color:"#fff",border:"1px solid #444",borderRadius:7,padding:"9px 10px"} as const;
