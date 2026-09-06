"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function MyRegistration() {
  const [token, setToken] = useState("");
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
      setError("Chybí odkaz na registraci.");
      setLoading(false);
      return;
    }

    setToken(editToken);

    async function loadCandidate() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/candidates?edit_token=eq.${encodeURIComponent(editToken)}&select=*`,
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

        if (!data.length) {
          setError(
            "Registrace nebyla nalezena nebo je odkaz neplatný."
          );
          return;
        }

        const item = data[0];

        setCandidate(item);

        setForm({
          first_name: item.first_name || "",
          last_name: item.last_name || "",
          age: item.age ? String(item.age) : "",
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
      } catch (err) {
        console.error(err);
        setError("Registraci se nepodařilo načíst.");
      } finally {
        setLoading(false);
      }
    }

    loadCandidate();
  }, []);

  function change(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function save() {
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const payload = {
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
      };

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/candidates?edit_token=eq.${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      if (data.length) {
        setCandidate(data[0]);
      }

      setMessage("Změny byly úspěšně uloženy.");
    } catch (err) {
      console.error(err);
      setError(
        "Změny se nepodařilo uložit. Zkus to prosím znovu."
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhotos(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);

    if (!files.length || !candidate) {
      return;
    }

    setError("");
    setMessage("");

    if (files.length > MAX_PHOTOS) {
      setError(
        "Najednou můžeš vybrat maximálně 5 fotografií."
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
        "Fotografie musí být obrázky a každá může mít maximálně 10 MB."
      );
      return;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const ext = file.name.includes(".")
          ? file.name.split(".").pop()
          : "jpg";

        const base =
          safeFileName(
            file.name.replace(/\.[^.]+$/, "")
          ) || `foto-${i + 1}`;

        const path = `${candidate.id}/${Date.now()}-${i + 1}-${base}.${ext}`;

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
      }

      setMessage("Nové fotografie byly úspěšně nahrány.");
    } catch (err) {
      console.error(err);
      setError("Fotografie se nepodařilo nahrát.");
    }

    e.target.value = "";
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          padding: 40,
          textAlign: "center",
        }}
      >
        Načítám registraci...
      </main>
    );
  }

  if (error && !candidate) {
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
              maxWidth: 700,
              margin: "auto",
            }}
          >
            <h1>Moje registrace</h1>

            <div className="error">
              {error}
            </div>
          </div>
        </main>
      </>
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
            maxWidth: 850,
            margin: "auto",
          }}
        >
          <div className="eyebrow">
            MOJE REGISTRACE
          </div>

          <h1>
            {candidate.first_name} {candidate.last_name}
          </h1>

          <p className="muted">
            Zde můžeš upravit údaje své registrace.
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
              <label>Jméno *</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={change}
                required
              />
            </div>

            <div className="field">
              <label>Příjmení *</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={change}
                required
              />
            </div>

            <div className="field">
              <label>Věk *</label>
              <input
                name="age"
                type="number"
                min="1"
                max="100"
                value={form.age}
                onChange={change}
                required
              />
            </div>

            <div className="field">
              <label>Pohlaví *</label>
              <select
                name="gender"
                value={form.gender}
                onChange={change}
                required
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
                name="city"
                value={form.city}
                onChange={change}
              />
            </div>

            <div className="field">
              <label>Telefon</label>
              <input
                name="phone"
                value={form.phone}
                onChange={change}
              />
            </div>

            <div className="field">
              <label>E-mail</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={change}
              />
            </div>

            <div className="field">
              <label>Role / typ *</label>
              <select
                name="role"
                value={form.role}
                onChange={change}
              >
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
                value={form.height_cm}
                onChange={change}
              />
            </div>

            <div className="field full">
              <label>Zkušenosti</label>
              <textarea
                name="experience"
                value={form.experience}
                onChange={change}
              />
            </div>

            <div className="field full">
              <label>Dostupnost / poznámka</label>
              <textarea
                name="availability"
                value={form.availability}
                onChange={change}
              />
            </div>

            <div className="field full">
              <label>Přidat nové fotografie</label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={uploadPhotos}
              />

              <div
                className="muted"
                style={{
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                Maximálně 5 fotografií, každá do 10 MB.
              </div>
            </div>
          </div>

          <button
            className="btn primary"
            type="button"
            onClick={save}
            disabled={saving}
            style={{ marginTop: 20 }}
          >
            {saving
              ? "Ukládám změny..."
              : "Uložit změny"}
          </button>
        </div>
      </main>
    </>
  );
}
