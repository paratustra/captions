# Real-time captions

Real-time speech-to-text captions in the browser, with optional live
translation to English. Audio is streamed to [Deepgram](https://deepgram.com)
for transcription; finalized segments are optionally translated with
[Groq](https://groq.com).

## How it works

```
Browser mic ──stream──▶ Deepgram (WebSocket) ──transcript──▶ caption on screen
     │                                                            │
     │  short-lived token                          final segment  │ (if translation on)
     ▼                                                            ▼
/api/authenticate  ◀── mints token with          /api/translate ──▶ Groq ──▶ English
  (Deepgram key,        DEEPGRAM_API_KEY             (GROQ_API_KEY)
   server-side)
```

- The **Deepgram master key never reaches the browser.** `/api/authenticate`
  mints a short-lived scoped token (`auth.grantToken`) server-side, and the
  client connects with that token (Bearer scheme).
- Only **finalized** transcript segments are sent for translation, and stale
  translations are aborted, so a slow response can't overwrite a newer caption.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Deepgram JS SDK — live speech-to-text
- Groq SDK — translation (`openai/gpt-oss-20b`)
- Framer Motion — caption animation
- Tailwind CSS + Radix UI

## Getting started

Requires Node.js 20.9+ and [pnpm](https://pnpm.io).

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` from the example and add your keys:

   ```bash
   cp .env.example .env.local
   ```

   | Variable           | Purpose                                                   |
   | ------------------ | --------------------------------------------------------- |
   | `DEEPGRAM_API_KEY` | Server-side only. Needs **Member+** scope to mint tokens. |
   | `GROQ_API_KEY`     | Server-side only. Used for translation.                   |

   Get keys from the [Deepgram console](https://console.deepgram.com/) and
   [Groq console](https://console.groq.com/keys).

3. Run the dev server and open <http://localhost:3000>:

   ```bash
   pnpm dev
   ```

4. Grant microphone access when prompted and start speaking.

## Usage

- Speak into the microphone to see live captions.
- Toggle the switch to translate captions to English in real time.

## Configuration

- **Input language** — the transcription language is set in
  `app/transcription.tsx` (`connectToDeepgram({ model: "nova-2", language: "es" })`).
  Change `language` (and `model` if needed) for other languages; see the
  [Deepgram models & languages](https://developers.deepgram.com/docs/models-languages-overview)
  matrix.
- **Translation model** — set in `app/api/translate/route.ts`
  (`TRANSLATION_MODEL`). See the [Groq models list](https://console.groq.com/docs/models).

## API routes

| Route               | Method | Description                                         |
| ------------------- | ------ | --------------------------------------------------- |
| `/api/authenticate` | `GET`  | Mints a short-lived Deepgram token for the browser. |
| `/api/translate`    | `POST` | Translates `{ text }` to English via Groq.          |

## Scripts

```bash
pnpm dev      # start the dev server
pnpm build    # production build
pnpm start    # run the production build
pnpm lint     # lint
```
