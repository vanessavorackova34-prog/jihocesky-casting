"use client";

import { createBrowserClient } from "@supabase/ssr";
import styles from "./reservations.module.css";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const table = "photoatelier_reservations";
const statuses = { pending: "Čeká na potvrzení", confirmed: "Potvrzeno", cancelled: "Zrušeno" };
const times = Array.from({ length: 21 }, (_, index) =>
  `${10 + Math.floor(index / 3)}:${String(index % 3 * 20).padStart(2, "0")}`
).filter((time) => !time.startsWith("12:"));

type Reservation = {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  email: string;
  phone: string;
  note: string | null;
  status: keyof typeof statuses;
};

export default function PhotoatelierAdmin() {
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (!url || !key) throw new Error("Databáze není dostupná.");
        const db = createBrowserClient(url, key);
        const { data: { user } } = await db.auth.getUser();
        if (!user) {
          window.location.replace("/fotoatelier/prihlaseni");
          return;
        }
        const access = await db.rpc("photoatelier_is_organizer");
        if (access.error) throw new Error("Přístup se nepodařilo ověřit.");
        if (!access.data) throw new Error("Správa rezervací je dostupná pořadatelům LEXAPA.");
        const result = await db.from(table).select("*").order("booking_date").order("booking_time");
        if (result.error) throw new Error("Rezervace se nepodařilo načíst.");
        setRows(result.data);
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Rezervace se nepodařilo načíst.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function removeReservation(row: Reservation) {
    if (!url || !key || saving) return;
    const date = new Date(row.booking_date + "T12:00:00").toLocaleDateString("cs-CZ");
    if (!window.confirm(`Trvale smazat rezervaci pro ${row.client_name} na ${date} v ${row.booking_time.slice(0, 5)}?`)) return;
    setSaving(row.id);
    setNotice("");
    try {
      const db = createBrowserClient(url, key);
      const result = await db.from(table).delete().eq("id", row.id)
        .eq("booking_date", row.booking_date).eq("booking_time", row.booking_time).eq("status", row.status).select("id").single();
      if (result.error) throw result.error;
      setRows((current) => current.filter((item) => item.id !== row.id));
      setNotice("Rezervace byla smazána.");
    } catch {
      setNotice("Smazání se nepodařilo ověřit. Obnovte stránku.");
    } finally {
      setSaving("");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>, row: Reservation) {
    event.preventDefault();
    if (!url || !key || saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(row.id);
    setNotice("");
    try {
      const db = createBrowserClient(url, key);
      const { data, error: failure } = await db.from(table).update({
        booking_date: form.get("date"),
        booking_time: form.get("time"),
        status: form.get("status"),
      }).eq("id", row.id).eq("booking_date", row.booking_date).eq("booking_time", row.booking_time).eq("status", row.status)
        .select("*").single();
      if (failure?.code === "23505") {
        setNotice("Vybraný čas je v tento den obsazený. Vyberte prosím jiný.");
      } else if (failure?.code === "PGRST116") {
        setNotice("Rezervace se mezitím změnila. Obnovte stránku.");
      } else if (failure) {
        setNotice("Změnu se nepodařilo uložit.");
      } else {
        setRows((current) => current.map((item) => item.id === row.id ? data : item)
          .sort((a, b) => (a.booking_date + a.booking_time).localeCompare(b.booking_date + b.booking_time)));
        setNotice("Změna byla uložena.");
      }
    } catch {
      setNotice("Změnu se nepodařilo uložit.");
    } finally {
      setSaving("");
    }
  }

  const byDate = new Map<string, Reservation[]>();
  for (const row of rows) {
    const group = byDate.get(row.booking_date);
    if (group) group.push(row);
    else byDate.set(row.booking_date, [row]);
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <button className="btn" onClick={async () => {
          if (!url || !key) return;
          const { error } = await createBrowserClient(url, key).auth.signOut({ scope: "local" });
          if (error) { setNotice("Odhlášení se nepodařilo."); return; }
          window.location.replace("/fotoatelier/prihlaseni");
        }}>Odhlásit se</button>
        <Link className="btn" href="/fotoatelier">Web fotoateliéru</Link>
      </nav>
      <h1>Rezervace fotoateliéru</h1>
      {loading && <p>Načítám rezervace…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && !rows.length && <p>Zatím žádné rezervace.</p>}
      {notice && <p role="status">{notice}</p>}
      {Array.from(byDate, ([date, bookings]) => (
        <section className={styles.day} key={date}>
          <h2>{new Date(date + "T12:00:00").toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2>
          {bookings.map((row) => (
        <article className={styles.booking} key={row.id}>
          <div className={styles.head}>
            <time>{row.booking_time.slice(0, 5)}</time>
            <h3>{row.client_name}</h3>
            <span data-status={row.status}>{statuses[row.status]}</span>
          </div>
          <p className={styles.contacts}><a href={`mailto:${encodeURIComponent(row.email)}`}>{row.email}</a>
            <a href={`tel:${row.phone.replace(/[^+\d]/g, "")}`}>{row.phone}</a></p>
          {row.note && <p className={styles.note}>{row.note}</p>}
          <details><summary>Upravit rezervaci</summary>
          <form key={row.booking_date + row.booking_time + row.status} onSubmit={(event) => save(event, row)}>
            <label className="field">Datum focení
              <input type="date" name="date" defaultValue={row.booking_date} required />
            </label>
            <label className="field">Čas focení
              <select name="time" defaultValue={row.booking_time.slice(0, 5)}>
                {times.map((time) => <option key={time}>{time}</option>)}
              </select>
            </label>
            <label className="field">Stav rezervace
              <select name="status" defaultValue={row.status}>
                {Object.entries(statuses).map(([value, label]) =>
                  <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <button className="btn primary" disabled={!!saving}>
              {saving === row.id ? "Ukládám…" : "Uložit změny"}
            </button>
          </form>
          <button className={styles.remove} type="button" disabled={!!saving} onClick={() => removeReservation(row)}>Smazat rezervaci</button>
        </details>
        </article>
          ))}
        </section>
      ))}
    </main>
  );
}
