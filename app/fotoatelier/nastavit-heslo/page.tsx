"use client";

import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent } from "react";

function authClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!, {
      auth: { flowType: "implicit", storage: window.sessionStorage, storageKey: "studio-password-setup", detectSessionInUrl: false },
    });
}

export default function PasswordSetup() {
  const [client, setClient] = useState<ReturnType<typeof authClient> | null>(null);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const db = authClient();
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const access = fragment.get("access_token");
    const refresh = fragment.get("refresh_token");
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    async function init() {
      if (access && refresh && fragment.get("type") === "recovery") {
        const session = await db.auth.setSession({ access_token: access, refresh_token: refresh });
        if (!session.error) {
          const allowed = await db.rpc("photoatelier_is_organizer");
          if (allowed.data === true) setVerified(true);
          else setMessage("Tento účet nemá přístup fotografa.");
        } else setMessage("Platnost odkazu vypršela. Vyžádejte si nový.");
      } else if (fragment.has("error")) setMessage("Platnost odkazu vypršela. Vyžádejte si nový.");
      setClient(db);
    }
    void init().catch(() => setMessage("Připojení se nezdařilo. Obnovte stránku."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      if (verified) {
        const password = String(data.get("password"));
        if (password !== data.get("repeat")) { setMessage("Zadaná hesla se liší."); return; }
        const result = await client.auth.updateUser({ password });
        if (result.error) { setMessage("Heslo se nepodařilo uložit. Zkuste jiné heslo nebo nový odkaz."); return; }
        setDone(true);
        setMessage("Heslo je uložené. Můžete se přihlásit.");
        await client.auth.signOut({ scope: "local" });
      } else {
        const result = await client.auth.resetPasswordForEmail(String(data.get("email")).trim(), {
          redirectTo: window.location.origin + "/fotoatelier/nastavit-heslo",
        });
        setMessage(result.error ? "Ověřovací e-mail se nepodařilo odeslat. Zkuste to později." :
          "Pokud e-mail patří k účtu, otevřete ve schránce odkaz pro nastavení hesla. Zkontrolujte také spam.");
      }
    } catch { setMessage("Připojení se nezdařilo. Zkuste to znovu."); }
    finally { setBusy(false); }
  }

  return <main className="organizerLogin"><section className="card" style={{maxWidth:500, margin:"auto"}}>
    <div className="eyebrow">LEXAPA FOTOATELIÉR</div><h1>Nastavení hesla fotografa</h1>
    {!done && <form onSubmit={submit}>
      {verified ? <>
        <label className="field">Nové heslo<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <label className="field">Zopakujte heslo<input name="repeat" type="password" autoComplete="new-password" minLength={8} required /></label>
      </> : <label className="field">E-mail fotografa<input type="email" name="email" autoComplete="email" required /></label>}
      <button className="btn primary" disabled={!client || busy}>{verified ? "Uložit heslo" : "Poslat odkaz na e-mail"}</button>
    </form>}
    {message && <p role="status">{message}</p>}
    <p><Link href="/fotoatelier/prihlaseni">Přihlásit se jako fotograf</Link></p>
  </section></main>;
}
