# Jihočeský Casting

Kompletní základ webové castingové aplikace připravený pro Vercel + Supabase.

## Co už funguje
- veřejná stránka Jihočeský Casting
- veřejný registrační formulář
- ukládání kandidátů do Supabase
- přihlášení pořadatele přes Supabase Auth
- administrace kandidátů
- vyhledávání a filtrování
- schválení / odmítnutí / smazání kandidáta
- responzivní vzhled pro mobil

## Nasazení
1. Vytvoř projekt v Supabase.
2. V SQL Editoru spusť `supabase/schema.sql`.
3. V Supabase Authentication vytvoř účet pořadatele s e-mailem `jihoceskycasting@seznam.cz`.
4. Heslo nastav v Supabase, ne do zdrojového kódu.
5. Na Vercel importuj tento projekt.
6. Do Vercel Environment Variables přidej:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (nebo starší NEXT_PUBLIC_SUPABASE_ANON_KEY)`
7. Redeploy.

## Důležité
Fotografie jsou připravené jako další krok přes Supabase Storage. Pro ostrý provoz s osobními údaji je nutné doplnit zásady ochrany osobních údajů, souhlasy a vhodně omezit přístup k citlivým údajům.
