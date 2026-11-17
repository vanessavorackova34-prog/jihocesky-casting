"use client";

import { useState } from "react";
import Link from "next/link";
import { regions, getCitiesForRegion } from "../../lib/locations";
import { europeanCountries } from "../../lib/countries";

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

  const [selectedCountry, setSelectedCountry] = useState("Česká republika");
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
        "Please upload between one and five photos."
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
        "Photos must be images, each no larger than 10 MB."
      );
      return;
    }

    if ((selectedCountry === "Česká republika" || selectedCountry === "Slovensko") && !selectedRegion) {
      setErr("Please select a region.");
      return;
    }

    if (!selectedCity.trim()) {
      setErr("Please select a city.");
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
        country: selectedCountry,
        kraj: (selectedCountry === "Česká republika" || selectedCountry === "Slovensko") ? f.get("kraj") : null,
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
        "Your registration and photos have been submitted."
      );
      setMyLink(link);

      form.reset();
      setSelectedCountry("Česká republika");
      setSelectedRegion("");
      setSelectedCity("");
    } catch (error) {
      console.error(error);
      setErr(
        "Registration failed. Please try again."
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
          🎬 <span>LEXAPA CASTING</span>
        </div>

        <Link className="btn" href="/">
          Back
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
            CASTING REGISTRATION
          </div>

          <h1>Register your profile</h1>

          <p className="muted">
            Please provide accurate details. Your profile will first be
            reviewed by our casting team.
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

          <div style={{display:"flex",justifyContent:"flex-end",gap:12,marginBottom:16}}><Link href="/registrace">🇨🇿 CZ</Link><strong>🇬🇧 EN</strong></div>
          <form onSubmit={submit}>
            <div className="grid">
              <div className="field">
                <label>First name *</label>
                <input name="first_name" required />
              </div>

              <div className="field">
                <label>Last name *</label>
                <input name="last_name" required />
              </div>

              <div className="field">
                <label>Age *</label>
                <input
                  name="age"
                  type="number"
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div className="field">
                <label>Gender *</label>
                <select name="gender" required>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="field">
                <label>Country of residence *</label>
                <select name="country" value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setSelectedRegion(""); setSelectedCity(""); }} required>
                  {europeanCountries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
              {(selectedCountry === "Česká republika" || selectedCountry === "Slovensko") && (
                <div className="field">
                  <label>Region *</label>
                  <select name="kraj" value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setSelectedCity(""); }} required>
                    <option value="">Select kraj</option>
                    {regions.filter((region) => selectedCountry === "Slovensko" ? region.includes("(Slovensko)") : !region.includes("(Slovensko)")).map((region) => <option key={region} value={region}>{region}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <label>City *</label>
                {(selectedCountry === "Česká republika" || selectedCountry === "Slovensko") ? (
                  <select name="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedRegion} required>
                    <option value="">{selectedRegion ? "Select město" : "Select a region first"}</option>
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                ) : (
                  <input name="city" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} placeholder="Enter your city" required maxLength={120} />
                )}
              </div>

              <div className="field">
                <label>Phone</label>
                <input name="phone" />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                />
              </div>

              <div className="field">
                <label>Role / type *</label>
                <select name="role">
                  <option>Actor</option>
                  <option>Background actor</option>
                  <option>Extra</option>
                  <option>Model</option>
                  <option>Stunt performer</option>
                  <option>Film crew</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="field">
                <label>Height (cm)</label>
                <input
                  name="height_cm"
                  type="number"
                />
              </div>

              <div className="field">
                <label>Chest (cm)</label>
                <input name="chest_cm" type="number" min="30" max="200" />
              </div>

              <div className="field">
                <label>Waist (cm)</label>
                <input name="waist_cm" type="number" min="30" max="200" />
              </div>

              <div className="field">
                <label>Hips (cm)</label>
                <input name="hips_cm" type="number" min="30" max="200" />
              </div>

              <div className="field">
                <label>Inseam (cm)</label>
                <input name="inseam_cm" type="number" min="20" max="140" />
              </div>

              <div className="field">
                <label>Shoe size (EU)</label>
                <input name="shoe_size" type="number" min="15" max="55" step="0.5" />
              </div>

              <div className="field">
                <label>Driving licence</label>
                <select name="has_driving_license" defaultValue="no"><option value="no">No</option><option value="yes">Yes</option></select>
              </div>
              <div className="field">
                <label>Own car</label>
                <select name="has_own_car" defaultValue="no"><option value="no">No</option><option value="yes">Yes</option></select>
              </div>
              <div className="field"><label>Clothing size</label><input name="clothing_size" placeholder="např. M / 38" /></div>
              <div className="field"><label>Trouser size</label><input name="trouser_size" placeholder="např. 32 / 40" /></div>
              <div className="field"><label>Head circumference (cm)</label><input name="head_cm" type="number" min="30" max="80" step="0.5" /></div>
              <div className="field full"><label>Languages</label><input name="languages" placeholder="např. angličtina, němčina, italština" /></div>
              <div className="field full"><label>Skills</label><textarea name="skills" placeholder="Např. jízda na koni, tanec, zpěv, plavání, bojové sporty, hudební nástroje..." /></div>

              <div className="field full">
                <label>Experience</label>

                <textarea
                  name="experience"
                  placeholder="Herectví, divadlo, film, reklama, modeling..."
                />
              </div>

              <div className="field full">
                <label>Availability / notes</label>

                <textarea name="availability" />
              </div>

              <div className="field full">
                <label>Would you like a professional profile photo session for CZK 600?</label>
                <select name="professional_photoshoot_interest" defaultValue="">
                  <option value="">Select možnost</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="field full">
                <label>Photos * (1–5)</label>

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
                  Up to 5 photos, 10 MB each. Photos are optimized automatically before upload.
                </div>
              </div>
            </div>

            <button
              className="btn primary"
              type="submit"
              disabled={sending}
            >
              {sending
                ? "Submitting registration and photos..."
                : "Submit registration"}
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
                  Registration submitted successfully
                </strong>

                <p>
                  Save this link. You can use it later
                  to access your registration.
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
                    My registration
                  </a>

                  <button
                    type="button"
                    className="btn"
                    onClick={copyLink}
                  >
                    {copied
                      ? "✓ Link copied"
                      : "📋 Copy link"}
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
