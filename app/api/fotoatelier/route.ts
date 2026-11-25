import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function unavailable() {
  return response({ error: "Rezervace teď nejsou dostupné. Zkuste to za chvíli." }, 503);
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!date || !datePattern.test(date)) return response({ error: "Vyberte platný den." }, 400);
  const db = database();
  if (!db) return unavailable();
  const { data, error } = await db.rpc("photoatelier_booked_times", { p_date: date });
  if (error?.code === "22008" || error?.code === "22007") {
    return response({ error: "Vyberte platný den." }, 400);
  }
  if (error) return unavailable();
  return response({ booked: (data as string[]).map((time) => time.slice(0, 5)) });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 8192) return response({ error: "Zkraťte poznámku a zkuste to znovu." }, 400);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return response({ error: "Žádost má neplatný formát." }, 400);
  }
  const { datum, cas, jmeno, email, telefon, poznamka, consent } = body ?? {};
  if (consent !== "yes" || typeof datum !== "string" || !datePattern.test(datum) ||
      typeof cas !== "string" || !/^(1[0-6]):(00|20|40)$/.test(cas) ||
      [jmeno, email, telefon, poznamka].some((value) => typeof value !== "string")) {
    return response({ error: "Zkontrolujte zvolený termín a kontaktní údaje." }, 400);
  }
  const db = database();
  if (!db) return unavailable();
  const { error } = await db.rpc("photoatelier_book", {
    p_date: datum, p_time: cas, p_name: jmeno, p_email: email, p_phone: telefon, p_note: poznamka,
  });
  if (error?.code === "23505") {
    return response({ error: "Tento čas je už obsazený. Vyberte prosím jiný." }, 409);
  }
  if (error && ["22007", "22008", "22023", "23514"].includes(error.code)) {
    return response({ error: "Zkontrolujte datum, čas a kontaktní údaje." }, 400);
  }
  return error ? unavailable() : response({ booked: true }, 201);
}
