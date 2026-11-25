# Mata: joga dobrana do nastroju

Piszesz, jak się czujesz i ile masz czasu. AI wybiera trening z filmów kilku kanałów
YouTube z jogą, podaje uzasadnienie i dwie alternatywy. Historia treningów zapisuje się w Supabase.

Kanały (lista w `src/lib/channels.js`):
[@mayaradnaiyoga](https://www.youtube.com/@mayaradnaiyoga),
[@BasiaTworekNinjaYogi](https://www.youtube.com/@BasiaTworekNinjaYogi),
[@bognayoga](https://www.youtube.com/@bognayoga).
W Bibliotece możesz też dodać inny kanał z linku.

Stack: Vite + React, Tailwind v4 + shadcn/ui (wygląd jak w Inspiration Board), Supabase (auth, Postgres, Edge Function), YouTube Data API, OpenAI.

## Funkcje

- Logowanie i rejestracja (email + hasło, Supabase Auth)
- **Biblioteka:** jednym przyciskiem pobiera filmy ze wszystkich trzech kanałów do tabeli `videos` (Shorts i filmy krótsze niż 3 min są pomijane). Filtr po kanale.
- **Dobierz:** opis nastroju, szybkie podpowiedzi i limit czasu. AI wybiera film, a wynik zapisuje się w tabeli `sessions`.
- **Wynik:** odtwarzacz YouTube, uzasadnienie AI, dwie alternatywy do przełączenia, przycisk „Oznacz jako zrobione”.
- **Oceny:** pod filmem oceniasz trening gwiazdkami (1–5) i możesz dopisać notatkę. AI czyta Twoje oceny przy kolejnym doborze: szuka podobnych do wysoko ocenionych i omija te, które Ci nie podeszły.
- **Historia:** lista Twoich treningów z ocenami i średnią; możesz je też usuwać. Każda osoba widzi tylko swoje (RLS).

## Szybki start bez Supabase (tryb mock)

```bash
npm install
npm run dev
```

Bez kluczy w `.env.local` aplikacja działa w **trybie mock**: dane zostają w przeglądarce, zamiast prawdziwych filmów
jest 8 przykładowych, a „AI” to proste dopasowanie słów. Kliknij **Konto demo**, potem *Biblioteka → Pobierz filmy*.

## Podłączenie Supabase

1. **Projekt.** Załóż projekt na <https://supabase.com/dashboard> albo użyj tego z Inspiration Board.
2. **Tabele.** W *SQL Editor → New query* wklej i uruchom (*Run*) po kolei:
   - `supabase/migrations/001_init.sql` (tabele, RLS)
   - `supabase/migrations/002_ratings.sql` (oceny treningów)
3. **Klucze w aplikacji.**
   ```bash
   cp .env.example .env.local
   ```
   W pliku `.env.local` wpisz `VITE_SUPABASE_URL` (Project URL) i `VITE_SUPABASE_ANON_KEY` (klucz anon / publishable).
   Oba są w *Project Settings → API*.
4. **Email.** Do testów możesz wyłączyć *Authentication → Sign In / Providers → Email → Confirm email*.
   Ustaw też *Authentication → URL Configuration → Site URL* na `http://localhost:5173`.

## AI i YouTube (Edge Function `yoga-ai`)

Klucze YouTube i OpenAI są tylko na serwerze, w sekretach Edge Function. Nie trafiają do przeglądarki.

### 1. Klucz YouTube Data API (darmowy)

1. Wejdź na <https://console.cloud.google.com/>, załóż projekt (np. „mata”).
2. *APIs & Services → Library* → wyszukaj **YouTube Data API v3** → *Enable*.
3. *APIs & Services → Credentials → Create credentials → API key* → skopiuj klucz.

### 2. Klucz OpenAI

<https://platform.openai.com/api-keys> → *Create new secret key*. Jeśli używasz tego samego projektu
Supabase co w Inspiration Board, sekret `OPENAI_API_KEY` już tam jest.

### 3. Sekrety

Supabase → *Edge Functions → Secrets*:

| Nazwa | Wartość |
|---|---|
| `YOUTUBE_API_KEY` | klucz z Google Cloud |
| `OPENAI_API_KEY` | klucz OpenAI |
| `OPENAI_MODEL` | opcjonalnie; domyślnie `gpt-6-luna` |

### 4. Funkcja

1. *Edge Functions → Deploy a new function → Via Editor*.
2. Nazwa **dokładnie** `yoga-ai`.
3. Usuń przykładowy kod, wklej całość `supabase/functions/yoga-ai/index.ts`, kliknij *Deploy function*.
4. W funkcji: *Details → Function configuration* → wyłącz *Verify JWT with legacy secret* → *Save*.
   Funkcja sama sprawdza logowanie.

### 5. Test

`npm run dev` → zaloguj się → *Biblioteka* →
*Pobierz filmy ze wszystkich kanałów* → *Dobierz* → opisz nastrój → *Dobierz trening*.

| Komunikat | Co zrobić |
|---|---|
| `Nie mogę połączyć się z Edge Function "yoga-ai"` | Funkcja nie jest wdrożona albo ma inną nazwę. |
| `Na serwerze brakuje sekretu …` | Dodaj sekret (krok 3). |
| `Sesja wygasła…` przy każdym wywołaniu | Wykonaj krok 4.4. |
| `YouTube: API key not valid` | Sprawdź klucz i czy YouTube Data API v3 jest włączone. |

## Dane

| Tabela | Co zawiera | Kto zapisuje |
|---|---|---|
| `videos` | filmy z kanału: tytuł, opis, długość, miniatura | Edge Function (service role); zalogowani tylko czytają |
| `sessions` | nastrój, limit czasu, wybrany film, uzasadnienie AI, alternatywy, „zrobione”, ocena 1–5 z notatką i ocenionym filmem | zalogowana osoba, tylko swoje wiersze (RLS) |

## Struktura

```
src/
  lib/api.js             wybiera api.supabase.js albo api.mock.js
  lib/api.supabase.js    zapytania do tabel + wywołania funkcji yoga-ai
  lib/mock/              tryb mock: auth, localStorage, przykładowe filmy
  pages/                 AuthPage, HomePage (nastrój), SessionPage (wynik), HistoryPage, LibraryPage
  components/            nagłówek, menu, miniatura i odtwarzacz, shadcn ui/
supabase/migrations/001_init.sql
supabase/migrations/002_ratings.sql
supabase/functions/yoga-ai/index.ts
```
