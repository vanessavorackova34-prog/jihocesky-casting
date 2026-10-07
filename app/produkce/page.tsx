"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function ProdukcePrihlaseniPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const key =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setError("Web není připojený k databázi.");
        return;
      }

      const supabase = createBrowserClient(url, key);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setError("Nesprávný e-mail nebo heslo.");
        return;
      }

      router.push("/produkce/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Přihlášení se nepodařilo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="organizerLogin productionLogin"><div className="card organizerLoginCard">
        <div className="eyebrow">PRO PRODUKCE</div>

        <h1>Přihlášení</h1>

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <form onSubmit={login}>
          <div className="field"><label>E-mail</label><input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              /></div>

          <div className="field"><label>Heslo</label><input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              /></div>

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Přihlašuji..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </main>
  );
}
