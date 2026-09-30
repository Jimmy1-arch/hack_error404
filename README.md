# DevOps Copilot

Responsive marketing site and interactive incident-response workspace built with Next.js, TypeScript and Framer Motion.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure the providers you want.
4. Run `npm run dev` and open http://localhost:3000.

## Pages and features

- `/` product landing page with smooth anchor navigation, staggered fade-up text, unique visual panels, hand-authored SVG partner marks and integrations, feature stories, customer proof, FAQ and calls to action.
- `/solve` incident inbox with 12 editable mock incidents, search and filters, service health cards, on-call actions, expandable runbook steps, automation rules with toggles and dry runs, incident analytics, and workspace controls. These actions update demo state; no infrastructure provider is connected by default.
- `/signin` and `/register` share the homepage visual language. Required fields and password confirmation validate locally for the demo; no password is persisted. Google OAuth can be enabled with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXT_PUBLIC_APP_URL` in `.env.local`.

The OAuth callback is `/api/auth/google/callback`. Configure that exact callback URL in your Google OAuth client. Do not commit `.env.local` or share credentials in chat.

## Copilot analysis

Without credentials, `/api/analyze` returns a deterministic demo response. Set `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` in the server environment to enable live analysis.

## Visual assets

Product preview illustrations and section backdrops are unique custom SVG files. Supplied screenshots are used only in distinct feature contexts rather than repeated as multiple hero images. Floral artwork serves as a separate backdrop layer.
