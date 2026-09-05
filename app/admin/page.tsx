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
  height_centimetres: number | null;
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
  const [cityFilter, setCityFilter] =
    useState("Všechna města");
  const [search, setSearch] = useState("");

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase =
    url && key ? createBrowserClient(url, key) : null;

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    setError("");

    if (!supabase) {
      setError("Web není připojený k databázi.");
      setLoading(false);
      return;
    }

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
              .getPublicUrl(
                `${candidate.id}/${file.name}`
              );

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

  async function changeStatus(
    id: string,
    status: string
  ) {
    if (!supabase) return;

    const { error } = await supabase
      .from("candidates")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(
        "Stav se nepodařilo změnit: " +
          error.message
      );
      return;
    }

    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === id
          ? { ...candidate, status }
          : candidate
      )
    );

    setSelectedCandidate((current) =>
      current && current.id === id
        ? { ...current, status }
        : current
    );
  }

  async function deleteCandidate(
    id: string,
    name: string
  ) {
    if (!supabase) return;

    const confirmed = window.confirm(
      `Opravdu chceš smazat registraci ${name}? Registrace i všechny fotografie budou trvale odstraněny.`
    );

    if (!confirmed) return;

    const { data: files, error: listError } =
      await supabase.storage
        .from("fotky-hercu")
        .list(id);

    if (listError) {
      alert(
        "Nepodařilo se načíst fotografie: " +
          listError.message
      );
      return;
    }

    if (files && files.length > 0) {
      const paths = files.map(
        (file) => `${id}/${file.name}`
      );

      const { error: photoError } =
        await supabase.storage
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

    setSelectedCandidate(null);

    alert(
      `Registrace ${name} byla smazána včetně fotografií.`
    );
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    router.push("/prihlaseni");
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
        .filter(
          (city): city is string =>
            Boolean(city)
        )
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
        (candidate.email || "")
          .toLowerCase()
          .includes(text) ||
        (candidate.city || "")
          .toLowerCase()
          .includes(text)
      );
    });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1250,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginBottom: 35,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: 3,
                color: "#999",
                marginBottom: 8,
              }}
            >
              JIHOČESKÝ CASTING
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 38,
              }}
            >
              Pořadatel
            </h1>

            <p
              style={{
                color: "#999",
                marginTop: 8,
              }}
            >
              Správa registrovaných talentů
            </p>
          </div>

          <button
            onClick={logout}
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "12px 20px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Odhlásit se
          </button>
        </header>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setFilter("pending")}
            style={filterButton(filter === "pending")}
          >
            ⏳ Čekající
          </button>

          <button
            onClick={() => setFilter("approved")}
            style={filterButton(filter === "approved")}
          >
            ✅ Schválené
          </button>

          <button
            onClick={() => setFilter("rejected")}
            style={filterButton(filter === "rejected")}
          >
            ❌ Zamítnuté
          </button>
        </div>

        <section
          style={{
            background: "#111",
            border: "1px solid #222",
            borderRadius: 12,
            padding: 20,
            marginBottom: 25,
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: 20,
            }}
          >
            🔎 Filtry
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <input
              placeholder="Hledat..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={inputStyle}
            />

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
              style={inputStyle}
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
              style={inputStyle}
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
              style={inputStyle}
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
              style={inputStyle}
            >
              <option>Všechna města</option>

              {cities.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              style={{
                background: "#222",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: 7,
                padding: "12px",
                cursor: "pointer",
              }}
            >
              Resetovat filtry
            </button>
          </div>
        </section>

        {loading && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              background: "#111",
              borderRadius: 10,
            }}
          >
            Načítám registrace...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 20,
              background: "#211",
              border: "1px solid #633",
              borderRadius: 10,
              color: "#faa",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          visibleCandidates.length === 0 && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                background: "#111",
                borderRadius: 10,
                color: "#888",
              }}
            >
              Žádné registrace v této kategorii.
            </div>
          )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {visibleCandidates.map((candidate) => (
            <div
              key={candidate.id}
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {candidate.photos &&
              candidate.photos.length > 0 ? (
                <img
                  src={candidate.photos[0]}
                  alt={`${candidate.first_name} ${candidate.last_name}`}
                  style={{
                    width: "100%",
                    height: 300,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: 300,
                    background: "#181818",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#777",
                  }}
                >
                  Žádná fotografie
                </div>
              )}

              <div style={{ padding: 20 }}>
                <h2
                  style={{
                    margin: "0 0 8px",
                  }}
                >
                  {candidate.first_name}{" "}
                  {candidate.last_name}
                </h2>

                <div style={mutedStyle}>
                  {candidate.age} let
                </div>

                {candidate.city && (
                  <div style={mutedStyle}>
                    📍 {candidate.city}
                  </div>
                )}

                <div
                  style={{
                    ...mutedStyle,
                    marginBottom: 15,
                  }}
                >
                  🎬 {candidate.role}
                </div>

                <button
                  onClick={() =>
                    setSelectedCandidate(candidate)
                  }
                  style={{
                    width: "100%",
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: 7,
                    padding: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Zobrazit profil
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedCandidate && (
          <div
            onClick={() =>
              setSelectedCandidate(null)
            }
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.88)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              zIndex: 1000,
              overflowY: "auto",
            }}
          >
            <div
              onClick={(e) =>
                e.stopPropagation()
              }
              style={{
                width: "100%",
                maxWidth: 850,
                background: "#111",
                border: "1px solid #333",
                borderRadius: 12,
                padding: 25,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                  }}
                >
                  {selectedCandidate.first_name}{" "}
                  {selectedCandidate.last_name}
                </h2>

                <button
                  onClick={() =>
                    setSelectedCandidate(null)
                  }
                  style={{
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: 6,
                    padding: "7px 12px",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {selectedCandidate.photos &&
                selectedCandidate.photos.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 12,
                      marginBottom: 25,
                    }}
                  >
                    {selectedCandidate.photos.map(
                      (photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Fotografie ${index + 1}`}
                          style={{
                            width: "100%",
                            height: 220,
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      )
                    )}
                  </div>
                )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  marginBottom: 25,
                }}
              >
                <Info
                  label="Věk"
                  value={`${selectedCandidate.age} let`}
                />

                <Info
                  label="Město"
                  value={selectedCandidate.city}
                />

                <Info
                  label="Telefon"
                  value={selectedCandidate.phone}
                />

                <Info
                  label="E-mail"
                  value={selectedCandidate.email}
                />

                <Info
                  label="Role"
                  value={selectedCandidate.role}
                />

                <Info
                  label="Pohlaví"
                  value={selectedCandidate.gender}
                />

                <Info
                  label="Výška"
                  value={
                    selectedCandidate.height_cm
                      ? `${selectedCandidate.height_cm} cm`
                      : selectedCandidate.height_centimetres
                      ? `${selectedCandidate.height_centimetres} cm`
                      : null
                  }
                />

                <Info
                  label="Zkušenosti"
                  value={selectedCandidate.experience}
                />

                <Info
                  label="Dostupnost"
                  value={selectedCandidate.availability}
                />

                <Info
                  label="Stav"
                  value={selectedCandidate.status}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() =>
                    changeStatus(
                      selectedCandidate.id,
                      "approved"
                    )
                  }
                  style={{
                    ...actionButton,
                    background: "#fff",
                    color: "#000",
                  }}
                >
                  ✅ Schválit
                </button>

                <button
                  onClick={() =>
                    changeStatus(
                      selectedCandidate.id,
                      "rejected"
                    )
                  }
                  style={{
                    ...actionButton,
                    background: "#222",
                    color: "#fff",
                  }}
                >
                  ❌ Zamítnout
                </button>

                <button
                  onClick={() =>
                    deleteCandidate(
                      selectedCandidate.id,
                      `${selectedCandidate.first_name} ${selectedCandidate.last_name}`
                    )
                  }
                  style={{
                    ...actionButton,
                    background: "#000",
                    color: "#fff",
                    border: "1px solid #555",
                  }}
                >
                  🗑️ Smazat registraci
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 15px",
  background: "#181818",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: 7,
  fontSize: 15,
};

const mutedStyle: React.CSSProperties = {
  color: "#999",
  marginBottom: 6,
};

const actionButton: React.CSSProperties = {
  border: "none",
  borderRadius: 7,
  padding: "12px 16px",
  fontWeight: 600,
  cursor: "pointer",
};

function filterButton(active: boolean): React.CSSProperties {
  return {
    background: active ? "#fff" : "#111",
    color: active ? "#000" : "#fff",
    border: "1px solid #333",
    borderRadius: 7,
    padding: "11px 16px",
    fontWeight: 600,
    cursor: "pointer",
  };
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div
      style={{
        background: "#181818",
        borderRadius: 8,
        padding: 15,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#777",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 16,
          color: "#fff",
          wordBreak: "break-word",
        }}
      >
        {value || "Neuvedeno"}
      </div>
    </div>
  );
}
