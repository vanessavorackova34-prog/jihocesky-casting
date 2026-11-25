import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
const sender = "lexapacasting@seznam.cz";

export async function POST(request) {
  const token = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return new Response(null, { status: 403 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } });
  const { data: job, error } = await db.rpc("studio_claim_email", { p_token: token });
  if (error) return new Response(null, { status: error.code === "42501" ? 403 : 503 });
  if (!job) return new Response(null, { status: 204 });
  const date = new Date(job.booking_date + "T12:00:00Z").toLocaleDateString("cs-CZ", {timeZone:"Europe/Prague"});
  const time = job.booking_time.slice(0,5);
  const confirmed = job.event === "client_confirmation";
  const text = confirmed
    ? `Dobrý den,\n\npotvrzujeme vaše focení dne ${date} v ${time}. Těšíme se na vás ve fotoateliéru LEXAPA, Karolíny Světlé 2238/2, České Budějovice.\n\nLEXAPA Fotoateliér`
    : `Nová rezervace focení na ${date} v ${time}. Kontakt na klienta a možnost potvrzení najdete ve správě rezervací:\nhttps://databaze.lexapacasting.cz/fotoatelier/rezervace`;
  try {
    if (!/^[^\s@,;<>\r\n]+@[^\s@,;<>\r\n]+\.[^\s@,;<>\r\n]+$/.test(job.recipient)) return new Response(null,{status:422});
    const smtp = nodemailer.createTransport({
      host:"smtp.seznam.cz", port:465, secure:true, auth:{ user:sender, pass:job.password },
      connectionTimeout:10000, greetingTimeout:8000, socketTimeout:15000,
    });
    const result = await smtp.sendMail({
      from:{name:"LEXAPA Fotoateliér",address:sender}, to:{name:"",address:job.recipient},
      subject: confirmed ? `Potvrzení focení – ${date} v ${time}` : `Nová rezervace – ${date} v ${time}`,
      text,
    });
    if (!result.accepted.length) return new Response(null,{status:502});
    const ack = await db.rpc("studio_ack_email",{p_token:token,p_lease:job.lease});
    return new Response(null,{status:ack.error ? 503 : 204});
  } catch {
    return new Response(null,{status:502});
  }
}
