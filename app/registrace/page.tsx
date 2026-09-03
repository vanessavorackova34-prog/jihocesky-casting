"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../../lib/supabase-browser";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export default function Registration() {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setMsg("");
    setErr("");

    const form = e.currentTarget as HTMLFormElement;
    const f = new FormData(form);

    const photos = f
      .getAll("photos")
      .filter(
        (item): item is File =>
          item instanceof File && item.size > 0
      );

    if (photos.length < 1) {
      setErr("Nahraj prosím alespoň jednu fotografii.");
      return;
    }

    if (photos.length > MAX_PHOTOS) {
      setErr("Můžeš nahrát maximálně 5 fotografií.");
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

    const supabase = supabaseBrowser();

    if (!supabase) {
      setErr("Web zatím není připojený k databázi.");
      return;
    }

    setSending(true);

    try {
      const candidateId = crypto.randomUUID();

      const payload = {
        id: candidateId,
        first_name: f.get("first_name"),
        last_name: f.get("last_name"),
        age: Number(f.get("age")),
        city: f.get("city"),
        phone: f.get("phone"),
        email: f.get("email"),
        role: f.get("role"),
        height_cm: f.get("height_cm")
          ? Number(f.get("height_cm"))
          : null,
        experience: f.get("experience"),
        availability: f.get("availability"),
      };

      const { error } = await supabase
        .from("candidates")
        .insert(payload);

      if (error) {
        setErr("Registraci se nepodařilo odeslat.");
        return;
      }

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];

        const ext = file.name.includes(".")
          ? file.name.split(".").pop()
          : "jpg";

        const base =
          safeFileName(file.name.replace(/\.[^.]+$/, "")) ||
          `foto-${i + 1}`;

        const path =
          `${candidateId}/${Date.now()}-${i + 1}-${base}.${ext}`;

        const { error: uploadError } =
          await supabase.storage
            .from("fotky-hercu")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });

        if (uploadError) {
          setErr(
            "Profil byl uložen, ale některou fotografii se nepodařilo nahrát."
          );
          return;
        }
      }

      setMsg(
        "Registrace včetně fotografií byla odeslána. Profil nyní čeká na schválení."
      );

      form.reset();
    } finally {
      setSending(false);
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
          style={{ maxWidth: 850, margin: "auto" }}
        >
          <div className="eyebrow">
            REGISTRACE DO CASTINGU
          </div>

          <h1>Přihlaš svůj profil</h1>

          <p className="muted">
            Vyplň údaje pravdivě. Profil bude nejdříve
            zkontrolován pořadatelem.
          </p>

          {msg && <div className="success">{msg}</div>}
          {err && <div className="error">{err}</div>}

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
                <label>Město</label>
                <input name="city" />
              </div>

              <div className="field">
                <label>Telefon</label>
                <input name="phone" />
              </div>

              <div className="field">
                <label>E-mail</label>
                <input name="email" type="email" />
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

              <div className="field full">
                <label>Zkušenosti</label>
                <textarea
                  name="experience"
                  placeholder="Herectví, divadlo, film, reklama, modeling…"
                />
              </div>

              <div className="field full">
                <label>Dostupnost / poznámka</label>
                <textarea name="availability" />
              </div>

              <div className="field full">
                <label>Fotografie * (1–5)</label>

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
                  Nahraj portrét, celou postavu a případně
                  další aktuální fotografie. Maximálně 5
                  fotografií, 10 MB každá.
                </div>
              </div>

            </div>

            <p
              className="muted"
              style={{ fontSize: 12 }}
            >
              Odesláním formuláře souhlasíš se zpracováním
              údajů a fotografií pro účely castingu.
            </p>

            <button
              className="btn primary"
              disabled={sending}
            >
              {sending
                ? "Odesílám registraci a fotografie…"
                : "Odeslat registraci"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
