"use client";

import { useState } from "react";
import Link from "next/link";
import { regions, getCitiesForRegion } from "../../lib/locations";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

const MAX_IMAGE_EDGE = 1800;
const JPEG_QUALITY = 0.82;

async function optimizePhoto(file: File, index: number) {
  // SVG/GIF necháváme beze změny. U ostatních fotek se pokusíme
  // o převod do úsporného JPEG, aby se databáze načítala rychle.
  if (
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(
        new Error("Fotografii se nepodařilo načíst.")
      );
      image.src = objectUrl;
    });

    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;

    if (!sourceWidth || !sourceHeight) {
      return file;
    }

    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight)
    );

    const width = Math.max(
      1,
      Math.round(sourceWidth * scale)
    );
    const height = Math.max(
      1,
      Math.round(sourceHeight * scale)
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", {
      alpha: false,
    });

    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(
        resolve,
        "image/jpeg",
        JPEG_QUALITY
      )
    );

    if (!blob) return file;

    // Pokud by převod výjimečně vytvořil větší soubor, ponecháme originál.
    if (
      blob.size >= file.size &&
      file.type !== "image/heic" &&
      file.type !== "image/heif"
    ) {
      return file;
    }

    const base =
      safeFileName(
        file.name.replace(/\.[^.]+$/, "")
      ) || `foto-${index + 1}`;

    return new File(
      [blob],
      `${base}.jpg`,
      {
        type: "image/jpeg",
        lastModified: Date.now(),
      }
    );
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function Registration() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [myLink, setMyLink] = useState("");
  const [copied, setCopied] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const cities = getCitiesForRegion(selectedRegion);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMsg("");
    setErr("");
    setMyLink("");
    setCopied(false);

    const form = e.currentTarget;
    const f = new FormData(form);

    const photos = f.getAll("photos").filter(
      (item): item is File =>
        item instanceof File && item.size > 0
    );

    if (photos.length < 1 || photos.length > MAX_PHOTOS) {
      setErr(
        "Nahraj prosím alespoň jednu a maximálně pět fotografií."
      );
      return;
    }

    const invalid = photos.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > MAX_FILE_SIZE
    );

    if (invalid) {
      setErr(
        "Fotografie musí být obrázky a každá může mít maximálně 10 MB."
      );
      return;
    }

    if (!selectedRegion) {
      setErr("Vyber prosím kraj.");
      return;
    }

    if (!selectedCity) {
      setErr("Vyber prosím město.");
      return;
    }

    setSending(true);

    try {
      const candidateId = crypto.randomUUID();
      const editToken = crypto.randomUUID();

      const payload = {
        id: candidateId,
        edit_token: editToken,
        first_name: f.get("first_name"),
        last_name: f.get("last_name"),
        age: Number(f.get("age")),
        gender: f.get("gender"),
        kraj: f.get("kraj"),
        city: f.get("city"),
        phone: f.get("phone"),
        email: f.get("email"),
        role: f.get("role"),
        height_cm: f.get("height_cm") ? Number(f.get("height_cm")) : null,
        chest_cm: f.get("chest_cm") ? Number(f.get("chest_cm")) : null,
        waist_cm: f.get("waist_cm") ? Number(f.get("waist_cm")) : null,
        hips_cm: f.get("hips_cm") ? Number(f.get("hips_cm")) : null,
        inseam_cm: f.get("inseam_cm") ? Number(f.get("inseam_cm")) : null,
        shoe_size: f.get("shoe_size") ? Number(f.get("shoe_size")) : null,
        has_driving_license: f.get("has_driving_license") === "yes",
        has_own_car: f.get("has_own_car") === "yes",
        clothing_size: f.get("clothing_size") || null,
        trouser_size: f.get("trouser_size") || null,
        head_cm: f.get("head_cm") ? Number(f.get("head_cm")) : null,
        languages: f.get("languages") || null,
        skills: f.get("skills") || null,
        experience: f.get("experience"),
        availability: f.get("availability"),
        professional_photoshoot_interest:
          f.get("professional_photoshoot_interest") === "yes"
            ? true
            : f.get("professional_photoshoot_interest") === "no"
              ? false
              : null,
        photo_paths: [],
      };

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const uploadedPaths: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const file = await optimizePhoto(
          photos[i],
          i
        );

        const ext = file.name.includes(".")
          ? file.name.split(".").pop()
          : "jpg";

        const base =
          safeFileName(
            file.name.replace(/\.[^.]+$/, "")
          ) || `foto-${i + 1}`;

        const path =
          `${candidateId}/${Date.now()}-${i + 1}-${base}.${ext}`;

        const uploadResponse = await fetch(
          `${SUPABASE_URL}/storage/v1/object/fotky-hercu/${path}`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": file.type,
            },
            body: file,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(await uploadResponse.text());
        }

        uploadedPaths.push(path);
      }

      await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?id=eq.${candidateId}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            photo_paths: uploadedPaths,
          }),
        }
      );

      const link =
        `${window.location.origin}/moje-registrace?token=${editToken}`;

      setMsg(
        "Registrace včetně fotografií byla úspěšně odeslána."
      );
      setMyLink(link);

      form.reset();
      setSelectedRegion("");
      setSelectedCity("");
    } catch (error) {
      console.error(error);
      setErr(
        "Registraci se nepodařilo odeslat. Zkus to prosím znovu."
      );
    } finally {
      setSending(false);
    }
  }

  async function copyLink() {
    if (!myLink) return;

    try {
      await navigator.clipboard.writeText(myLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      setErr(
        "Odkaz se nepodařilo zkopírovat. Podrž odkaz a zkopíruj ho ručně."
      );
    }
  }

  return (
    <>
      <header className="top">
        <div className="logo">
          🎬 <span>JIHOČESKÝ CASTING</span>
        </div>

        <Link className="btn" href="/">
          Zpět
        </Link>
      </header>

      <main className="section">
        <div
          className="card"
          style={{
            maxWidth: 850,
            margin: "auto",
          }}
        >
          <div className="eyebrow">
            REGISTRACE DO CASTINGU
          </div>

          <h1>Přihlaš svůj profil</h1>

          <p className="muted">
            Vyplň údaje pravdivě. Profil bude nejdříve
            zkontrolován pořadatelem.
          </p>

          {msg && (
            <div className="success">
              {msg}
            </div>
          )}

          {err && (
            <div className="error">
              {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="grid">
              <div className="field">
                <label>Jméno *</label>
                <input name="first_name" required />
              </div>

              <div className="field">
                <label>Příjmení *</label>
                <input name="last_name" required />
              </div>

              <div className="field">
                <label>Věk *</label>
                <input
                  name="age"
                  type="number"
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div className="field">
                <label>Pohlaví *</label>
                <select name="gender" required>
                  <option value="">Vyberte</option>
                  <option value="male">Muž / chlapec</option>
                  <option value="female">Žena / dívka</option>
                </select>
              </div>

              <div className="field">
                <label>Kraj *</label>

                <select
                  name="kraj"
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedCity("");
                  }}
                  required
                >
                  <option value="">Vyberte kraj</option>

                  {regions.map((region) => (
                    <option
                      key={region}
                      value={region}
                    >
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Město *</label>

                <select
                  name="city"
                  value={selectedCity}
                  onChange={(e) =>
                    setSelectedCity(e.target.value)
                  }
                  disabled={!selectedRegion}
                  required
                >
                  <option value="">
                    {selectedRegion
                      ? "Vyberte město"
                      : "Nejdříve vyberte kraj"}
                  </option>

                  {cities.map((city) => (
                    <option
                      key={city}
                      value={city}
                    >
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Telefon</label>
                <input name="phone" />
              </div>

              <div className="field">
                <label>E-mail</label>
                <input
                  name="email"
                  type="email"
                />
              </div>

              <div className="field">
                <label>Role / typ *</label>
                <select name="role">
                  <option>Herec / herečka</option>
                  <option>Komparz</option>
                  <option>Statista</option>
                  <option>Model / modelka</option>
                  <option>Kaskadér</option>
                  <option>Filmový štáb</option>
                  <option>Jiné</option>
                </select>
              </div>

              <div className="field">
                <label>Výška (cm)</label>
                <input
                  name="height_cm"
                  type="number"
                />
              </div>

              <div className="field">
                <label>Obvod hrudníku (cm)</label>
                <input name="chest_cm" type="number" min="30" max="200" />
              </div>

              <div className="field">
                <label>Obvod pasu (cm)</label>
                <input name="waist_cm" type="number" min="30" max="200" />
              </div>

              <div className="field">
                <label>Obvod boků (cm)</label>
                <input name="hips_cm" type="number" min="30" max="200" />
              </div>

              <div className="field">
                <label>Vnitřní délka nohy (cm)</label>
                <input name="inseam_cm" type="number" min="20" max="140" />
              </div>

              <div className="field">
                <label>Velikost bot (EU)</label>
                <input name="shoe_size" type="number" min="15" max="55" step="0.5" />
              </div>

              <div className="field">
                <label>Řidičský průkaz</label>
                <select name="has_driving_license" defaultValue="no"><option value="no">Ne</option><option value="yes">Ano</option></select>
              </div>
              <div className="field">
                <label>Vlastní auto</label>
                <select name="has_own_car" defaultValue="no"><option value="no">Ne</option><option value="yes">Ano</option></select>
              </div>
              <div className="field"><label>Konfekční velikost</label><input name="clothing_size" placeholder="např. M / 38" /></div>
              <div className="field"><label>Velikost kalhot</label><input name="trouser_size" placeholder="např. 32 / 40" /></div>
              <div className="field"><label>Obvod hlavy (cm)</label><input name="head_cm" type="number" min="30" max="80" step="0.5" /></div>
              <div className="field full"><label>Jazyky</label><input name="languages" placeholder="např. angličtina, němčina, italština" /></div>
              <div className="field full"><label>Dovednosti</label><textarea name="skills" placeholder="Např. jízda na koni, tanec, zpěv, plavání, bojové sporty, hudební nástroje..." /></div>

              <div className="field full">
                <label>Zkušenosti</label>

                <textarea
                  name="experience"
                  placeholder="Herectví, divadlo, film, reklama, modeling..."
                />
              </div>

              <div className="field full">
                <label>Dostupnost / poznámka</label>

                <textarea name="availability" />
              </div>

              <div className="field full">
                <label>Máte zájem o profesionální přefocení do databáze LEXAPA CASTING za 600 Kč?</label>
                <select name="professional_photoshoot_interest" defaultValue="">
                  <option value="">Vyberte možnost</option>
                  <option value="yes">Ano</option>
                  <option value="no">Ne</option>
                </select>
              </div>

              <div className="field full">
                <label>Fotografie * (1-5)</label>

                <input
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  required
                />

                <div
                  className="muted"
                  style={{
                    fontSize: 12,
                    marginTop: 6,
                  }}
                >
                  Max. 5 fotografií, 10 MB každá. Před odesláním se fotografie automaticky optimalizují pro rychlé a kvalitní zobrazení.
                </div>
              </div>
            </div>

            <button
              className="btn primary"
              type="submit"
              disabled={sending}
            >
              {sending
                ? "Odesílám registraci a fotografie..."
                : "Odeslat registraci"}
            </button>

            {myLink && (
              <div
                className="success"
                style={{
                  marginTop: 20,
                  padding: 20,
                }}
              >
                <strong>
                  Registrace byla úspěšně odeslána
                </strong>

                <p>
                  Ulož si tento odkaz. Přes něj se později
                  vrátíš ke své registraci.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 15,
                  }}
                >
                  <a
                    href={myLink}
                    className="btn primary"
                    style={{
                      textDecoration: "none",
                    }}
                  >
                    Moje registrace
                  </a>

                  <button
                    type="button"
                    className="btn"
                    onClick={copyLink}
                  >
                    {copied
                      ? "✓ Odkaz zkopírován"
                      : "📋 Kopírovat odkaz"}
                  </button>
                </div>

                <input
                  value={myLink}
                  readOnly
                  onFocus={(e) =>
                    e.currentTarget.select()
                  }
                  style={{
                    width: "100%",
                    marginTop: 15,
                    padding: 10,
                  }}
                />
              </div>
            )}
          </form>
        </div>
      </main>
    </>
  );
}
