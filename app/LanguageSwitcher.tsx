"use client";
import { useEffect, useState } from "react";

const translations: Record<string,string> = {
  "Zpět":"Back","Přihlášení pořadatele":"Organizer login","Přihlášení":"Login","Přihlásit se":"Sign in","Heslo":"Password","PRO POŘADATELE":"FOR ORGANIZERS",
  "O castingu":"About casting","Jak to funguje":"How it works","Kontakt":"Contact","Pro produkce":"For productions","Registrovat profil":"Register profile",
  "Hledáme nové tváře":"We are looking for new faces","Herci a herečky":"Actors","Komparz a statisté":"Background actors and extras","Modelové a talenty":"Models and talent","Celá Česká republika":"Across the Czech Republic",
  "Přihlaš svůj profil":"Register your profile","REGISTRACE DO CASTINGU":"CASTING REGISTRATION","Jméno *":"First name *","Příjmení *":"Last name *","Věk *":"Age *","Pohlaví *":"Gender *","Země bydliště *":"Country of residence *","Kraj *":"Region *","Město *":"City *","Telefon":"Phone","E-mail":"Email",
  "Role / typ *":"Role / type *","Výška (cm)":"Height (cm)","Zkušenosti":"Experience","Dostupnost / poznámka":"Availability / notes","Jazyky":"Languages","Dovednosti":"Skills","Fotografie * (1-5)":"Photos * (1–5)","Odeslat registraci":"Submit registration",
  "Pořadatel":"Organizer","Projekty":"Projects","Čekající":"Pending","Schválené":"Approved","Zamítnuté":"Rejected","Filtry":"Filters","Všichni":"All","Všechny kraje":"All regions","Všechna města":"All cities","Všechny země":"All countries","Herci":"Actors","Ženy":"Women","Muži":"Men","Ostatní":"Other","Řidičák":"Driving licence","Vlastní auto":"Own car","Resetovat filtry":"Reset filters","Odhlásit se":"Log out","Vytvořit zálohu":"Download backup","Vybrat talent":"Select talent","Zobrazeno:":"Shown:","Vybráno:":"Selected:","Hromadná SMS":"Bulk SMS","Vytvořit projekt / shortlist":"Create project / shortlist","Zrušit výběr":"Clear selection","Načítám registrace...":"Loading registrations...","Žádné registrace v této kategorii.":"No registrations in this category.","Hledat...":"Search...",
  "Název projektu":"Project name","Datum natáčení":"Filming date","Místo natáčení":"Filming location","Poznámky":"Notes","Uložit":"Save","Smazat":"Delete","Upravit":"Edit","Schválit":"Approve","Zamítnout":"Reject","Ano":"Yes","Ne":"No","Vyberte":"Select","Muž / chlapec":"Male","Žena / dívka":"Female",
  "Moje registrace":"My registration","Uložit změny":"Save changes","Přidat fotografie":"Add photos","Kopírovat odkaz":"Copy link","Přihlášuji…":"Signing in…",
  "📦 Vytvořit zálohu":"📦 Download backup","🎬 Projekty":"🎬 Projects","⏳ Čekající":"⏳ Pending","✅ Schválené":"✅ Approved","❌ Zamítnuté":"❌ Rejected","🔎 Filtry":"🔎 Filters","📱 Hromadná SMS":"📱 Bulk SMS","🎬 Vytvořit projekt / shortlist":"🎬 Create project / shortlist"
};
const originals = new WeakMap<Text,string>();
const attributes = new WeakMap<Element,Map<string,string>>();
export default function LanguageSwitcher(){
 const [lang,setLang]=useState<"cs"|"en">("cs");
 useEffect(()=>{const stored=window.localStorage.getItem("lexapa-language");if(stored==="en")setLang("en");},[]);
 useEffect(()=>{
   document.documentElement.lang=lang;
   window.localStorage.setItem("lexapa-language",lang);
   let busy=false;
   const translate=()=>{
    if(busy)return;busy=true;
    try{
     const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
     let node:Node|null;
     while((node=walker.nextNode())){
      const textNode=node as Text;const parent=textNode.parentElement;
      if(!parent||parent.closest("[data-language-switcher],script,style,textarea,option[data-keep-original]"))continue;
      const raw=originals.get(textNode)??textNode.nodeValue??"";
      if(!originals.has(textNode))originals.set(textNode,raw);
      const trimmed=raw.trim();const translated=lang==="en"?(translations[trimmed]??trimmed):trimmed;
      const next=raw.replace(trimmed,translated);
      if(textNode.nodeValue!==next)textNode.nodeValue=next;
     }
     for(const element of Array.from(document.querySelectorAll("input[placeholder],textarea[placeholder],option"))){
      if(element.closest("[data-language-switcher]"))continue;
      const map=attributes.get(element)??new Map<string,string>();
      if(!attributes.has(element))attributes.set(element,map);
      if(element.hasAttribute("placeholder")){
       if(!map.has("placeholder"))map.set("placeholder",element.getAttribute("placeholder")??"");
       const raw=map.get("placeholder")??"";element.setAttribute("placeholder",lang==="en"?(translations[raw]??raw):raw);
      }
     }
    }finally{busy=false;}
   };
   translate();
   const observer=new MutationObserver(()=>translate());
   observer.observe(document.body,{childList:true,subtree:true,characterData:true});
   return ()=>observer.disconnect();
 },[lang]);
 return <div data-language-switcher style={{position:"fixed",bottom:"max(18px, env(safe-area-inset-bottom))",right:18,zIndex:99999,display:"flex",gap:4,padding:5,borderRadius:24,background:"#161616",border:"1px solid #b9954b",boxShadow:"0 3px 14px #0008"}}>
  <button type="button" onClick={()=>setLang("cs")} aria-label="Čeština" style={{padding:"7px 10px",border:0,borderRadius:6,background:lang==="cs"?"#d9b568":"transparent",color:lang==="cs"?"#111":"#fff",cursor:"pointer"}}>🇨🇿 CZ</button>
  <button type="button" onClick={()=>setLang("en")} aria-label="English" style={{padding:"7px 10px",border:0,borderRadius:6,background:lang==="en"?"#d9b568":"transparent",color:lang==="en"?"#111":"#fff",cursor:"pointer"}}>🇬🇧 EN</button>
 </div>;
}
