"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  city: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  height_cm: number | null;
  experience: string | null;
  availability: string | null;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createBrowserClient(url, key);

  async function loadCandidates() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/prihlaseni");
      return;
    }

    const { data, error } = await supabase
      .from("candidates")
      .select("*");

    if (error) {
     setError("Chyba Supabase: " + error.message);
    } else {
      setCandidates(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase
      .from("candidates")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("Chyba Supabase: " + error.message);
      return;
    }

    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === id
          ? { ...candidate, status }
          : candidate
      )
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/prihlaseni");
  }

  return (
    <>
      <header className="top">
        <div className="logo">
          🎬 <span>JIHOČESKÝ CASTING</span>
        </div>

        <button className="btn" onClick={logout}>
          Odhlásit se
        </button>
      </header>

      <main className="section">
        <div style={{ maxWidth: 1100, margin: "auto" }}>
          <div className="eyebrow">ADMINISTRACE</div>

          <h1>Registrace</h1>

          <p className="muted">
            Přehled registrovaných herců, komparzistů a dalších
            uchazečů.
          </p>

          {loading && <p>Načítám registrace…</p>}

          {error && <div className="error">{error}</div>}

          {!loading && candidates.length === 0 && (
            <div className="card">
              Zatím zde nejsou žádné registrace.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: 16,
              marginTop: 20,
            }}
          >
            {candidates.map((candidate) => (
              <div className="card" key={candidate.id}>
                <h2 style={{ marginTop: 0 }}>
                  {candidate.first_name} {candidate.last_name}
                </h2>

                <p>
                  <strong>Věk:</strong> {candidate.age}
                </p>

                <p>
                  <strong>Role:</strong> {candidate.role}
                </p>

                {candidate.city && (
                  <p>
                    <strong>Město:</strong> {candidate.city}
                  </p>
                )}

                {candidate.height_cm && (
                  <p>
                    <strong>Výška:</strong>{" "}
                    {candidate.height_cm} cm
                  </p>
                )}

                {candidate.phone && (
                  <p>
                    <strong>Telefon:</strong>{" "}
                    {candidate.phone}
                  </p>
                )}

                {candidate.email && (
                  <p>
                    <strong>E-mail:</strong>{" "}
                    {candidate.email}
                  </p>
                )}

                {candidate.experience && (
                  <p>
                    <strong>Zkušenosti:</strong>{" "}
                    {candidate.experience}
                  </p>
                )}

                {candidate.availability && (
                  <p>
                    <strong>Poznámka:</strong>{" "}
                    {candidate.availability}
                  </p>
                )}

                <p>
                  <strong>Stav:</strong>{" "}
                  {candidate.status === "approved"
                    ? "✅ Schváleno"
                    : candidate.status === "rejected"
                    ? "❌ Zamítnuto"
                    : "⏳ Čeká na schválení"}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginTop: 15,
                  }}
                >
                  <button
                    className="btn primary"
                    onClick={() =>
                      changeStatus(
                        candidate.id,
                        "approved"
                      )
                    }
                  >
                    Schválit
                  </button>

                  <button
                    className="btn"
                    onClick={() =>
                      changeStatus(
                        candidate.id,
                        "rejected"
                      )
                    }
                  >
                    Zamítnout
                  </button>

                  <button
                    className="btn"
                    onClick={() =>
                      changeStatus(
                        candidate.id,
                        "pending"
                      )
                    }
                  >
                    Vrátit do čekajících
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
