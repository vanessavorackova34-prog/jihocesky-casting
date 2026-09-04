"use client";

import { useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function Registrace() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setError("Web není správně připojený k databázi.");
      return;
    }

    if (!files || files.length < 1 || files.length > 5) {
      setError("Vyber 1 až 5 fotografií.");
      return;
    }

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Všechny soubory musí být fotografie.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError("Každá fotografie může mít maximálně 10 MB.");
        return;
      }
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    setSending(true);

    try {
      const candidateId = crypto.randomUUID();

      const candidate = {
        id: candidateId,
        first_name: String(data.get("first_name") || ""),
        last_name: String(data.get("last_name") || ""),
        age: Number(data.get("age")),
        height_cm: Number(data.get("height")),
        email: String(data.get("email") || ""),
        experience: String(data.get("about") || ""),
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
          body: JSON.stringify(candidate),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";

        const path = `${candidateId}/${i + 1}.${extension}`;

        const upload = await fetch(
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

        if (!upload.ok) {
          const text = await upload.text();
          throw new Error(text);
        }
      }

      setMessage(
        "Registrace včetně fotografií byla úspěšně odeslána."
      );

      form.reset();
      setFiles(null);
    } catch (err) {
      console.error(err);
      setError(
        "Registraci se nepodařilo odeslat. Zkus to prosím znovu."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <h1>Jihočeský casting</h1>
      <h2>Registrace</h2>

      {message && (
        <p style={{ padding: 12, border: "1px solid green" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ padding: 12, border: "1px solid red" }}>
          {error}
        </p>
      )}

      <form onSubmit={submit}>
        <label>Jméno</label>
        <input
          type="text"
          name="first_name"
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 20px",
          }}
        />

        <label>Příjmení</label>
        <input
          type="text"
          name="last_name"
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 20px",
          }}
        />

        <label>Věk</label>
        <input
          type="number"
          name="age"
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 20px",
          }}
        />

        <label>Výška (cm)</label>
        <input
          type="number"
          name="height"
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 20px",
          }}
        />

        <label>E-mail</label>
        <input
          type="email"
          name="email"
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 20px",
          }}
        />

        <label>Něco o sobě</label>
        <textarea
          name="about"
          rows={5}
          required
          style={{
            width: "100%",
            padding: 12,
            margin: "8px 0 20px",
          }}
        />

        <label>Fotografie (1–5 fotek)</label>

        <input
          type="file"
          accept="image/*"
          multiple
          required
          onChange={(e) => setFiles(e.target.files)}
          style={{
            display: "block",
            margin: "10px 0 20px",
          }}
        />

        {files && (
          <p>
            Vybráno fotek: {files.length} / 5
          </p>
        )}

        <button
          type="submit"
          disabled={sending}
          style={{
            width: "100%",
            padding: 14,
            fontSize: 16,
            cursor: sending ? "wait" : "pointer",
          }}
        >
          {sending ? "Odesílám..." : "Odeslat registraci"}
        </button>
      </form>
    </main>
  );
}
