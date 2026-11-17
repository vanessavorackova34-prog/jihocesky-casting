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
Object.assign(translations, {
  "DATABÁZE TALENTŮ":"TALENT DATABASE",
  "✓ Zobrazují se zájemci · Zpět na všechny":"✓ Showing interested candidates · Back to all",
  "ZOBRAZIT ZÁJEMCE O PŘEFOCENÍ":"SHOW PHOTO SESSION REQUESTS",
  "Výška od (cm)":"Min height (cm)",
  "Výška do (cm)":"Max height (cm)",
  "Nejdříve vyber kraj":"Select a region first",
  "Vybrat všechny zobrazené":"Select all visible",
  "Pohlaví":"Gender",
  "Výška":"Height",
  "Zájem o profesionální přefocení za 600 Kč":"Interested in professional photos for CZK 600",
  "Řidičský průkaz":"Driving licence",
  "Konfekční velikost":"Clothing size",
  "Historie projektů":"Project history",
  "Zatím bez projektu.":"No projects yet.",
  "Interní údaje LEXAPA CASTING":"LEXAPA CASTING internal details",
  "⭐ Oblíbený":"⭐ Favorite",
  "☆ Přidat do oblíbených":"☆ Add to favorites",
  "✅ Ověřený talent":"✅ Verified talent",
  "Označit jako ověřený":"Mark as verified",
  "Stav fotografií":"Photo status",
  "Profesionální":"Professional",
  "Běžné":"Standard",
  "Potřebuje nové fotografie":"Needs new photos",
  "Interní poznámka – kandidát ani produkce ji neuvidí":"Internal note – hidden from candidate and production",
  "LEXAPA CASTING – interní správa natáčení":"LEXAPA CASTING – production management",
  "← Zpět na kandidáty":"← Back to candidates",
  "Načítám…":"Loading…",
  "Zatím nejsou vytvořené žádné projekty. Projekt vytvoříš výběrem lidí v Pořadateli.":"No projects yet. Create a project by selecting candidates in the admin area.",
  "Honorář":"Fee",
  "např. 2 000 Kč / den":"e.g. CZK 2,000 / day",
  "Poznámky k roli":"Role notes",
  "Role, kostým, požadavky…":"Role, costume, requirements…",
  "Interní poznámky projektu":"Internal project notes",
  "Interní organizační poznámky…":"Internal production notes…",
  "💾 Uložit údaje projektu":"💾 Save project details",
  "• Vybraní:":"• Selected:",
  "• Potvrzení:":"• Confirmed:",
  "celý projekt":"entire project",
  "📱 SMS všem":"📱 SMS everyone",
  "vybraní":"selected",
  "📱 SMS vybraným":"📱 SMS selected",
  "čekající na potvrzení":"awaiting confirmation",
  "📱 SMS čekajícím":"📱 SMS pending",
  "Vybraný":"Selected",
  "Náhradník":"Standby",
  "Nevybraný":"Not selected",
  "Čeká na potvrzení":"Awaiting confirmation",
  "Nemůže":"Unavailable",
  "Jméno":"First name",
  "Příjmení":"Last name",
  "Věk":"Age",
  "Město":"City",
  "Kraj":"Region",
  "Země":"Country",
  "Obvod hrudníku (cm)":"Chest (cm)",
  "Obvod boků (cm)":"Hips (cm)",
  "Obvod pasu (cm)":"Waist (cm)",
  "Vnitřní délka nohy (cm)":"Inseam (cm)",
  "Velikost bot (EU)":"Shoe size (EU)",
  "Velikost kalhot":"Trouser size",
  "Obvod hlavy (cm)":"Head circumference (cm)",
  "Herec / herečka":"Actor",
  "Komparz":"Background actor",
  "Statista":"Extra",
  "Model / modelka":"Model",
  "Kaskadér":"Stunt performer",
  "Filmový štáb":"Film crew",
  "Jiné":"Other",
  "Ukládám...":"Saving...",
  "Nahrávám...":"Uploading...",
  "Nahrát nové fotografie":"Upload new photos",
  "✓ Odkaz zkopírován":"✓ Link copied",
  "📋 Kopírovat odkaz":"📋 Copy link",
  "Nahraj prosím alespoň jednu a maximálně pět fotografií.":"Please upload between one and five photos.",
  "Vyber prosím kraj.":"Please select a region.",
  "Vyber prosím město.":"Please select a city.",
  "Vyberte město":"Select city",
  "Nejdříve vyberte kraj":"Select region first",
  "Zadejte město bydliště":"Enter city of residence",
  "Máte zájem o profesionální přefocení do databáze LEXAPA CASTING za 600 Kč?":"Would you like a professional photo session for CZK 600?",
  "Vyberte možnost":"Select an option",
  "Odesílám registraci a fotografie...":"Submitting registration and photos...",
  "např. M / 38":"e.g. M / 38",
  "např. 32 / 40":"e.g. 32 / 40",
  "např. angličtina, němčina, italština":"e.g. English, German, Italian",
  "Např. jízda na koni, tanec, zpěv, plavání, bojové sporty, hudební nástroje...":"e.g. horse riding, dance, singing, swimming, martial arts, musical instruments...",
  "Herectví, divadlo, film, reklama, modeling...":"Acting, theater, film, commercials, modeling...",
  "Česká republika":"Czech Republic",
  "Slovensko":"Slovakia",
  "Rakousko":"Austria",
  "Německo":"Germany",
  "Polsko":"Poland",
  "Francie":"France",
  "Itálie":"Italy",
  "Španělsko":"Spain",
  "Velká Británie":"United Kingdom",
  "Švýcarsko":"Switzerland",
  "Nizozemsko":"Netherlands",
  "Belgie":"Belgium",
  "Maďarsko":"Hungary",
  "Rumunsko":"Romania",
  "Chorvatsko":"Croatia",
  "Řecko":"Greece",
  "Švédsko":"Sweden",
  "Norsko":"Norway",
  "Dánsko":"Denmark",
  "Finsko":"Finland",
  "Irsko":"Ireland",
  "Portugalsko":"Portugal",
  "Ukrajina":"Ukraine",
  "Web není připojený k databázi.":"The website is not connected to the database.",
  "Přihlášení proběhlo, ale nevznikla session.":"Login succeeded but no session was created.",
  "Přihlášení se nepodařilo.":"Login failed.",
  "Chybí odkaz k registraci.":"Registration link is missing.",
  "Registraci se nepodařilo načíst.":"Unable to load registration.",
  "Změny byly úspěšně uloženy.":"Changes saved successfully.",
  "Změny se nepodařilo uložit.":"Unable to save changes.",
  "Nové fotografie byly přidány.":"New photos added.",
  "Fotografie byly aktualizovány.":"Photos updated.",
  "Odkaz se nepodařilo zkopírovat. Podrž ho a zkopíruj ručně.":"Could not copy the link. Press and hold to copy manually.",
  "Odkaz se nepodařilo zkopírovat. Podrž odkaz a zkopíruj ho ručně.":"Could not copy the link. Press and hold to copy manually.",
});
Object.assign(translations, {
  "CASTING • FILM • TV • REKLAMA":"CASTING • FILM • TV • ADVERTISING",
  "Castingová databáze herců, komparzu, talentů a filmového štábu z celé České republiky.":"Casting database for actors, background performers, talent and film crew from across the Czech Republic and Europe.",
  "Zaregistruj se do databáze a můžeš být osloven/a pro film, seriál, reklamu, klip nebo focení.":"Join our casting database and get considered for films, TV series, commercials, music videos and photo shoots.",
  "Jak to funguje?":"How does it work?",
  "1. Vyplníš registrační formulář. 2. Nahraješ fotografie. 3. Profil čeká na schválení. 4. Pořadatelé ho mohou zařadit do vhodného projektu.":"1. Complete the registration form. 2. Upload your photos. 3. Your profile is reviewed. 4. Our casting team may select you for a suitable project.",
  "© 2026 LEXAPA Casting":"© 2026 LEXAPA CASTING",
});
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
      const trimmed=raw.trim();const normalized=trimmed.replace(/\s+/g," ");const translated=lang==="en"?(translations[normalized]??translations[trimmed]??trimmed):trimmed;
      const next=translated===trimmed?raw:raw.replace(trimmed,translated);
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
