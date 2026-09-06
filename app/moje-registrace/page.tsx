"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Candidate = {
  id: string;
  edit_token: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string;
  city: string;
  phone: string;
  email: string;
  role: string;
  height_cm: number | null;
  experience: string;
  availability: string;
  photo_paths: string[] | null;
};

export default function MojeRegistrace() {
  const [token, setToken] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    age: "",
    gender: "",
    city: "",
    phone: "",
    email: "",
    role: "",
    height_cm: "",
    experience: "",
    availability: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editToken = params.get("token");

    if (!editToken) {
      setError("Chybí odkaz k registraci.");
      setLoading(false);
      return;
    }

    setToken(editToken);
    loadCandidate(editToken);
  }, []);

  async function loadCandidate(editToken: string) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?edit_token=eq.${encodeURIComponent(
          editToken
        )}&select=*`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setError("Registrace nebyla nalezena.");
        setLoading(false);
        return;
      }

      const item = data[0] as Candidate;

      setCandidate(item);

      setForm({
        first_name: item.first_name || "",
        last_name: item.last_name || "",
        age:
          item.age !== null && item.age !== undefined
            ? String(item.age)
            : "",
        gender: item.gender || "",
        city: item.city || "",
        phone: item.phone || "",
        email: item.email || "",
        role: item.role || "",
        height_cm:
          item.height_cm !== null &&
          item.height_cm !== undefined
            ? String(item.height_cm)
            : "",
        experience: item.experience || "",
        availability: item.availability || "",
      });

      setPhotos(item.photo_paths || []);
    } catch (err) {
      console.error(err);
      setError("Registraci se nepodařilo načíst.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: string,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function save() {
    if (!candidate || !token) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?edit_token=eq.${encodeURIComponent(
          token
        )}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            age: form.age ? Number(form.age) : null,
            gender: form.gender,
            city: form.city,
            phone: form.phone,
            email: form.email,
            role: form.role,
            height_cm: form.height_cm
              ? Number(form.height_cm)
              : null,
            experience: form.experience,
            availability: form.availability,
            photo_paths: photos,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setMessage("Změny byly úspěšně uloženy.");
    } catch (err) {
      console.error(err);
      setError("Změny se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  function handleNewPhotos(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(
        `Můžeš mít maximálně ${MAX_PHOTOS} fotografií.`
      );
      return;
    }

    const invalid = files.find(
      (file) =>
        !file.type.startsWith("image/") ||
        file.size > MAX_FILE_SIZE
    );

    if (invalid) {
      setError(
        "Každá fotografie musí být obrázek do 10 MB."
      );
      return;
    }

    setError("");
    setNewPhotos(files);
  }

  async function uploadNewPhotos() {
    if (!candidate || !token || newPhotos.length === 0) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const uploadedPaths = [...photos];

      for (let i = 0; i < newPhotos.length; i++) {
        const file = newPhotos[i];

        const ext = file.name.includes(".")
          ? file.name.split(".").pop()
          : "jpg";

        const cleanName = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "-");

        const path =
          `${candidate.id}/${Date.now()}-${i}-${cleanName}.${ext}`;

        const response = await fetch(
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

        if (!response.ok) {
          throw new Error(await response.text());
        }

        uploadedPaths.push(path);
      }

      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?edit_token=eq.${encodeURIComponent(
          token
        )}`,
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

      if (!updateResponse.ok) {
        throw new Error(await updateResponse.text());
      }

      setPhotos(uploadedPaths);
      setNewPhotos([]);
      setMessage("Nové fotografie byly přidány.");
    } catch (err) {
      console.error(err);
      setError("Nové fotografie se nepodařilo nahrát.");
    } finally {
      setSaving(false);
    }
  }

  async function savePhotos() {
    if (!candidate || !token) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?edit_token=eq.${encodeURIComponent(
          token
        )}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            photo_paths: photos,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setMessage("Fotografie byly aktualizovány.");
    } catch (err) {
      console.error(err);
      setError("Fotografie se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      setError(
        "Odkaz se nepodařilo zkopírovat. Podrž ho a zkopíruj ručně."
      );
    }
  }

  function getPhotoUrl(path: string) {
    return `${SUPABASE_URL}/storage/v1/object/public/fotky-hercu/${path}`;
  }

  if (loading) {
    return (
      <main className="section">
        <div className="card">
          Načítám registraci...
        </div>
      </main>
    );
  }

  if (!candidate) {
    return (
      <main className="section">
        <div className="card">
          <h1>Moje registrace</h1>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <Link
            href="/registrace"
            className="btn primary"
          >
            Nová registrace
          </Link>
        </div>
      </main>
    );
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
            maxWidth: 900,
            margin: "auto",
          }}
        >
          <div className="eyebrow">
            MOJE REGISTRACE
          </div>

          <h1>Upravit registraci</h1>

          <p className="muted">
            Tady můžeš kdykoliv upravit své údaje a
            fotografie.
          </p>

          {message && (
            <div className="success">
              {message}
            </div>
          )}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <div className="grid">
            <div className="field">
              <label>Jméno</label>
              <input
                value={form.first_name}
                onChange={(e) =>
                  updateField(
                    "first_name",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Příjmení</label>
              <input
                value={form.last_name}
                onChange={(e) =>
                  updateField(
                    "last_name",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Věk</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) =>
                  updateField(
                    "age",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Pohlaví</label>
              <select
                value={form.gender}
                onChange={(e) =>
                  updateField(
                    "gender",
                    e.target.value
                  )
                }
              >
                <option value="">Vyberte</option>
                <option value="male">
                  Muž / chlapec
                </option>
                <option value="female">
                  Žena / dívka
                </option>
              </select>
            </div>

            <div className="field">
              <label>Město</label>
              <input
                value={form.city}
                onChange={(e) =>
                  updateField(
                    "city",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Telefon</label>
              <input
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label>Role / typ</label>
              <select
                value={form.role}
                onChange={(e) =>
                  updateField(
                    "role",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Vyberte
                </option>
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
                type="number"
                value={form.height_cm}
                onChange={(e) =>
                  updateField(
                    "height_cm",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label>Zkušenosti</label>
              <textarea
                value={form.experience}
                onChange={(e) =>
                  updateField(
                    "experience",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field full">
              <label>
                Dostupnost / poznámka
              </label>
              <textarea
                value={form.availability}
                onChange={(e) =>
                  updateField(
                    "availability",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <button
            type="button"
            className="btn primary"
            onClick={save}
            disabled={saving}
          >
            {saving
              ? "Ukládám..."
              : "Uložit změny"}
          </button>

          <hr
            style={{
              margin: "35px 0",
            }}
          />

          <h2>Moje fotografie</h2>

          {photos.length === 0 ? (
            <p className="muted">
              Zatím nemáš žádné fotografie.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 15,
                marginTop: 20,
              }}
            >
              {photos.map((path, index) => (
                <div
                  key={path}
                  style={{
                    position: "relative",
                  }}
                >
                  <img
                    src={getPhotoUrl(path)}
                    alt={`Fotografie ${index + 1}`}
                    style={{
                      width: "100%",
                      height: 190,
                      objectFit: "cover",
                      borderRadius: 10,
                      display: "block",
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removePhoto(index)
                    }
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      border: "none",
                      borderRadius: 20,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Smazat
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className="field"
            style={{
              marginTop: 25,
            }}
          >
            <label>
              Přidat nové fotografie
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewPhotos}
            />

            <p className="muted">
              Celkem může být maximálně 5 fotografií.
            </p>
          </div>

          {newPhotos.length > 0 && (
            <button
              type="button"
              className="btn primary"
              onClick={uploadNewPhotos}
              disabled={saving}
            >
              {saving
                ? "Nahrávám..."
                : "Nahrát nové fotografie"}
            </button>
          )}

          {photos.length > 0 && (
            <button
              type="button"
              className="btn"
              onClick={savePhotos}
              disabled={saving}
              style={{
                marginLeft: 10,
              }}
            >
              Uložit změny fotografií
            </button>
          )}

          <hr
            style={{
              margin: "35px 0",
            }}
          />

          <h2>Odkaz na moji registraci</h2>

          <p className="muted">
            Tento odkaz si ulož. Přes něj se kdykoliv
            vrátíš ke své registraci.
          </p>

          <input
            value={window.location.href}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
            style={{
              width: "100%",
              padding: 10,
              marginTop: 10,
            }}
          />

          <button
            type="button"
            className="btn"
            onClick={copyLink}
            style={{
              marginTop: 10,
            }}
          >
            {copied
              ? "✓ Odkaz zkopírován"
              : "📋 Kopírovat odkaz"}
          </button>
        </div>
      </main>
    </>
  );
}
