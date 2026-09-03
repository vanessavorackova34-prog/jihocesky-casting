"use client";

import { useState } from "react";

export default function Home() {
  const [photos, setPhotos] = useState<File[]>([]);

  return (
    <main style={{ maxWidth: 600, margin: "50px auto", padding: 20 }}>
      <h1>Jihočeský casting</h1>

      <p>Registrace na casting</p>

      <form>
        <input
          type="text"
          placeholder="Jméno a příjmení"
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
          }}
        />

        <input
          type="email"
          placeholder="E-mail"
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 15,
          }}
        />

        <label>
          <strong>Nahraj fotografie</strong>
        </label>

        <p>Vyber 1 až 5 fotografií.</p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []).slice(0, 5);
            setPhotos(files);
          }}
        />

        {photos.length > 0 && (
          <p>Vybráno fotografií: {photos.length}</p>
        )}

        <button
          type="submit"
          style={{
            marginTop: 20,
            padding: "12px 25px",
            cursor: "pointer",
          }}
        >
          Odeslat registraci
        </button>
      </form>
    </main>
  );
}
