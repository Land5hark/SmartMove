# READ FIRST

## Tech Stack

This project uses TypeScript, OpenRouter (for LLM calls), Supabase, and deploys via Vercel/EAS. Prefer OpenRouter for any AI integration work.

## Build & Run

Before starting the dev server, check if the port is already in use and free it. After EAS/Expo builds, verify dependencies like @expo/vector-icons are installed to avoid module resolution errors.

## Deployment

For Expo apps use EAS build; for web apps use Vercel. After any deploy or AI-config change, do a smoke test of the running app before declaring done.

## Expo HAS CHANGED

Read the exact versioned docs at <https://docs.expo.dev/versions/v56.0.0/> before writing any code.
