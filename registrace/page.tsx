"use client";

import { useState } from "react";

export default function Registrace() {
  const [files, setFiles] = useState<FileList | null>(null);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1>Jihočeský casting</h1>
      <h2>Registrace</h2>

      <form>
        <label>Jméno a příjmení</label>
        <input
          type="text"
          name="name"
          required
          style={{ width: "100%", padding: 12, margin: "8px 0 20px" }}
        />

        <label>Věk</label>
        <input
          type="number"
          name="age"
          required
          style={{ width: "100%", padding: 12, margin: "8px 0 20px" }}
        />

        <label>Výška (cm)</label>
        <input
          type="number"
          name="height"
          required
          style={{ width: "100%", padding: 12, margin: "8px 0 20px" }}
        />

        <label>E-mail</label>
        <input
          type="email"
          name="email"
          required
          style={{ width: "100%", padding: 12, margin: "8px 0 20px" }}
        />

        <label>Něco o sobě</label>
        <textarea
          name="about"
          rows={5}
          required
          style={{ width: "100%", padding: 12, margin: "8px 0 20px" }}
        />

        <label>Fotografie (1–5 fotek)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          required
          onChange={(e) => setFiles(e.target.files)}
          style={{ display: "block", margin: "10px 0 20px" }}
        />

        {files && (
          <p>
            Vybráno fotek: {files.length} / 5
          </p>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 14,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Odeslat registraci
        </button>
      </form>
    </main>
  );
}
