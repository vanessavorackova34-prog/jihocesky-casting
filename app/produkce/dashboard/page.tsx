"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  regions,
  getCitiesForRegion,
} from "../../../lib/locations";

type Candidate = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  kraj?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  height_cm?: number | null;
  height_centimetres?: number | null;
  chest_cm?: number | null;
  waist_cm?: number | null;
  hips_cm?: number | null;
  inseam_cm?: number | null;
  shoe_size?: number | null;
  experience?: string | null;
  availability?: string | null;
  status?: string | null;
  gender?: string | null;
  photo_paths?: string[] | null;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!
  );
}

function isImagePath(path: string) {
  const name = path.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

function getFastPhotoUrl(
  supabase: ReturnType<typeof getSupabase>,
  path: string,
  width: number,
  height: number
) {
  const { data } = supabase.storage
    .from("fotky-hercu")
    .getPublicUrl(path, {
      transform: {
        width,
        height,
        resize: "cover",
        quality: 72,
      },
    });

  return data.publicUrl;
}

function getOriginalPhotoUrl(
  supabase: ReturnType<typeof getSupabase>,
  path: string
) {
  const { data } = supabase.storage
    .from("fotky-hercu")
    .getPublicUrl(path);

  return data.publicUrl;
}

type PhotoItem = {
  previewUrl: string;
  originalUrl: string;
};

function buildPhotoItem(
  supabase: ReturnType<typeof getSupabase>,
  path: string,
  width: number,
  height: number
): PhotoItem {
  return {
    previewUrl: getFastPhotoUrl(
      supabase,
      path,
      width,
      height
    ),
    originalUrl: getOriginalPhotoUrl(
      supabase,
      path
    ),
  };
}

export default function ProductionDashboard() {
  const router = useRouter();

  const [candidates, setCandidates] =
    useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [gender, setGender] = useState("");

  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");

  const [role, setRole] = useState("");
  const [heightFrom, setHeightFrom] = useState("");
  const [heightTo, setHeightTo] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] =
    useState("");
  const [status, setStatus] = useState("");

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    setError("");

    const supabase = getSupabase();

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
      console.error(error);
      setError(
        "Nepodařilo se načíst uchazeče."
      );
      setLoading(false);
      return;
    }

    setCandidates(data || []);
    setLoading(false);
  }

  async function openCandidate(
    candidate: Candidate
  ) {
    const supabase = getSupabase();

    setSelectedCandidate(candidate);

    const storedPaths = (candidate.photo_paths || [])
      .filter(isImagePath);

    if (storedPaths.length > 0) {
      setPhotos(
        storedPaths.map((path) =>
          buildPhotoItem(
            supabase,
            path,
            900,
            1100
          )
        )
      );
      return;
    }

    setPhotos([]);

    const { data, error } =
      await supabase.storage
        .from("fotky-hercu")
        .list(candidate.id);

    if (error || !data) {
      return;
    }

    const photoUrls = data
      .filter((file) => isImagePath(file.name))
      .map((file) =>
        buildPhotoItem(
          supabase,
          `${candidate.id}/${file.name}`,
          900,
          1100
        )
      );

    setPhotos(photoUrls);
  }

  async function logout() {
    const supabase = getSupabase();

    await supabase.auth.signOut();
    router.push("/produkce");
  }

  function clearFilters() {
    setSearch("");
    setAgeFrom("");
    setAgeTo("");
    setGender("");
    setRegion("");
    setCity("");
    setRole("");
    setHeightFrom("");
    setHeightTo("");
    setExperience("");
    setAvailability("");
    setStatus("");
  }

  function getGenderLabel(
    value: string | null | undefined
  ) {
    const genderValue =
      (value || "").trim().toLowerCase();

    if (genderValue === "female") {
      return "Žena / dívka";
    }

    if (genderValue === "male") {
      return "Muž / chlapec";
    }

    return value || "Neuvedeno";
  }

  const cities =
    getCitiesForRegion(region);

  const roles = Array.from(
    new Set(
      candidates
        .map((c) => c.role)
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  ).sort();

  const experiences = Array.from(
    new Set(
      candidates
        .map((c) => c.experience)
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  ).sort();

  const availabilities = Array.from(
    new Set(
      candidates
        .map((c) => c.availability)
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  ).sort();

  const statuses = Array.from(
    new Set(
      candidates
        .map((c) => c.status)
        .filter(
          (value): value is string =>
            Boolean(value)
        )
    )
  ).sort();

  const filteredCandidates =
    candidates.filter((candidate) => {
      const text =
        search.toLowerCase().trim();

      const name =
        `${candidate.first_name || ""} ${candidate.last_name || ""}`.toLowerCase();

      const matchesSearch =
        !text ||
        name.includes(text) ||
        (candidate.email || "")
          .toLowerCase()
          .includes(text) ||
        (candidate.city || "")
          .toLowerCase()
          .includes(text) ||
        (candidate.kraj || "")
          .toLowerCase()
          .includes(text) ||
        (candidate.role || "")
          .toLowerCase()
          .includes(text);

      const age = Number(candidate.age);

      const matchesAgeFrom =
        !ageFrom ||
        (!Number.isNaN(age) &&
          age >= Number(ageFrom));

      const matchesAgeTo =
        !ageTo ||
        (!Number.isNaN(age) &&
          age <= Number(ageTo));

      const candidateGender =
        (candidate.gender || "")
          .trim()
          .toLowerCase();

      const selectedGender =
        gender.trim().toLowerCase();

      const matchesGender =
        !gender ||
        candidateGender === selectedGender;

      const matchesRegion =
        !region ||
        candidate.kraj === region;

      const matchesCity =
        !city ||
        candidate.city === city;

      const matchesRole =
        !role ||
        candidate.role === role;

      const height =
        candidate.height_cm ??
        candidate.height_centimetres ??
        null;

      const matchesHeightFrom =
        !heightFrom ||
        (height !== null &&
          height >= Number(heightFrom));

      const matchesHeightTo =
        !heightTo ||
        (height !== null &&
          height <= Number(heightTo));

      const matchesExperience =
        !experience ||
        candidate.experience === experience;

      const matchesAvailability =
        !availability ||
        candidate.availability ===
          availability;

      const matchesStatus =
        !status ||
        candidate.status === status;

      return (
        matchesSearch &&
        matchesAgeFrom &&
        matchesAgeTo &&
        matchesGender &&
        matchesRegion &&
        matchesCity &&
        matchesRole &&
        matchesHeightFrom &&
        matchesHeightTo &&
        matchesExperience &&
        matchesAvailability &&
        matchesStatus
      );
    });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
              }}
            >
              Produkce
            </h1>

            <p
              style={{
                color: "#786c56",
                marginTop: "6px",
              }}
            >
              Přehled přihlášených uchazečů
            </p>
          </div>

          <button
            onClick={logout}
            style={buttonStyle}
          >
            Odhlásit
          </button>
        </header>

        {error && (
          <div
            style={{
              background: "#250000",
              border: "1px solid #700",
              color: "#fff",
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
            background: "#111",
            border: "1px solid #292929",
            padding: "20px",
            borderRadius: "15px",
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "18px",
            }}
          >
            Filtrování
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
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

            <input
              type="number"
              placeholder="Věk od"
              value={ageFrom}
              onChange={(e) =>
                setAgeFrom(e.target.value)
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Věk do"
              value={ageTo}
              onChange={(e) =>
                setAgeTo(e.target.value)
              }
              style={inputStyle}
            />

            <select
              value={gender}
              onChange={(e) =>
                setGender(e.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Pohlaví
              </option>

              <option value="female">
                Žena / dívka
              </option>

              <option value="male">
                Muž / chlapec
              </option>
            </select>

            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setCity("");
              }}
              style={inputStyle}
            >
              <option value="">
                Kraj
              </option>

              {regions.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={city}
              onChange={(e) =>
                setCity(e.target.value)
              }
              disabled={!region}
              style={inputStyle}
            >
              <option value="">
                {region
                  ? "Všechna města"
                  : "Nejdříve vyber kraj"}
              </option>

              {cities.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Role
              </option>

              {roles.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Výška od"
              value={heightFrom}
              onChange={(e) =>
                setHeightFrom(e.target.value)
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Výška do"
              value={heightTo}
              onChange={(e) =>
                setHeightTo(e.target.value)
              }
              style={inputStyle}
            />

            <select
              value={experience}
              onChange={(e) =>
                setExperience(e.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Zkušenosti
              </option>

              {experiences.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={availability}
              onChange={(e) =>
                setAvailability(e.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Dostupnost
              </option>

              {availabilities.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              style={inputStyle}
            >
              <option value="">
                Status
              </option>

              {statuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#fff",
                color: "#000",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Vymazat filtry
            </button>
          </div>

          <p
            style={{
              color: "#786c56",
              marginBottom: 0,
              marginTop: "18px",
            }}
          >
            Zobrazeno:{" "}
            <strong style={{ color: "#a77a22" }}>
              {filteredCandidates.length}
            </strong>{" "}
            z {candidates.length}
          </p>
        </section>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#786c56",
            }}
          >
            Načítám uchazeče...
          </div>
        ) : filteredCandidates.length ===
          0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#786c56",
            }}
          >
            Žádní uchazeči neodpovídají
            filtrům.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {filteredCandidates.map(
              (candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  priority={index < 4}
                  onClick={() =>
                    openCandidate(candidate)
                  }
                />
              )
            )}
          </div>
        )}
      </div>

      {selectedCandidate && (
        <div
          onClick={() =>
            setSelectedCandidate(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(50,38,18,0.62)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              background: "#111",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "15px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "25px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <h2>
                {selectedCandidate.first_name}{" "}
                {selectedCandidate.last_name}
              </h2>

              <button
                onClick={() =>
                  setSelectedCandidate(null)
                }
                style={{
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ×
              </button>
            </div>

            {photos.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "12px",
                  marginBottom: "25px",
                }}
              >
                {photos.map(
                  (photo, index) => (
                    <DetailPhoto
                      key={`${photo.originalUrl}-${index}`}
                      photo={photo}
                      index={index}
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
                gap: "12px",
              }}
            >
              <Info
                label="Jméno"
                value={`${selectedCandidate.first_name || ""} ${
                  selectedCandidate.last_name || ""
                }`}
              />

              <Info
                label="Věk"
                value={selectedCandidate.age}
              />

              <Info
                label="Pohlaví"
                value={getGenderLabel(
                  selectedCandidate.gender
                )}
              />

              <Info
                label="Kraj"
                value={selectedCandidate.kraj}
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
                label="Výška"
                value={
                  selectedCandidate.height_cm ??
                  selectedCandidate
                    .height_centimetres
                    ? `${
                        selectedCandidate.height_cm ??
                        selectedCandidate
                          .height_centimetres
                      } cm`
                    : ""
                }
              />

              <Info label="Hrudník" value={selectedCandidate.chest_cm != null ? `${selectedCandidate.chest_cm} cm` : ""} />
              <Info label="Pas" value={selectedCandidate.waist_cm != null ? `${selectedCandidate.waist_cm} cm` : ""} />
              <Info label="Boky" value={selectedCandidate.hips_cm != null ? `${selectedCandidate.hips_cm} cm` : ""} />
              <Info label="Vnitřní délka nohy" value={selectedCandidate.inseam_cm != null ? `${selectedCandidate.inseam_cm} cm` : ""} />
              <Info label="Velikost bot" value={selectedCandidate.shoe_size != null ? String(selectedCandidate.shoe_size) : ""} />

              <Info
                label="Zkušenosti"
                value={
                  selectedCandidate.experience
                }
              />

              <Info
                label="Dostupnost"
                value={
                  selectedCandidate.availability
                }
              />

              <Info
                label="Status"
                value={
                  selectedCandidate.status
                }
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailPhoto({
  photo,
  index,
}: {
  photo: PhotoItem;
  index: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "220px",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#181818",
        border: "1px solid #292929",
      }}
    >
      {!loaded && !failed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            fontSize: "14px",
          }}
        >
          Načítám fotografii…
        </div>
      )}

      {failed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
            fontSize: "14px",
            padding: "15px",
            textAlign: "center",
          }}
        >
          Fotografie se nepodařila načíst
        </div>
      )}

      {!failed && (
        <img
          src={photo.originalUrl}
          alt={`Fotografie ${index + 1}`}
          loading={index < 2 ? "eager" : "lazy"}
          fetchPriority={
            index === 0 ? "high" : "auto"
          }
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 160ms ease",
          }}
        />
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  onClick,
  priority,
}: {
  candidate: Candidate;
  onClick: () => void;
  priority: boolean;
}) {
  const [photo, setPhoto] = useState("");
  const [originalPhoto, setOriginalPhoto] = useState("");
  const [photoLoading, setPhotoLoading] = useState(true);

  useEffect(() => {
    loadPhoto();
  }, [candidate.id]);

  async function loadPhoto() {
    const supabase = getSupabase();
    setPhotoLoading(true);

    // Prefer the exact path stored with the candidate.
    const storedPath = (candidate.photo_paths || [])
      .find(isImagePath);

    if (storedPath) {
      const original = getOriginalPhotoUrl(
        supabase,
        storedPath
      );

      setOriginalPhoto(original);
      setPhoto(
        getFastPhotoUrl(
          supabase,
          storedPath,
          360,
          270
        )
      );
      return;
    }

    // Legacy profiles: find their files directly in Storage.
    let files:
      | { name: string }[]
      | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } =
        await supabase.storage
          .from("fotky-hercu")
          .list(candidate.id, {
            limit: 100,
            sortBy: {
              column: "name",
              order: "asc",
            },
          });

      if (!error && data) {
        files = data;
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 350 * (attempt + 1))
      );
    }

    if (!files) {
      setPhotoLoading(false);
      return;
    }

    const file = files.find((item) =>
      isImagePath(item.name)
    );

    if (!file) {
      setPhotoLoading(false);
      return;
    }

    const path =
      `${candidate.id}/${file.name}`;

    const original = getOriginalPhotoUrl(
      supabase,
      path
    );

    setOriginalPhoto(original);
    setPhoto(
      getFastPhotoUrl(
        supabase,
        path,
        360,
        270
      )
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: "#111",
        border: "1px solid #292929",
        borderRadius: "15px",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt={`${candidate.first_name || ""} ${
            candidate.last_name || ""
          }`}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setPhotoLoading(false)}
          onError={(event) => {
            if (
              originalPhoto &&
              event.currentTarget.src !== originalPhoto
            ) {
              event.currentTarget.src = originalPhoto;
              return;
            }

            setPhotoLoading(false);
          }}
          style={{
            width: "100%",
            height: "300px",
            objectFit: "cover",
            display: "block",
            opacity: photoLoading ? 0.75 : 1,
            transition: "opacity 160ms ease",
          }}
        />
      ) : (
        <div
          style={{
            height: "300px",
            background:
              "linear-gradient(110deg, #181818 30%, #222 45%, #181818 60%)",
            backgroundSize: "200% 100%",
            animation: "photoSkeleton 1.2s linear infinite",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#777",
          }}
        >
          {photoLoading
            ? "Načítám fotografii…"
            : "Bez fotografie"}
        </div>
      )}

      <div style={{ padding: "15px" }}>
        <h3 style={{ margin: "0 0 8px" }}>
          {candidate.first_name}{" "}
          {candidate.last_name}
        </h3>

        <p style={cardText}>
          Věk: {candidate.age || "-"}
        </p>

        <p style={cardText}>
          Pohlaví:{" "}
          {getGenderLabel(candidate.gender)}
        </p>

        <p style={cardText}>
          Kraj: {candidate.kraj || "-"}
        </p>

        <p style={cardText}>
          Město: {candidate.city || "-"}
        </p>

        <p style={cardText}>
          Role: {candidate.role || "-"}
        </p>

        <p
          style={{
            marginTop: "14px",
            fontWeight: "bold",
          }}
        >
          <span style={{color:"#a77a22"}}>Zobrazit detail →</span>
        </p>
      </div>
    </div>
  );
}

function getGenderLabel(
  value: string | null | undefined
) {
  const genderValue =
    (value || "").trim().toLowerCase();

  if (genderValue === "female") {
    return "Žena / dívka";
  }

  if (genderValue === "male") {
    return "Muž / chlapec";
  }

  return value || "Neuvedeno";
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div
      style={{
        background: "#181818",
        border: "1px solid #292929",
        padding: "12px",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#888",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: "500",
          wordBreak: "break-word",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#181818",
  color: "#fff",
  fontSize: "14px",
};

const buttonStyle = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "1px solid #444",
  background: "#fff",
  color: "#000",
  cursor: "pointer",
  fontWeight: "600",
};

const cardText = {
  margin: "4px 0",
  color: "#786c56",
};

const photoSkeletonStyle = {
  "@keyframes photoSkeleton": {
    "0%": { backgroundPosition: "200% 0" },
    "100%": { backgroundPosition: "-200% 0" },
  },
};
