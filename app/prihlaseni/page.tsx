"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

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
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Supabase neodpovídá. Zkontroluj nastavení Supabase a Vercelu."
            )
          );
        }, 10000);
      });

      const result = await Promise.race([
        loginPromise,
        timeoutPromise,
      ]);

      if ("error" in result && result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      if ("data" in result && result.data.user) {
        router.push("/produkce");
        return;
      }

      setError("Přihlášení se nepodařilo.");
      setLoading(false);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Nastala chyba při přihlášení."
      );

      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "60px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "16px",
          padding: "30px",
        }}
      >
        <p>PRO PRODUKCE</p>

        <h1>Přihlášení</h1>

        <form
          onSubmit={login}
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label>
            Heslo
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                boxSizing: "border-box",
              }}
            />
          </label>

          {error && (
            <p style={{ color: "red" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px",
              cursor: "pointer",
            }}
          >
            {loading ? "Přihlašuji..." : "Přihlásit se"}
          </button>
        </form>
      </div>
    </main>
  );
}
