# Jisr

Simple English notes with Arabic help for university students who studied in Arabic at school.
Built for ELO-Uni 2026.

## What works (v0.1)

| Feature | Status |
| --- | --- |
| Record a lecture (in 60-second pieces) | ✅ |
| Upload audio (up to 4MB) | ✅ |
| Upload a PDF (up to 3MB) or paste a reading | ✅ |
| Notes in simple English, hard words highlighted, tap for Arabic | ✅ |
| Quiz and flashcards | ✅ |
| Ask (English, Arabic or a mix; answers in simple English, "Explain in Arabic" button) | ✅ |
| Assignment helper (explains the task, never does it) | ✅ |
| Word bank (tap = saved) with review game | ✅ |
| Arabic fade (words you stop needing lose their Arabic) | ✅ |
| Live mode with Present (big screen) view | ✅ |
| Whole-course exam review | ⏳ next |
| Demo mode (no keys: sample content) | ✅ |

Everything is saved on the student's own device. There are no accounts.

## Run it on your laptop

1. Install Node.js 20 or newer from https://nodejs.org
2. In this folder, run:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

With no keys, it runs in **demo mode** (sample "Supply and Demand" content), so you can click through everything.

## Turn on the real AI (free)

1. Get a free **Gemini** key at https://aistudio.google.com ("Get API key"). This powers notes, quiz, Ask, the assignment helper and live notes.
2. Get a free **Groq** key at https://console.groq.com ("API Keys"). This powers speech-to-text.
3. Copy `.env.example` to `.env.local` and paste the keys into `GEMINI_API_KEY` and `GROQ_API_KEY`.
4. Restart `npm run dev`.

Free tiers have daily limits. If you hit one, you'll see "free limit reached", and it resets later.
Gemini's free tier may use data to improve Google's products, so tell trial students and avoid private recordings.

Paid alternatives (optional): `ANTHROPIC_API_KEY` + `AI_PROVIDER=anthropic` for Claude, `OPENAI_API_KEY` for OpenAI Whisper.

## Put it online on Vercel (so everyone can test on their own phone)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com, sign in with GitHub, then **Add New > Project** and pick the repo.
3. Under **Environment Variables**, add `GEMINI_API_KEY` and `GROQ_API_KEY`.
4. Click **Deploy**. You get a `.vercel.app` link to share.

Every push to `main` updates the live link. Every other branch gets its own preview link, so you can test changes before they go live.

Microphone recording needs HTTPS, so on phones it works on the Vercel link, not on your laptop's local address.

## Where things are

| Path | What it is |
| --- | --- |
| `app/page.tsx` | Home (library) |
| `app/new/page.tsx` | Add a lesson (record, upload, paste) |
| `app/item/[id]/page.tsx` | Notes, Quiz, Flashcards, Ask, assignment helper |
| `app/words/page.tsx` | Word bank and review |
| `app/live/page.tsx` | Live mode |
| `app/api/*` | Server routes that call the AI and speech-to-text |
| `lib/ai.ts` | Switch between Gemini, Claude, Groq and OpenAI |
| `lib/prompts.ts` | All instructions sent to the AI (tune these) |
| `lib/store.ts` | On-device storage, word bank, Arabic fade rule |
| `lib/mock.ts` | Demo mode content |
