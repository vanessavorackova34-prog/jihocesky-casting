"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ProdukceDashboardPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const key =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) return;

      const supabase = createBrowserClient(url, key);

      const { data } = await supabase.auth.getUser();

      if (data.user?.email) {
        setEmail(data.user.email);
      }
    }

    loadUser();
  }, []);

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "60px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Produkce</h1>

      <p>
        Vítejte{email ? `, ${email}` : ""}.
      </p>

      <div
        style={{
          marginTop: "30px",
          padding: "30px",
          border: "1px solid #ddd",
          borderRadius: "16px",
        }}
      >
        <h2>Produkční panel</h2>
        <p>Zde bude panel pro produkci.</p>
      </div>
    </main>
  );
}
