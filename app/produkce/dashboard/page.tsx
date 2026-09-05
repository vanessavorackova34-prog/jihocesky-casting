"use client";

import { useEffect, useMemo, useState } from "react";
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

  const [roleFilter, setRoleFilter] = useState("Všichni");
  const [genderFilter, setGenderFilter] = useState("Všichni");
  const [ageFilter, setAgeFilter] = useState("Všichni");
  const [cityFilter, setCityFilter] = useState("Všechna města");
  const [statusFilter, setStatusFilter] = useState("Všechny statusy");
  const [search, setSearch] = useState("");

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

  const cities = useMemo(() => {
    return Array.from(
      new Set(
        candidates
          .map((candidate) => candidate.city)
          .filter(Boolean)
      )
    ).sort();
  }, [candidates]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(
        candidates
          .map((candidate) => candidate.status)
          .filter(Boolean)
      )
    ).sort();
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const fullName =
        `${candidate.first_name || ""} ${candidate.last_name || ""}`
          .toLowerCase();

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        fullName.includes(searchText) ||
        (candidate.email || "").toLowerCase().includes(searchText) ||
        (candidate.city || "").toLowerCase().includes(searchText);

      const role = (candidate.role || "").toLowerCase();
      const gender = (candidate.gender || "").toLowerCase();

      let matchesRole = true;

      if (roleFilter === "Herci") {
        matchesRole =
          role.includes("herec") ||
          role.includes("herečka") ||
          role.includes("actor");
      }

      if (roleFilter === "Komparz") {
        matchesRole =
          role.includes("komparz") ||
          role.includes("kompar");
      }

      if (roleFilter === "Ostatní") {
        matchesRole =
          !role.includes("herec") &&
          !role.includes("herečka") &&
          !role.includes("actor") &&
          !role.includes("komparz") &&
          !role.includes("kompar");
      }

      let matchesGender = true;

      if (genderFilter === "Ženy") {
        matchesGender =
          gender.includes("žena") ||
          gender.includes("ženy") ||
          gender.includes("female");
      }

      if (genderFilter === "Muži") {
        matchesGender =
          gender.includes("muž") ||
          gender.includes("muzi") ||
          gender.includes("male");
      }

      let matchesAge = true;

      if (ageFilter !== "Všichni") {
        const age = candidate.age;

        if (age === null) {
          matchesAge = false;
        } else if (ageFilter === "0–12") {
          matchesAge = age >= 0 && age <= 12;
        } else if (ageFilter === "13–17") {
          matchesAge = age >= 13 && age <= 17;
        } else if (ageFilter === "18–30") {
          matchesAge = age >= 18 && age <= 30;
        } else if (ageFilter === "31–50") {
          matchesAge = age >= 31 && age <= 50;
        } else if (ageFilter === "51+") {
          matchesAge = age >= 51;
        }
      }

      const matchesCity =
        cityFilter === "Všechna města" ||
        candidate.city === cityFilter;

      const matchesStatus =
        statusFilter === "Všechny statusy" ||
        candidate.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesGender &&
        matchesAge &&
        matchesCity &&
        matchesStatus
      );
    });
  }, [
    candidates,
    roleFilter,
    genderFilter,
    ageFilter,
    cityFilter,
    statusFilter,
    search,
  ]);

  function resetFilters() {
    setRoleFilter("Všichni");
    setGenderFilter("Všichni");
    setAgeFilter("Všichni");
    setCityFilter("Všechna města");
    setStatusFilter("Všechny statusy");
    setSearch("");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1300px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            marginBottom: "8px",
            color: "#111827",
          }}
        >
          Produkční panel
        </h1>

        <p style={{ color: "#374151", marginBottom: "30px" }}>
          Celkem kandidátů: <strong>{candidates.length}</strong>
          {" · "}
          Zobrazeno: <strong>{filteredCandidates.length}</strong>
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "15px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#111827",
            }}
          >
            Filtry
          </h2>

          <input
            type="text"
            placeholder="Hledat podle jména, e-mailu nebo města..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              boxSizing: "border-box",
              borderRadius: "10px",
              border: "1px solid #9ca3af",
              color: "#111827",
              background: "#ffffff",
              marginBottom: "15px",
              fontSize: "15px",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={selectStyle}
            >
              <option>Všichni</option>
              <option>Herci</option>
              <option>Komparz</option>
              <option>Ostatní</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              style={selectStyle}
            >
              <option>Všichni</option>
              <option>Ženy</option>
              <option>Muži</option>
            </select>

            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
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
              onChange={(e) => setCityFilter(e.target.value)}
              style={selectStyle}
            >
              <option>Všechna města</option>
              {cities.map((city) => (
                <option key={city} value={city || ""}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              <option>Všechny statusy</option>
              {statuses.map((status) => (
                <option key={status} value={status || ""}>
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              style={{
                padding: "13px",
                cursor: "pointer",
                borderRadius: "10px",
                border: "1px solid #9ca3af",
                background: "#e5e7eb",
                color: "#111827",
                fontWeight: "bold",
              }}
            >
              Zrušit filtry
            </button>
          </div>
        </section>

        {loading && (
          <p
            style={{
              marginTop: "30px",
              color: "#374151",
            }}
          >
            Načítám kandidáty…
          </p>
        )}

        {!loading &&
          !error &&
          filteredCandidates.length === 0 && (
            <p
              style={{
                marginTop: "30px",
                color: "#374151",
              }}
            >
              Žádný kandidát neodpovídá vybraným filtrům.
            </p>
          )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          {filteredCandidates.map((candidate) => (
            <article
              key={candidate.id}
              style={{
                background: "#ffffff",
                color: "#111827",
                border: "1px solid #d1d5db",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "20px",
                  color: "#111827",
                  fontSize: "24px",
                }}
              >
                {candidate.first_name || ""}{" "}
                {candidate.last_name || ""}
              </h2>

              <div style={infoStyle}>
                <strong>Věk:</strong>
                <span>{candidate.age ?? "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>Pohlaví:</strong>
                <span>{candidate.gender || "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>Role:</strong>
                <span>{candidate.role || "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>Město:</strong>
                <span>{candidate.city || "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>Výška:</strong>
                <span>
                  {candidate.height_centimetres
                    ? `${candidate.height_centimetres} cm`
                    : "—"}
                </span>
              </div>

              <div style={infoStyle}>
                <strong>Telefon:</strong>
                <span>{candidate.phone || "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>E-mail:</strong>
                <span>{candidate.email || "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>Zkušenosti:</strong>
                <span>{candidate.experience || "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>Dostupnost:</strong>
                <span>{candidate.availability || "—"}</span>
              </div>

              <div style={infoStyle}>
                <strong>Status:</strong>
                <span>{candidate.status || "—"}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

const selectStyle = {
  padding: "13px",
  borderRadius: "10px",
  border: "1px solid #9ca3af",
  background: "#ffffff",
  color: "#111827",
  fontSize: "15px",
};

const infoStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "15px",
  padding: "10px 0",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
};
