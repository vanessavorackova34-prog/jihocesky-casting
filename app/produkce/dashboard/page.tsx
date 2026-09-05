"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Candidate = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  height_centimetres: number | null;
  experience: string | null;
  availability: string | null;
  status: string | null;
  gender: string | null;
};

export default function ProdukceDashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCandidates() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setError("Web není připojený k databázi.");
        setLoading(false);
        return;
      }

      const supabase = createBrowserClient(url, key);

      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        setError("Nepodařilo se načíst kandidáty.");
        setLoading(false);
        return;
      }

      setCandidates(data || []);
      setLoading(false);
    }

    loadCandidates();
  }, []);

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Produkční panel</h1>

      <p>
        Přihlášení kandidáti: <strong>{candidates.length}</strong>
      </p>

      {loading && <p>Načítám kandidáty…</p>}

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && candidates.length === 0 && (
        <p>Zatím nejsou žádní přihlášení kandidáti.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "16px",
              padding: "20px",
              background: "#fff",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {candidate.first_name || ""} {candidate.last_name || ""}
            </h2>

            <p>
              <strong>Věk:</strong> {candidate.age ?? "—"}
            </p>

            <p>
              <strong>Pohlaví:</strong> {candidate.gender || "—"}
            </p>

            <p>
              <strong>Město:</strong> {candidate.city || "—"}
            </p>

            <p>
              <strong>Telefon:</strong> {candidate.phone || "—"}
            </p>

            <p>
              <strong>E-mail:</strong> {candidate.email || "—"}
            </p>

            <p>
              <strong>Role:</strong> {candidate.role || "—"}
            </p>

            <p>
              <strong>Výška:</strong>{" "}
              {candidate.height_centimetres
                ? `${candidate.height_centimetres} cm`
                : "—"}
            </p>

            <p>
              <strong>Zkušenosti:</strong>{" "}
              {candidate.experience || "—"}
            </p>

            <p>
              <strong>Dostupnost:</strong>{" "}
              {candidate.availability || "—"}
            </p>

            <p>
              <strong>Status:</strong> {candidate.status || "—"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
