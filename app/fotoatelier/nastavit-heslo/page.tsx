"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export default function PasswordSetup() {
  const client = useRef<SupabaseClient | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") ?? "");
    if (password !== fields.get("confirmation")) {
      setError("Zadaná hesla se neshodují.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (!client.current) {
        const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
        if (!token || !/^[a-f0-9]{64}$/.test(token)) {
          throw new Error("Otevřete jednorázový odkaz pro nastavení hesla.");
        }
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) throw new Error("Přihlášení je momentálně nedostupné.");

        const supabase = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });
        const { data, error: verificationError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: token,
        });
        if (verificationError || !data.session ||
            data.user?.app_metadata.lexapa_access !== "photoatelier_only") {
          throw new Error("Odkaz vypršel nebo už byl použit.");
        }
        client.current = supabase;
        window.history.replaceState(null, "", window.location.pathname);
      }

      const { error: updateError } = await client.current.auth.updateUser({ password });
      if (updateError) {
        throw new Error("Heslo se nepodařilo uložit. Zkuste delší heslo s písmeny a číslicemi.");
      }
      await client.current.auth.signOut({ scope: "local" });
      client.current = null;
      setDone(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Heslo se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 460, margin: "48px auto", padding: 24 }}>
      <h1>Nastavení hesla fotografa</h1>
      {done ? (
        <>
          <p>Heslo je nastavené.</p>
          <Link href="/fotoatelier/prihlaseni">Přihlásit se do fotoateliéru</Link>
        </>
      ) : (
        <form onSubmit={savePassword} style={{ display: "grid", gap: 12 }}>
          <label htmlFor="password">Nové heslo</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <label htmlFor="confirmation">Zopakujte heslo</label>
          <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required />
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={saving}>{saving ? "Ukládám…" : "Uložit heslo"}</button>
        </form>
      )}
    </main>
  );
}
