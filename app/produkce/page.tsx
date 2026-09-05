"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  city: string | null;
  role: string | null;
  height_cm: number | null;
  experience: string | null;
  availability: string | null;
  status: string | null;
  photo_url?: string | null;
  photos?: string[] | null;
};

export default function ProdukcePage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/prihlaseni");
      return;
    }

    loadCandidates();
  }

  async function loadCandidates() {
    setLoading(true);

    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("status", "approved");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setCandidates(data || []);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/prihlaseni");
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const candidateRole = (candidate.role || "").toLowerCase();
    const candidateCity = (candidate.city || "").toLowerCase();
    const fullName =
      `${candidate.first_name || ""} ${candidate.last_name || ""}`.toLowerCase();

    if (role && !candidateRole.includes(role.toLowerCase())) {
      return false;
    }

    if (ageFrom && Number(candidate.age) < Number(ageFrom)) {
      return false;
    }

    if (ageTo && Number(candidate.age) > Number(ageTo)) {
      return false;
    }

    if (
      city &&
      !candidateCity.includes(city.toLowerCase())
    ) {
      return false;
    }

    if (
      search &&
      !fullName.includes(search.toLowerCase())
    ) {
      return false;
    }

    // Pohlaví zatím použijeme až po přidání sloupce gender do Supabase.
    if (gender) {
      return true;
    }

    return true;
  });

  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "5px" }}>
            Databáze talentů
          </h1>

          <p style={{ margin: 0 }}>
            Jihočeský Casting – přístup pro produkce
          </p>
        </div>

        <button onClick={logout}>
          Odhlásit
        </button>
      </div>

      <section
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <h2>Vyhledávání a filtry</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Herec / Komparz</option>
            <option value="herec">Herec</option>
            <option value="komparz">Komparz</option>
          </select>

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Všechna pohlaví</option>
            <option value="male">Muži / Kluci</option>
            <option value="female">Ženy / Dívky</option>
          </select>

          <input
            type="number"
            placeholder="Věk od"
            value={ageFrom}
            onChange={(e) => setAgeFrom(e.target.value)}
          />

          <input
            type="number"
            placeholder="Věk do"
            value={ageTo}
            onChange={(e) => setAgeTo(e.target.value)}
          />

          <input
            placeholder="Město"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <input
            placeholder="Hledat podle jména"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <p style={{ marginBottom: 0 }}>
          Nalezeno: <strong>{filteredCandidates.length}</strong>
        </p>
      </section>

      {loading ? (
        <p>Načítám databázi...</p>
      ) : filteredCandidates.length === 0 ? (
        <p>Pro zadané požadavky nebyl nalezen žádný profil.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredCandidates.map((candidate) => (
            <article
              key={candidate.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "18px",
              }}
            >
              {candidate.photo_url && (
                <img
                  src={candidate.photo_url}
                  alt={`${candidate.first_name} ${candidate.last_name}`}
                  style={{
                    width: "100%",
                    height: "280px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "15px",
                  }}
                />
              )}

              <h2>
                {candidate.first_name} {candidate.last_name}
              </h2>

              <p>
                <strong>Věk:</strong>{" "}
                {candidate.age ?? "Neuvedeno"}
              </p>

              <p>
                <strong>Město:</strong>{" "}
                {candidate.city || "Neuvedeno"}
              </p>

              <p>
                <strong>Výška:</strong>{" "}
                {candidate.height_cm
                  ? `${candidate.height_cm} cm`
                  : "Neuvedeno"}
              </p>

              <p>
                <strong>Kategorie:</strong>{" "}
                {candidate.role || "Neuvedeno"}
              </p>

              {candidate.experience && (
                <p>
                  <strong>Zkušenosti:</strong>{" "}
                  {candidate.experience}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
