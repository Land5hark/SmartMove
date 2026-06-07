# SmartMove Deployment Guide

## Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project at vercel.com → New Project → Land5hark/SmartMove
3. Set environment variables (see below)
4. Deploy

## Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
| --- | --- |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `OPENROUTER_MODEL` | `google/gemini-2.0-flash-001` (or any vision-capable model) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://aigoelozzcmbfygycdyj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase publishable anon key |

## Local Development

```bash
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev                   # runs on port 9002
```

## Pre-Deployment Checklist

- [ ] `.env.local` has all four variables set
- [ ] `npm run build` passes locally
- [ ] Supabase project is active (not paused)
- [ ] OpenRouter API key has quota
