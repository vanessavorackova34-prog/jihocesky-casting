import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="top">
        <div className="logo">
          🎬 <span>JIHOČESKÝ CASTING</span>
        </div>

        <nav className="nav">
          <a href="#casting">O castingu</a>
          <a href="#jak">Jak to funguje</a>
          <a href="#kontakt">Kontakt</a>
        </nav>

        <Link className="btn" href="/prihlaseni">
          Přihlášení pořadatele
        </Link>
      </header>

      <main>
        <section className="hero" id="casting">
          <div>
            <div className="eyebrow">
              CASTING • FILM • TV • REKLAMA
            </div>

            <h1>
              JIHOČESKÝ
              <br />
              <span className="gold">CASTING</span>
            </h1>

            <p className="muted">
              Castingová databáze herců, komparzu, talentů a filmového
              štábu z jižních Čech a okolí.
            </<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
  <Link className="btn" href="/prihlaseni">
    Přihlášení pořadatele
  </Link>

  <Link className="btn" href="/prihlaseni">
    Pro produkce
  </Link>
</div>

          <div className="card">
            <h2>Hledáme nové tváře</h2>

            <p className="muted">
              Zaregistruj se do databáze a můžeš být osloven/a pro film,
              seriál, reklamu, klip nebo focení.
            </p>

            <Link className="btn primary" href="/registrace">
              Registrovat profil
            </Link>
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <b>🎭</b>
            <small>Herci a herečky</small>
          </div>

          <div className="stat">
            <b>🎬</b>
            <small>Komparz a statisté</small>
          </div>

          <div className="stat">
            <b>📸</b>
            <small>Modelové a talenty</small>
          </div>

          <div className="stat">
            <b>📍</b>
            <small>Jihočeský kraj</small>
          </div>
        </section>

        <section className="section" id="jak">
          <div className="card">
            <h2>Jak to funguje?</h2>

            <p className="muted">
              1. Vyplníš registrační formulář. 2. Nahraješ fotografie.
              3. Profil čeká na schválení. 4. Pořadatelé ho mohou zařadit
              do vhodného projektu.
            </p>
          </div>
        </section>
      </main>

      <footer id="kontakt">
        © 2026 Jihočeský Casting
      </footer>
    </>
  );
}
