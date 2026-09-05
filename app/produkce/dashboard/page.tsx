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
        maxWidth: "1300px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Produkční panel</h1>

      <p>
        Celkem kandidátů: <strong>{candidates.length}</strong>
        {" · "}
        Zobrazeno: <strong>{filteredCandidates.length}</strong>
      </p>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "16px",
          display: "grid",
          gap: "15px",
        }}
      >
        <h2 style={{ margin: 0 }}>Filtry</h2>

        <input
          type="text"
          placeholder="Hledat podle jména, e-mailu nebo města..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            boxSizing: "border-box",
            borderRadius: "8px",
            border: "1px solid #ccc",
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
            style={{ padding: "12px" }}
          >
            <option>Všichni</option>
            <option>Herci</option>
            <option>Komparz</option>
            <option>Ostatní</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            style={{ padding: "12px" }}
          >
            <option>Všichni</option>
            <option>Ženy</option>
            <option>Muži</option>
          </select>

          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            style={{ padding: "12px" }}
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
            style={{ padding: "12px" }}
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
            style={{ padding: "12px" }}
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
              padding: "12px",
              cursor: "pointer",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#f5f5f5",
            }}
          >
            Zrušit filtry
          </button>
        </div>
      </div>

      {loading && <p>Načítám kandidáty…</p>}

      {!loading && !error && filteredCandidates.length === 0 && (
        <p style={{ marginTop: "30px" }}>
          Žádný kandidát neodpovídá vybraným filtrům.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {filteredCandidates.map((candidate) => (
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
              {candidate.first_name || ""}{" "}
              {candidate.last_name || ""}
            </h2>

            <p>
              <strong>Věk:</strong> {candidate.age ?? "—"}
            </p>

            <p>
              <strong>Pohlaví:</strong>{" "}
              {candidate.gender || "—"}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {candidate.role || "—"}
            </p>

            <p>
              <strong>Město:</strong>{" "}
              {candidate.city || "—"}
            </p>

            <p>
              <strong>Výška:</strong>{" "}
              {candidate.height_centimetres
                ? `${candidate.height_centimetres} cm`
                : "—"}
            </p>

            <p>
              <strong>Telefon:</strong>{" "}
              {candidate.phone || "—"}
            </p>

            <p>
              <strong>E-mail:</strong>{" "}
              {candidate.email || "—"}
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
              <strong>Status:</strong>{" "}
              {candidate.status || "—"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
