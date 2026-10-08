import Link from "next/link";

const categories = [
  { icon: "🎭", title: "Herci", description: "Profesionálové i začátečníci" },
  { icon: "🎬", title: "Komparz", description: "Pro film, seriál i reklamu" },
  { icon: "✦", title: "Děti", description: "Od 3 měsíců" },
  { icon: "★", title: "Senioři", description: "Až do 98 let" },
];

export default function Home() {
  return (
    <>
      <header className="top lexHomeTop">
        <Link href="/" className="lexBrand">🎬 <span>LEXAPA CASTING</span></Link>
        <Link className="btn compact" href="/prihlaseni">♟ Přihlášení pořadatele</Link>
      </header>
      <main className="lexLanding">
        <section className="lexLandingHero">
          <div className="lexLandingContent">
            <div className="eyebrow">CASTING • FILM • TV • REKLAMA • KLIPY</div>
            <h1>LEXAPA<br/><span>CASTING</span></h1>
            <p>Castingová databáze herců, komparzu, talentů a filmového štábu z celé České republiky.</p>
            <div className="lexLandingActions">
              <Link className="btn primary" href="/registrace">Registrovat profil →</Link>
              <Link className="btn" href="/produkce">Pro produkce →</Link>
            </div>
          </div>
          <div className="lexFilmDecor" aria-hidden="true"><span>🎬</span></div>
        </section>
        <section className="lexLandingFacts" aria-label="Působnost databáze">
          <div><strong>1000+</strong><small>registrovaných talentů</small></div>
          <div><strong>3 měsíce – 98 let</strong><small>věkové rozpětí</small></div>
          <div><strong>Všech 14 krajů</strong><small>celá Česká republika</small></div>
          <div><strong>Film • TV • Reklama</strong><small>seriály, klipy a focení</small></div>
        </section>
        <section className="lexCategoryGrid" aria-label="Kategorie talentů">
          {categories.map((item) => (
            <div className="lexCategory" key={item.title}>
              <div className="lexCategoryIcon" aria-hidden="true">{item.icon}</div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
          ))}
        </section>
        <section className="lexProduction">
          <div className="eyebrow">SPOLUPRÁCE PRO PRODUKCE</div>
          <h2>Kompletní castingové<br/>a produkční služby</h2>
          <p>Zajišťujeme herce, komparz, koordinátory, transport, ubytování, catering, kostýmy, BTS fotografie a další služby pro natáčení po celé České republice.</p>
          <Link className="btn primary" href="/produkce">Více o spolupráci →</Link>
        </section>
      </main>
      <footer>© 2026 LEXAPA CASTING</footer>
    </>
  );
}
