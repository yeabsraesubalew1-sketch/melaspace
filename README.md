# Mela Space

A production-ready content + lead-generation platform built with Next.js App Router.

## Overview

Mela Space includes:

- Public marketing site (`/`, `/about`, `/services`, `/resources`, `/contact`)
- Blog listing + detail pages with SEO metadata and sitemap/robots
- Inquiry and waitlist form pipelines
- Google-authenticated admin panel for blog and form management
- Editor.js-based blog editor with preview workflow
- Error reporting pipeline with DB logging and email fallback

## Tech Stack

- Next.js 16 (App Router, route handlers, proxy)
- React 19 + TypeScript
- Tailwind CSS 4
- MongoDB + Mongoose
- NextAuth (Google provider)
- Resend (form and error notification emails)
- Editor.js (rich post content)

## Project Structure

- `app/(public)` public pages and blog routes
- `app/admin` authenticated admin UI
- `app/api` server endpoints (blogs, categories, forms, errors)
- `components/admin` admin shell/editor/forms UI
- `components/editorjs` editor content normalization + rendering
- `models` Mongoose models
- `lib` auth, DB, SEO, utilities
- `proxy.ts` auth guard for `/admin` and `/login`

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB database
- Google OAuth app
- Resend account (for outbound email)

## Environment Variables

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Required:

- `MONGODB_URI`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `INQUIRY_EMAIL`
- `WAITLIST_EMAIL`

Optional but recommended:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_BASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY_ERROR`
- `ERROR_EMAIL`
- `VERCEL_URL` (provided automatically on Vercel)

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

- `npm run dev` start dev server
- `npm run build` production build
- `npm run start` run production server locally
- `npm run lint` run ESLint
- `npm run seed:blogs` seed sample blog data

## Admin Access Setup

Authentication uses Google sign-in via NextAuth. Access to admin routes requires the signed-in email to exist in the `Admin` collection.

Add at least one admin document in MongoDB:

```json
{ "email": "admin@yourdomain.com" }
```

## Deployment Checklist

1. Set all required environment variables in your hosting platform.
2. Ensure Google OAuth callback URLs match deployment domain.
3. Run `npm run build` in CI before deploy.
4. Verify critical flows after deploy:
	- `/login` Google sign-in
	- `/admin` access guard
	- Create/edit/publish blog post
	- Inquiry and waitlist submissions
	- Public blog pages + sitemap/robots

## Notes

- Proxy-based route protection is implemented in `proxy.ts`.
- Error reporting stores failures in DB first and can notify by email fallback.
