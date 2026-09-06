"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export default function MyRegistration() {
  const [token, setToken] = useState("");
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        if (!data.length) {
          setError(
            "Registrace nebyla nalezena nebo je odkaz neplatný."
          );
          return;
        }

        setCandidate(data[0]);
      } catch (err) {
        console.error(err);
        setError(
          "Registraci se nepodařilo načíst."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCandidate();
  }, []);

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

  if (error) {
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
            {candidate.first_name}{" "}
            {candidate.last_name}
          </h1>

          <p className="muted">
            Tady uvidíš údaje své registrace.
          </p>

          <div className="grid">
            <div className="field">
              <label>Jméno</label>
              <input
                value={candidate.first_name || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>Příjmení</label>
              <input
                value={candidate.last_name || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>Věk</label>
              <input
                value={candidate.age || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>Pohlaví</label>
              <input
                value={
                  candidate.gender === "male"
                    ? "Muž / chlapec"
                    : candidate.gender === "female"
                    ? "Žena / dívka"
                    : candidate.gender || ""
                }
                readOnly
              />
            </div>

            <div className="field">
              <label>Město</label>
              <input
                value={candidate.city || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>Telefon</label>
              <input
                value={candidate.phone || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>E-mail</label>
              <input
                value={candidate.email || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>Role / typ</label>
              <input
                value={candidate.role || ""}
                readOnly
              />
            </div>

            <div className="field">
              <label>Výška (cm)</label>
              <input
                value={candidate.height_cm || ""}
                readOnly
              />
            </div>

            <div className="field full">
              <label>Zkušenosti</label>

              <textarea
                value={candidate.experience || ""}
                readOnly
              />
            </div>

            <div className="field full">
              <label>
                Dostupnost / poznámka
              </label>

              <textarea
                value={candidate.availability || ""}
                readOnly
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 30,
              padding: 20,
              border: "1px solid #333",
              borderRadius: 12,
            }}
          >
            <strong>Status registrace:</strong>

            <div style={{ marginTop: 8 }}>
              {candidate.status || "Čeká na schválení"}
            </div>
          </div>

          <div
            style={{
              marginTop: 25,
              padding: 20,
              border: "1px solid #333",
              borderRadius: 12,
            }}
          >
            <strong>Fotografie</strong>

            <p className="muted">
              Fotografie jsou uložené u tvé registrace.
              Možnost jejich úpravy doplníme v dalším kroku.
            </p>
          </div>

          <div
            style={{
              marginTop: 30,
              textAlign: "center",
            }}
          >
            <button
              className="btn primary"
              type="button"
              onClick={() =>
                alert(
                  "Úprava registrace bude doplněna v dalším kroku."
                )
              }
            >
              Upravit registraci
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
