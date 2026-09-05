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
  status: string | null;
  gender: string | null;
  photos?: string[];
};

export default function AdminPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] =
    useState<"pending" | "approved" | "rejected">("pending");

  const [roleFilter, setRoleFilter] = useState("Všichni");
  const [genderFilter, setGenderFilter] = useState("Všichni");
  const [ageFilter, setAgeFilter] = useState("Všichni");
  const [cityFilter, setCityFilter] = useState("Všechna města");
  const [search, setSearch] = useState("");

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
      alert(
        "Nepodařilo se načíst fotografie: " + listError.message
      );
      return;
    }

    if (files && files.length > 0) {
      const paths = files.map((file) => `${id}/${file.name}`);

      const { error: photoError } = await supabase.storage
        .from("fotky-hercu")
        .remove(paths);

      if (photoError) {
        alert(
          "Fotografie se nepodařilo smazat: " +
            photoError.message
        );
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("candidates")
      .delete()
      .eq("id", id);

    if (deleteError) {
      alert(
        "Registraci se nepodařilo smazat: " +
          deleteError.message
      );
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

  function matchesRole(candidate: Candidate) {
    if (roleFilter === "Všichni") return true;

    const role = (candidate.role || "").toLowerCase();

    if (roleFilter === "Herci") {
      return (
        role.includes("herec") ||
        role.includes("herečka") ||
        role.includes("actor")
      );
    }

    if (roleFilter === "Komparz") {
      return (
        role.includes("komparz") ||
        role.includes("kompar")
      );
    }

    if (roleFilter === "Ostatní") {
      return (
        !role.includes("herec") &&
        !role.includes("herečka") &&
        !role.includes("actor") &&
        !role.includes("komparz") &&
        !role.includes("kompar")
      );
    }

    return true;
  }

  function matchesGender(candidate: Candidate) {
    if (genderFilter === "Všichni") return true;

    const gender = (candidate.gender || "").toLowerCase();

    if (genderFilter === "Ženy") {
      return (
        gender.includes("žena") ||
        gender.includes("ženy") ||
        gender.includes("female")
      );
    }

    if (genderFilter === "Muži") {
      return (
        gender.includes("muž") ||
        gender.includes("muzi") ||
        gender.includes("male")
      );
    }

    return true;
  }

  function matchesAge(candidate: Candidate) {
    if (ageFilter === "Všichni") return true;

    const age = Number(candidate.age);

    if (Number.isNaN(age)) return false;

    if (ageFilter === "0–12") {
      return age >= 0 && age <= 12;
    }

    if (ageFilter === "13–17") {
      return age >= 13 && age <= 17;
    }

    if (ageFilter === "18–30") {
      return age >= 18 && age <= 30;
    }

    if (ageFilter === "31–50") {
      return age >= 31 && age <= 50;
    }

    if (ageFilter === "51+") {
      return age >= 51;
    }

    return true;
  }

  function resetFilters() {
    setRoleFilter("Všichni");
    setGenderFilter("Všichni");
    setAgeFilter("Všichni");
    setCityFilter("Všechna města");
    setSearch("");
  }

  const cities = Array.from(
    new Set(
      candidates
        .map((candidate) => candidate.city)
        .filter(Boolean)
    )
  ).sort();

  const visibleCandidates = candidates
    .filter(
      (candidate) =>
        (candidate.status || "pending") === filter
    )
    .filter((candidate) => matchesRole(candidate))
    .filter((candidate) => matchesGender(candidate))
    .filter((candidate) => matchesAge(candidate))
    .filter(
      (candidate) =>
        cityFilter === "Všechna města" ||
        candidate.city === cityFilter
    )
    .filter((candidate) => {
      const text = search.toLowerCase().trim();

      if (!text) return true;

      const name =
        `${candidate.first_name} ${candidate.last_name}`.toLowerCase();

      return (
        name.includes(text) ||
        (candidate.email || "").toLowerCase().includes(text) ||
        (candidate.city || "").toLowerCase().includes(text)
      );
    });

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
        </p>

        {/* STATUS */}
        <div
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

        {/* FILTRY */}
        <div
          className="card"
          style={{
            marginBottom: 25,
            background: "#ffffff",
            color: "#111827",
          }}
        >
          <h2 style={{ color: "#111827" }}>
            🔎 Filtry
          </h2>

          <input
            type="text"
            placeholder="Hledat jméno, e-mail nebo město..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              boxSizing: "border-box",
              color: "#111827",
              background: "#ffffff",
              border: "1px solid #999",
              borderRadius: "8px",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
              style={selectStyle}
            >
              <option>Všichni</option>
              <option>Herci</option>
              <option>Komparz</option>
              <option>Ostatní</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) =>
                setGenderFilter(e.target.value)
              }
              style={selectStyle}
            >
              <option>Všichni</option>
              <option>Ženy</option>
              <option>Muži</option>
            </select>

            <select
              value={ageFilter}
              onChange={(e) =>
                setAgeFilter(e.target.value)
              }
              style={selectStyle}
            >
              <option>Všichni</option>
              <option>0–12</option>
              <option>13–17</option>
              <option>18–30</option>
              <option>31–50</option>
              <option>51+</option>
            </select>

            <select
              value={cityFilter}
              onChange={(e) =>
                setCityFilter(e.target.value)
              }
              style={selectStyle}
            >
              <option>Všechna města</option>

              {cities.map((city) => (
                <option key={city} value={city || ""}>
                  {city}
                </option>
              ))}
            </select>

            <button
              className="btn"
              onClick={resetFilters}
            >
              Zrušit filtry
            </button>
          </div>
        </div>

        {/* POČET */}
        {!loading && !error && (
          <p className="muted">
            Zobrazeno kandidátů:{" "}
            <strong>{visibleCandidates.length}</strong>
          </p>
        )}

        {loading && <p>Načítám registrace…</p>}

        {error && <div className="error">{error}</div>}

        {/* KANDIDÁTI */}
        {!loading &&
          visibleCandidates.map((candidate) => (
            <div
              className="card"
              key={candidate.id}
              style={{
                marginBottom: 25,
                background: "#ffffff",
                color: "#111827",
              }}
            >
              <h2 style={{ color: "#111827" }}>
                {candidate.first_name}{" "}
                {candidate.last_name}
              </h2>

              {/* FOTKY */}
              {candidate.photos &&
                candidate.photos.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      overflowX: "auto",
                      marginBottom: 20,
                    }}
                  >
                    {candidate.photos.map(
                      (photo, index) => (
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
                      )
                    )}
                  </div>
                )}

              <p>
                <b>Věk:</b> {candidate.age}
              </p>

              <p>
                <b>Pohlaví:</b>{" "}
                {candidate.gender || "—"}
              </p>

              <p>
                <b>Role:</b>{" "}
                {candidate.role || "—"}
              </p>

              <p>
                <b>Město:</b>{" "}
                {candidate.city || "—"}
              </p>

              <p>
                <b>Výška:</b>{" "}
                {candidate.height_cm
                  ? `${candidate.height_cm} cm`
                  : "—"}
              </p>

              <p>
                <b>Telefon:</b>{" "}
                {candidate.phone || "—"}
              </p>

              <p>
                <b>E-mail:</b>{" "}
                {candidate.email || "—"}
              </p>

              <p>
                <b>Zkušenosti:</b>{" "}
                {candidate.experience || "—"}
              </p>

              <p>
                <b>Dostupnost / poznámka:</b>{" "}
                {candidate.availability || "—"}
              </p>

              <p>
                <b>Stav:</b>{" "}
                {statusText(candidate.status)}
              </p>

              {/* AKCE */}
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
                  onClick={() =>
                    setSelectedCandidate(candidate)
                  }
                >
                  👤 Zobrazit detail
                </button>
              </div>
            </div>
          ))}

        {!loading &&
          visibleCandidates.length === 0 &&
          !error && (
            <div className="card">
              <p>
                Žádná registrace neodpovídá vybraným
                filtrům.
              </p>
            </div>
          )}

        {/* DETAIL */}
        {selectedCandidate && (
          <div
            className="card"
            style={{
              background: "#ffffff",
              color: "#111827",
            }}
          >
            <h2 style={{ color: "#111827" }}>
              👤 {selectedCandidate.first_name}{" "}
              {selectedCandidate.last_name}
            </h2>

            <p>
              <strong>Věk:</strong>{" "}
              {selectedCandidate.age}
            </p>

            <p>
              <strong>Pohlaví:</strong>{" "}
              {selectedCandidate.gender || "Neuvedeno"}
            </p>

            <p>
              <strong>Město:</strong>{" "}
              {selectedCandidate.city || "Neuvedeno"}
            </p>

            <p>
              <strong>Telefon:</strong>{" "}
              {selectedCandidate.phone || "Neuvedeno"}
            </p>

            <p>
              <strong>E-mail:</strong>{" "}
              {selectedCandidate.email || "Neuvedeno"}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {selectedCandidate.role || "Neuvedeno"}
            </p>

            <p>
              <strong>Výška:</strong>{" "}
              {selectedCandidate.height_cm
                ? `${selectedCandidate.height_cm} cm`
                : "Neuvedeno"}
            </p>

            <p>
              <strong>Zkušenosti:</strong>{" "}
              {selectedCandidate.experience ||
                "Neuvedeno"}
            </p>

            <p>
              <strong>Dostupnost:</strong>{" "}
              {selectedCandidate.availability ||
                "Neuvedeno"}
            </p>

            <p>
              <strong>Stav:</strong>{" "}
              {statusText(
                selectedCandidate.status
              )}
            </p>

            <h3>Fotografie</h3>

            {selectedCandidate.photos &&
            selectedCandidate.photos.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {selectedCandidate.photos.map(
                  (photo, index) => (
                    <img
                      key={photo}
                      src={photo}
                      alt={`Fotografie ${index + 1}`}
                      style={{
                        width: 180,
                        maxWidth: "100%",
                        borderRadius: 10,
                      }}
                    />
                  )
                )}
              </div>
            ) : (
              <p>Žádné fotografie.</p>
            )}

            <br />

            <button
              className="btn"
              onClick={() =>
                setSelectedCandidate(null)
              }
            >
              ← Zavřít detail
            </button>
          </div>
        )}
      </main>
    </>
  );
}

const selectStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #999",
  background: "#ffffff",
  color: "#111827",
  fontSize: "15px",
};
