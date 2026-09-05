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
  gender: string | null;
  city: string | null;
  role: string | null;
  height_cm: number | null;
  experience: string | null;
  availability: string | null;
  status: string | null;
};

type CandidateWithPhotos = Candidate & {
  photos: string[];
};

export default function ProdukcePage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<
    CandidateWithPhotos[]
  >([]);

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
      router.push("/produkce/prihlaseni");
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

    const candidatesWithPhotos: CandidateWithPhotos[] = [];

    for (const candidate of data || []) {
      const { data: files, error: filesError } =
        await supabase.storage
          .from("fotky-hercu")
          .list(candidate.id);

      if (filesError) {
        console.error(filesError);
      }

      const photos: string[] = [];

      for (const file of files || []) {
        if (!file.name) continue;

        const { data: signedUrl } =
          await supabase.storage
            .from("fotky-hercu")
            .createSignedUrl(
              `${candidate.id}/${file.name}`,
              60 * 60
            );

        if (signedUrl?.signedUrl) {
          photos.push(signedUrl.signedUrl);
        }
      }

      candidatesWithPhotos.push({
        ...candidate,
        photos,
      });
    }

    setCandidates(candidatesWithPhotos);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/produkce/prihlaseni");
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const candidateRole =
      (candidate.role || "").toLowerCase();

    const candidateGender =
      (candidate.gender || "").toLowerCase();

    const candidateCity =
      (candidate.city || "").toLowerCase();

    const fullName =
      `${candidate.first_name || ""} ${candidate.last_name || ""}`
        .toLowerCase();

    if (
      role &&
      !candidateRole.includes(role.toLowerCase())
    ) {
      return false;
    }

    if (
      gender &&
      candidateGender !== gender.toLowerCase()
    ) {
      return false;
    }

    if (
      ageFrom &&
      Number(candidate.age) < Number(ageFrom)
    ) {
      return false;
    }

    if (
      ageTo &&
      Number(candidate.age) > Number(ageTo)
    ) {
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
            onChange={(e) =>
              setRole(e.target.value)
            }
          >
            <option value="">
              Všechny kategorie
            </option>

            <option value="herec">
              Herec / herečka
            </option>

            <option value="komparz">
              Komparz
            </option>

            <option value="statista">
              Statista
            </option>

            <option value="model">
              Model / modelka
            </option>

            <option value="kaskadér">
              Kaskadér
            </option>
          </select>

          <select
            value={gender}
            onChange={(e) =>
              setGender(e.target.value)
            }
          >
            <option value="">
              Všechna pohlaví
            </option>

            <option value="male">
              Muži / kluci
            </option>

            <option value="female">
              Ženy / dívky
            </option>
          </select>

          <input
            type="number"
            placeholder="Věk od"
            value={ageFrom}
            onChange={(e) =>
              setAgeFrom(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Věk do"
            value={ageTo}
            onChange={(e) =>
              setAgeTo(e.target.value)
            }
          />

          <input
            placeholder="Město"
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
          />

          <input
            placeholder="Hledat podle jména"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <p style={{ marginBottom: 0 }}>
          Nalezeno:{" "}
          <strong>
            {filteredCandidates.length}
          </strong>
        </p>
      </section>

      {loading ? (
        <p>Načítám databázi...</p>
      ) : filteredCandidates.length === 0 ? (
        <p>
          Pro zadané požadavky nebyl nalezen žádný
          schválený profil.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredCandidates.map((candidate) => (
            <article
              key={candidate.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "16px",
                padding: "16px",
                overflow: "hidden",
              }}
            >
              {candidate.photos.length > 0 && (
                <div>
                  <img
                    src={candidate.photos[0]}
                    alt={`${candidate.first_name} ${candidate.last_name}`}
                    style={{
                      width: "100%",
                      height: "300px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      display: "block",
                    }}
                  />

                  {candidate.photos.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginTop: "8px",
                        overflowX: "auto",
                      }}
                    >
                      {candidate.photos
                        .slice(1)
                        .map((photo, index) => (
                          <img
                            key={photo}
                            src={photo}
                            alt={`Fotografie ${
                              index + 2
                            }`}
                            style={{
                              width: "60px",
                              height: "60px",
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              <h2>
                {candidate.first_name}{" "}
                {candidate.last_name}
              </h2>

              <p>
                <strong>Věk:</strong>{" "}
                {candidate.age ?? "Neuvedeno"}
              </p>

              <p>
                <strong>Pohlaví:</strong>{" "}
                {candidate.gender === "male"
                  ? "Muž / chlapec"
                  : candidate.gender === "female"
                  ? "Žena / dívka"
                  : "Neuvedeno"}
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
