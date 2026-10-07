"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Project={id:string;name:string;filming_date:string|null;location:string|null;notes:string|null;status:string;created_at:string};
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
    <h2>{active.name}</h2><p>Shortlist: <strong>{people.length}</strong></p>
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
