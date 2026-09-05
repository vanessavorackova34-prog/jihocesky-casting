"use client";

import { useEffect, useState } from "react";
import { useRouter } from “next/navigation”;
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

export default function ProdukceDashboard() {
const router = useRouter();

const [candidates, setCandidates] = useState<Candidate[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(””);

const [search, setSearch] = useState(””);
const [ageFrom, setAgeFrom] = useState(””);
const [ageTo, setAgeTo] = useState(””);
const [gender, setGender] = useState(””);
const [city, setCity] = useState(””);
const [role, setRole] = useState(””);
const [heightFrom, setHeightFrom] = useState(””);
const [heightTo, setHeightTo] = useState(””);
const [experience, setExperience] = useState(””);
const [availability, setAvailability] = useState(””);
const [status, setStatus] = useState(””);

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
setError(””);

if (!supabase) {
  setError("Web není připojený k databázi.");
  setLoading(false);
  return;
}
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) {
  router.push("/produkce");
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

async function logout() {
if (supabase) {
await supabase.auth.signOut();
}

router.push("/produkce");

}

function clearFilters() {
setSearch(””);
setAgeFrom(””);
setAgeTo(””);
setGender(””);
setCity(””);
setRole(””);
setHeightFrom(””);
setHeightTo(””);
setExperience(””);
setAvailability(””);
setStatus(””);
}

const cities = Array.from(
new Set(
candidates
.map((candidate) => candidate.city)
.filter(Boolean)
)
).sort();

const roles = Array.from(
new Set(
candidates
.map((candidate) => candidate.role)
.filter(Boolean)
)
).sort();

const experiences = Array.from(
new Set(
candidates
.map((candidate) => candidate.experience)
.filter(Boolean)
)
).sort();

const availabilities = Array.from(
new Set(
candidates
.map((candidate) => candidate.availability)
.filter(Boolean)
)
).sort();

const statuses = Array.from(
new Set(
candidates
.map((candidate) => candidate.status)
.filter(Boolean)
)
).sort();

const visibleCandidates = candidates.filter((candidate) => {
const text = search.toLowerCase().trim();

const name =
  `${candidate.first_name} ${candidate.last_name}`.toLowerCase();
const matchesSearch =
  !text ||
  name.includes(text) ||
  (candidate.email || "").toLowerCase().includes(text) ||
  (candidate.city || "").toLowerCase().includes(text) ||
  (candidate.role || "").toLowerCase().includes(text);
const matchesAgeFrom =
  !ageFrom || candidate.age >= Number(ageFrom);
const matchesAgeTo =
  !ageTo || candidate.age <= Number(ageTo);
const candidateHeight =
  candidate.height_cm ??
  candidate.height_centimetres ??
  null;
const matchesHeightFrom =
  !heightFrom ||
  (candidateHeight !== null &&
    candidateHeight >= Number(heightFrom));
const matchesHeightTo =
  !heightTo ||
  (candidateHeight !== null &&
    candidateHeight <= Number(heightTo));
const matchesGender =
  !gender ||
  (candidate.gender || "").toLowerCase() ===
    gender.toLowerCase();
const matchesCity =
  !city ||
  (candidate.city || "").toLowerCase() ===
    city.toLowerCase();
const matchesRole =
  !role ||
  (candidate.role || "").toLowerCase() ===
    role.toLowerCase();
const matchesExperience =
  !experience ||
  (candidate.experience || "").toLowerCase() ===
    experience.toLowerCase();
const matchesAvailability =
  !availability ||
  (candidate.availability || "").toLowerCase() ===
    availability.toLowerCase();
const matchesStatus =
  !status ||
  (candidate.status || "").toLowerCase() ===
    status.toLowerCase();
return (
  matchesSearch &&
  matchesAgeFrom &&
  matchesAgeTo &&
  matchesHeightFrom &&
  matchesHeightTo &&
  matchesGender &&
  matchesCity &&
  matchesRole &&
  matchesExperience &&
  matchesAvailability &&
  matchesStatus
);

});

const inputStyle = {
width: “100%”,
boxSizing: “border-box” as const,
padding: “12px 14px”,
background: “#111”,
color: “#fff”,
border: “1px solid #333”,
borderRadius: 8,
fontSize: 14,
outline: “none”,
};

const selectStyle = {
…inputStyle,
cursor: “pointer”,
};

return (
<main
style={{
minHeight: “100vh”,
background: “#000”,
color: “#fff”,
padding: “30px 20px”,
}}
>
<div
style={{
maxWidth: 1200,
margin: “0 auto”,
}}
>
<header
style={{
display: “flex”,
justifyContent: “space-between”,
alignItems: “center”,
gap: 20,
marginBottom: 40,
flexWrap: “wrap”,
}}
>
<div
style={{
fontSize: 13,
letterSpacing: 3,
color: “#aaa”,
marginBottom: 8,
}}
>
JIHOČESKÝ CASTING
        <h1
          style={{
            margin: 0,
            fontSize: 38,
            fontWeight: 700,
          }}
        >
          Produkce
        </h1>
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
        background: "#111",
        border: "1px solid #222",
        borderRadius: 12,
        padding: 20,
        marginBottom: 25,
      }}
    >
      <h2
        style={{
          margin: "0 0 18px",
          fontSize: 20,
        }}
      >
        Filtrování kandidátů
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
          type="text"
          placeholder="Hledat jméno, město, roli..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Věk od"
          value={ageFrom}
          onChange={(e) => setAgeFrom(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Věk do"
          value={ageTo}
          onChange={(e) => setAgeTo(e.target.value)}
          style={inputStyle}
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          style={selectStyle}
        >
          <option value="">Pohlaví – vše</option>
          <option value="Žena">Žena</option>
          <option value="Muž">Muž</option>
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={selectStyle}
        >
          <option value="">Město – vše</option>
          {cities.map((item) => (
            <option key={String(item)} value={String(item)}>
              {String(item)}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={selectStyle}
        >
          <option value="">Role – všechny</option>
          {roles.map((item) => (
            <option key={String(item)} value={String(item)}>
              {String(item)}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Výška od (cm)"
          value={heightFrom}
          onChange={(e) => setHeightFrom(e.target.value)}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Výška do (cm)"
          value={heightTo}
          onChange={(e) => setHeightTo(e.target.value)}
          style={inputStyle}
        />
        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          style={selectStyle}
        >
          <option value="">Zkušenosti – všechny</option>
          {experiences.map((item) => (
            <option key={String(item)} value={String(item)}>
              {String(item)}
            </option>
          ))}
        </select>
        <select
          value={availability}
          onChange={(e) =>
            setAvailability(e.target.value)
          }
          style={selectStyle}
        >
          <option value="">Dostupnost – všechny</option>
          {availabilities.map((item) => (
            <option key={String(item)} value={String(item)}>
              {String(item)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="">Status – všechny</option>
          {statuses.map((item) => (
            <option key={String(item)} value={String(item)}>
              {String(item)}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={clearFilters}
        style={{
          marginTop: 15,
          background: "#fff",
          color: "#000",
          border: "none",
          borderRadius: 8,
          padding: "11px 18px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Vymazat filtry
      </button>
      <div
        style={{
          marginTop: 15,
          color: "#aaa",
          fontSize: 14,
        }}
      >
        Zobrazeno kandidátů: {visibleCandidates.length} z{" "}
        {candidates.length}
      </div>
    </div>
    {loading && (
      <div
        style={{
          padding: 30,
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
          background: "#2a1111",
          border: "1px solid #662222",
          borderRadius: 10,
          color: "#ffaaaa",
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
            color: "#aaa",
          }}
        >
          Žádné registrace nebyly nalezeny.
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#181818",
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
                fontSize: 22,
              }}
            >
              {candidate.first_name}{" "}
              {candidate.last_name}
            </h2>
            <div
              style={{
                color: "#aaa",
                marginBottom: 5,
              }}
            >
              {candidate.age} let
            </div>
            {candidate.city && (
              <div
                style={{
                  color: "#aaa",
                  marginBottom: 5,
                }}
              >
                📍 {candidate.city}
              </div>
            )}
            <div
              style={{
                color: "#aaa",
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
        onClick={() => setSelectedCandidate(null)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zIndex: 1000,
          overflowY: "auto",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 800,
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
              marginBottom: 20,
              gap: 20,
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
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 18,
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
              gap: 15,
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
              label="Status"
              value={selectedCandidate.status}
            />
          </div>
        </div>
      </div>
    )}
  </div>
</main>

);
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
background: “#181818”,
borderRadius: 8,
padding: 15,
}}
>
<div
style={{
fontSize: 12,
color: “#777”,
textTransform: “uppercase”,
letterSpacing: 1,
marginBottom: 6,
}}
>
{label}
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
