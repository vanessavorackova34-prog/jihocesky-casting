“use client”;

import { useEffect, useMemo, useState } from “react”;
import { createBrowserClient } from “@supabase/ssr”;

type Candidate = {
id: string;
first_name: string | null;
last_name: string | null;
age: number | null;
city: string | null;
phone: string | null;
email: string | null;
role: string | null;
height_cm: number | null;
height_centimetres: number | null;
experience: string | null;
availability: string | null;
status: string | null;
gender: string | null;
photos?: string[];
};

export default function ProdukceDashboardPage() {
const [candidates, setCandidates] = useState<Candidate[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(””);

const [roleFilter, setRoleFilter] = useState(“Všichni”);
const [genderFilter, setGenderFilter] = useState(“Všichni”);
const [ageFilter, setAgeFilter] = useState(“Všichni”);
const [cityFilter, setCityFilter] = useState(“Všechna města”);
const [statusFilter, setStatusFilter] = useState(“Všechny statusy”);
const [search, setSearch] = useState(””);

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
  const withPhotos = await Promise.all(
    (data || []).map(async (candidate) => {
      const { data: files, error: photoListError } =
        await supabase.storage
          .from("fotky-hercu")
          .list(candidate.id);
      if (photoListError) {
        console.error(
          "Chyba při načítání fotek:",
          photoListError
        );
        return {
          ...candidate,
          photos: [],
        };
      }
      const photos =
        files
          ?.filter((file) => {
            const name = file.name.toLowerCase();
            return (
              name.endsWith(".jpg") ||
              name.endsWith(".jpeg") ||
              name.endsWith(".png") ||
              name.endsWith(".webp")
            );
          })
          .map((file) => {
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
${candidate.first_name || ""} ${candidate.last_name || ""}
.toLowerCase();

  const searchText = search.toLowerCase().trim();
  const matchesSearch =
    !searchText ||
    fullName.includes(searchText) ||
    (candidate.email || "")
      .toLowerCase()
      .includes(searchText) ||
    (candidate.city || "")
      .toLowerCase()
      .includes(searchText);
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
setRoleFilter(“Všichni”);
setGenderFilter(“Všichni”);
setAgeFilter(“Všichni”);
setCityFilter(“Všechna města”);
setStatusFilter(“Všechny statusy”);
setSearch(””);
}

return (
<main
style={{
minHeight: “100vh”,
background: “#000000”,
color: “#ffffff”,
padding: “40px 20px”,
fontFamily: “Arial, sans-serif”,
boxSizing: “border-box”,
}}
>
<div style={{ maxWidth: “1300px”, margin: “0 auto” }}>
<h1 style={{ color: “#ffffff” }}>
Produkční panel
    <p style={{ color: "#ffffff" }}>
      Celkem kandidátů:{" "}
      <strong>{candidates.length}</strong>
      {" · "}
      Zobrazeno:{" "}
      <strong>{filteredCandidates.length}</strong>
    </p>
    {error && (
      <div
        style={{
          background: "#2a0000",
          color: "#ffffff",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #660000",
        }}
      >
        {error}
      </div>
    )}
    <section
      style={{
        background: "#111111",
        border: "1px solid #333333",
        borderRadius: "16px",
        padding: "24px",
        marginTop: "25px",
      }}
    >
      <h2 style={{ color: "#ffffff" }}>
        🔎 Filtry
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
          border: "1px solid #555555",
          borderRadius: "10px",
          marginBottom: "15px",
          color: "#ffffff",
          background: "#000000",
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
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
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
            borderRadius: "10px",
            border: "1px solid #555555",
            background: "#222222",
            color: "#ffffff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Zrušit filtry
        </button>
      </div>
    </section>
    {loading && (
      <p style={{ color: "#ffffff" }}>
        Načítám kandidáty a fotografie…
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
            background: "#111111",
            color: "#ffffff",
            border: "1px solid #333333",
            borderRadius: "16px",
            padding: "20px",
            boxShadow:
              "0 3px 15px rgba(255,255,255,0.05)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#ffffff",
            }}
          >
            {candidate.first_name || ""}{" "}
            {candidate.last_name || ""}
          </h2>
          {candidate.photos &&
          candidate.photos.length > 0 ? (
            <div
              style={{
                display: "flex",
                gap: "10px",
                overflowX: "auto",
                marginBottom: "20px",
              }}
            >
              {candidate.photos.map((photo, index) => (
                <img
                  key={photo}
                  src={photo}
                  alt={`Fotografie ${index + 1}`}
                  style={{
                    width: "160px",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    flexShrink: 0,
                    border: "1px solid #333333",
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                height: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000000",
                border: "1px solid #333333",
                borderRadius: "12px",
                marginBottom: "20px",
                color: "#aaaaaa",
              }}
            >
              Žádná fotografie
            </div>
          )}
          <p>
            <strong>Věk:</strong>{" "}
            {candidate.age ?? "—"}
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
            {candidate.height_cm
              ? `${candidate.height_cm} cm`
              : candidate.height_centimetres
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
        </article>
      ))}
    </div>
  </div>
</main>

);
}

const selectStyle = {
padding: “13px”,
borderRadius: “10px”,
border: “1px solid #555555”,
background: “#000000”,
color: “#ffffff”,
fontSize: “15px”,
};
