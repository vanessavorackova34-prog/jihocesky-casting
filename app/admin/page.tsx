In place"use client";

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
  status: string | null;
  photos?: string[];
};

export default function AdminPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [selectedCandidate, setSelectedCandidate] =
  useState<Candidate | null>(null);

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
      setLoading(false);
      return;
    }

    const withPhotos = await Promise.all(
      (data || []).map(async (candidate) => {
        const { data: files } = await supabase.storage
          .from("fotky-hercu")
          .list(candidate.id);

        const photos =
          files?.map((file) => {
            const { data } = supabase.storage
              .from("fotky-hercu")
              .getPublicUrl(`${candidate.id}/${file.name}`);

            return data.publicUrl;
          }) || [];

        return {
          ...candidate,
          photos,
        };
      })
    );

    setCandidates(withPhotos);
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
      alert("Stav se nepodařilo změnit: " + error.message);
      return;
    }

    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === id ? { ...candidate, status } : candidate
      )
    );
  }
async function deleteCandidate(id: string, name: string) {
  const confirmed = window.confirm(
    `Opravdu chceš smazat registraci ${name}? Registrace i všechny fotografie budou trvale odstraněny.`
  );

  if (!confirmed) return;

  const { data: files, error: listError } = await supabase.storage
    .from("fotky-hercu")
    .list(id);

  if (listError) {
    alert("Nepodařilo se načíst fotografie: " + listError.message);
    return;
  }

  if (files && files.length > 0) {
    const paths = files.map((file) => `${id}/${file.name}`);

    const { error: photoError } = await supabase.storage
      .from("fotky-hercu")
      .remove(paths);

    if (photoError) {
      alert("Fotografie se nepodařilo smazat: " + photoError.message);
      return;
    }
  }

  const { error: deleteError } = await supabase
    .from("candidates")
    .delete()
    .eq("id", id);

  if (deleteError) {
    alert("Registraci se nepodařilo smazat: " + deleteError.message);
    return;
  }

  setCandidates((current) =>
    current.filter((candidate) => candidate.id !== id)
  );

  alert(`Registrace ${name} byla smazána včetně fotografií.`);
}
  async function logout() {
    await supabase.auth.signOut();
    router.push("/prihlaseni");
  }

  function statusText(status: string | null) {
    if (status === "approved") return "✅ Schváleno";
    if (status === "rejected") return "❌ Zamítnuto";
    return "⏳ Čeká na schválení";
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
        <div className="eyebrow">ADMINISTRACE</div>
        <h1>Registrace</h1>

        <p className="muted">
          Přehled registrovaných herců, komparzistů a dalších talentů.
        </p><div
  style={{
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 20,
  }}
>
  <button
    className="btn"
    onClick={() => setFilter("pending")}
  >
    ⏳ Čekající
  </button>

  <button
    className="btn"
    onClick={() => setFilter("approved")}
  >
    ✅ Schválení
  </button>

  <button
    className="btn"
    onClick={() => setFilter("rejected")}
  >
    ❌ Zamítnutí
  </button>
</div>

        {loading && <p>Načítám registrace…</p>}

        {error && <div className="error">{error}</div>}

        {!loading &&
          candidates
  .filter((candidate) => (candidate.status || "pending") === filter)
  .map((candidate) => (
            <div
              className="card"
              key={candidate.id}
              style={{ marginBottom: 25 }}
            >
              <h2>
                {candidate.first_name} {candidate.last_name}
              </h2>

              {candidate.photos && candidate.photos.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    overflowX: "auto",
                    marginBottom: 20,
                  }}
                >
                  {candidate.photos.map((photo, index) => (
                    <img
                      key={photo}
                      src={photo}
                      alt={`Fotografie ${index + 1}`}
                      style={{
                        width: 150,
                        height: 190,
                        objectFit: "cover",
                        borderRadius: 12,
                        flexShrink: 0,
                      }}
                    />
                  ))}
                </div>
              )}

              <p>
                <b>Věk:</b> {candidate.age}
              </p>

              <p>
                <b>Role:</b> {candidate.role || "—"}
              </p>

              <p>
                <b>Město:</b> {candidate.city || "—"}
              </p>

              <p>
                <b>Výška:</b>{" "}
                {candidate.height_cm
                  ? `${candidate.height_cm} cm`
                  : "—"}
              </p>

              <p>
                <b>Telefon:</b> {candidate.phone || "—"}
              </p>

              <p>
                <b>E-mail:</b> {candidate.email || "—"}
              </p>

              <p>
                <b>Zkušenosti:</b> {candidate.experience || "—"}
              </p>

              <p>
                <b>Dostupnost / poznámka:</b>{" "}
                {candidate.availability || "—"}
              </p>

              <p>
                <b>Stav:</b> {statusText(candidate.status)}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 20,
                }}
              >
                <button
                  className="btn primary"
                  onClick={() =>
                    changeStatus(candidate.id, "approved")
                  }
                >
                  Schválit
                </button>

                <button
                  className="btn"
                  onClick={() =>
                    changeStatus(candidate.id, "rejected")
                  }
                >
                  Zamítnout
                </button>

                <button
  className="btn"
  onClick={() => changeStatus(candidate.id, "pending")}
>
  Vrátit do čekajících
</button>

<button
  className="btn"
  onClick={() =>
    deleteCandidate(
      candidate.id,
      `${candidate.first_name} ${candidate.last_name}`
    )
  }
>
  🗑️ Smazat
  </button>

<button
  className="btn"
  onClick={() => setSelectedCandidate(candidate)}
>
  👤 Zobrazit detail
</button>
</div>
</div>
))}

        {!loading && candidates.length === 0 && !error && (
          <div className="card">
            <p>Zatím zde nejsou žádné registrace.</p>
          </div>
        )}
        {selectedCandidate && (
  <div className="card">
    <h2>
      👤 {selectedCandidate.first_name} {selectedCandidate.last_name}
    </h2>

    <p><strong>Věk:</strong> {selectedCandidate.age}</p>
    <p><strong>Město:</strong> {selectedCandidate.city || "Neuvedeno"}</p>
    <p><strong>Telefon:</strong> {selectedCandidate.phone || "Neuvedeno"}</p>
    <p><strong>E-mail:</strong> {selectedCandidate.email || "Neuvedeno"}</p>
    <p><strong>Role:</strong> {selectedCandidate.role}</p>
    <p><strong>Výška:</strong> {selectedCandidate.height_cm ? `${selectedCandidate.height_cm} cm` : "Neuvedeno"}</p>
    <p><strong>Zkušenosti:</strong> {selectedCandidate.experience || "Neuvedeno"}</p>
    <p><strong>Dostupnost:</strong> {selectedCandidate.availability || "Neuvedeno"}</p>
    <p><strong>Stav:</strong> {statusText(selectedCandidate.status)}</p>

    <h3>Fotografie</h3>

    {selectedCandidate.photos &&
    selectedCandidate.photos.length > 0 ? (
      <div>
        {selectedCandidate.photos.map((photo, index) => (
          <img
            key={photo}
            src={photo}
            alt={`Fotografie ${index + 1}`}
            style={{
              width: "180px",
              maxWidth: "100%",
              margin: "5px",
              borderRadius: "10px",
            }}
          />
        ))}
      </div>
    ) : (
      <p>Žádné fotografie.</p>
    )}

    <br />

    <button
      className="btn"
      onClick={() => setSelectedCandidate(null)}
    >
      ← Zavřít detail
    </button>
  </div>
)}
      </main>
    </>
  );
}
