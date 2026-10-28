# Mela Space

A modern, production-ready thought leadership platform, digital resource library, community engagement hub, and content management system built with Next.js 16 (App Router), React 19, MongoDB, and Google Gemini AI.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Admin Access & RBAC](#admin-access--rbac)
- [Available Scripts](#available-scripts)
- [Deployment Checklist](#deployment-checklist)

---

## Overview

Mela Space is an editorial and digital ecosystem featuring:

- **Public Editorial Platform**: High-performance publication pages (`/`, `/about`, `/services`, `/blogs`, `/resources`, `/contact`, `/privacy`, `/terms`).
- **AI-Powered Authoring & Reading**: Google Gemini integrations for bilingual blog drafting, idea generation, and one-click reader article summaries.
- **Digital Resources Catalog**: Downloadable guides, toolkits, templates, and multi-file resource decks with format filtering and download tracking.
- **Interactive Community Engine**: Nested comment threads, upvoting, comment pinning, user bookmarking, and community post proposal workflows.
- **Cloud Asset Pipeline**: Direct FileVault storage integration, reverse-proxy image streaming, and orphaned media cleanup.
- **Role-Based Admin Panel**: Protected admin workspace with auto-provisioned root administrator capabilities.

---

## Key Features

### 1. Editorial & Blog Management
- **Editor.js Authoring Pipeline**: Rich block editor customized with:
  - `ImageTool`: FileVault cloud upload, captions, border styles, background fills, and stretched widths.
  - `FileTool`: Document attachments (PDF, DOCX, ZIP, XLSX) with size badges and download counters.
  - `ResourceMentionTool`: Inline mention tool linking directly to catalog resources with interactive hovercards.
- **Enhanced Reading View**:
  - Live scroll-progress bar, dynamic table of contents, and estimated read time.
  - Interactive **Author Hover Card** showing author bio, verified team status, social links, and article counts.
  - Linked resources module highlighting downloadable materials referenced within the post.
  - Category filtering with color tokens and real-time usage statistics.

### 2. Google Gemini AI Suite
- **Admin AI Co-Writer Modal**:
  - Full article drafts, outlines, section expansions, introductions, conclusions, and SEO meta tags.
  - **Bilingual English & Amharic Support**: Native Ge'ez script generation and transliteration-friendly processing.
  - **Idea Generator**: Category-tailored post concepts and hooks.
  - Automated translation of AI output into valid Editor.js block schemas.
- **Reader AI Summary Card**:
  - One-click executive summary embedded on single blog posts.
  - Generates bullet-point takeaways and key insights, cached via Redis/DB to minimize token consumption.

### 3. Digital Resources & Downloads Hub
- **Public Catalog (`/resources`)**: Search, filter by category, and filter by format (PDF, spreadsheet, audio, deck, template, guide).
- **Single Resource Pages (`/resources/[slug]`)**: Formatted with markdown typography, related items, and multi-file deck bundles.
- **Admin Management (`/admin/resources`)**: Full CRUD dashboard with multi-file deck uploads, soft-deletion, and restore endpoints.
- **Direct Homepage Integration**: Homepage tool cards mapped directly to published resources with filtered catalog queries.

### 4. Interactive Nested Comments
- **Hierarchical Discussions**: Multi-level reply trees (reply-to-reply) with instant optimistic UI updates.
- **Moderation & Badges**: Verified author/admin labels, comment upvoting, and sticky comment pinning.
- **Tombstones & Auto-Cleanup**: Soft deletes display context-preserving tombstones (`[Comment deleted]`) until all child replies are removed, at which point orphaned tombstones are purged automatically.

### 5. User Bookmarks & Community Proposals
- **User Dashboard & Bookmarks**: Authenticated users can save articles for later reading.
- **Guest Post Proposals (`ProposePostModal`)**: Multi-step submission workflow, draft revision quotas, and admin review pipeline with revision request feedback.

### 6. FileVault Cloud Storage Pipeline
- **Secure File Storage**: Direct file uploads with SHA-256 deduplication and MIME validation.
- **Reverse Proxy (`/api/files/[...path]`)**: Immutable caching headers and CORS-free delivery.
- **SSL Connection Warming**: `undici`-powered keep-alive pooling to eliminate TLS cold-start latencies.
- **Orphan Cleanup**: Automated garbage collection routines for abandoned assets.

### 7. Technical SEO & Performance
- **Dynamic Open Graph Images**: Edge-rendered social sharing cards generated at `/api/og/blog`.
- **JSON-LD Structured Data**: Schemas for `Article`, `Organization`, `BreadcrumbList`, `WebSite`, and `FAQPage`.
- **Typography & Localization**: Integrated custom Ethiopic font (`Selam.otf`) and localized metadata.
- **Loading UX**: Branded responsive loading states (`loading.tsx`) across all public and admin routes.
- **Crawler Essentials**: Dynamic `sitemap.ts`, `robots.ts`, and PWA `manifest.ts`.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Components, Route Handlers) |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **Database & ORM** | MongoDB, Mongoose 9 |
| **AI Engine** | Google Gemini API (`@google/genai`) |
| **Storage & Assets**| FileVault Cloud Storage, Custom Reverse Proxy |
| **Authentication** | NextAuth.js (Google OAuth Provider, Role-Based Access) |
| **Caching & Limits** | Upstash Redis, Upstash Ratelimit |
| **Email Service** | Resend (Inquiries, waitlists, error fallbacks) |
| **Editor** | Editor.js + Custom Tools (`ImageTool`, `FileTool`, `ResourceMentionTool`) |
| **Networking & Docs**| Undici (Connection Pooling & SSL Warmup), Marked (Markdown Parsing) |

---

## Project Structure

```text
├── app/
│   ├── (public)/              # Public route groups (/, about, blogs, resources, services, contact)
│   ├── admin/                 # Protected admin dashboard (blogs, resources, proposals, users)
│   ├── api/                   # Route handlers (blogs, resources, comments, uploads, AI, OG, forms)
│   ├── layout.tsx             # Root layout with fonts, providers, and metadata
│   ├── sitemap.ts             # Dynamic multi-model XML sitemap
│   └── robots.ts              # Search engine directives
├── components/
│   ├── admin/                 # Admin shell, editors, category selector, AI Co-Writer modal
│   ├── blog/                  # Blog cards, reading view, author hovercard, AI summary, comments
│   ├── editorjs/              # Editor.js blocks, renderers, and normalizers
│   ├── forms/                 # Contact hub and inquiry pipelines
│   ├── layout/                # Responsive navbar and footer
│   ├── proposal/             # Community post proposal modal
│   └── resources/             # Resources catalog, cards, and download buttons
├── lib/
│   ├── auth.ts                # NextAuth options and role management
│   ├── comment-permissions.ts # RBAC rules for comment moderation
│   ├── filevault.ts           # FileVault upload, signed URL, and proxy client
│   ├── filevault-cleanup.ts   # Garbage collection for orphaned uploads
│   ├── gemini.ts              # Google Gemini AI models and prompt pipelines
│   ├── seo.ts                 # Metadata and JSON-LD schema generators
│   └── slugify.ts             # Slugs and URL utilities
├── models/                    # Mongoose schemas (Blog, Resource, Comment, User, Proposal, Category)
├── public/
│   └── fonts/                 # Ethiopic typography (Selam.otf)
└── proxy.ts                   # Auth guard and role protection middleware
```

---

## Prerequisites

- **Node.js**: `20.x` or higher
- **Package Manager**: `npm 10+` or `pnpm`
- **MongoDB**: Local instance or MongoDB Atlas cluster
- **Google Cloud Console**: OAuth 2.0 Client ID and Secret
- **Google Gemini API Key**: From Google AI Studio
- **FileVault Account**: Endpoint URL and API keys
- **Resend Account**: API key for transactional emails
- **Upstash Redis** *(Optional but recommended)*: REST URL and token for caching and rate limiting

---

## Environment Variables

Copy `.env.example` to create your local `.env.local`:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/melaspace

# NextAuth & Root Admin
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
ROOT_ADMIN_EMAIL=your-email@example.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# FileVault Cloud Storage
FILEVAULT_URL=https://your-filevault-domain.com
FILEVAULT_API_KEY=your-filevault-private-key
FILEVAULT_API_KEY_PUBLIC=your-filevault-public-key

# Email & Notifications
RESEND_API_KEY=your-resend-api-key
INQUIRY_EMAIL=hello@example.com
WAITLIST_EMAIL=hello@example.com
RESEND_API_KEY_ERROR=your-resend-error-key
ERROR_EMAIL=errors@example.com

# Public URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional Redis (Rate Limiting & Summary Cache)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
VERCEL_URL=http://localhost:3000
```

---

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Admin Access & RBAC

Mela Space uses role-based access control with automatic root administrator promotion:

1. Set `ROOT_ADMIN_EMAIL` in `.env.local` to your Google account email.
2. Sign in via `/login` using Google OAuth.
3. The platform automatically promotes this email to `root_admin`, ensuring immediate access to `/admin` without requiring manual database seeding.
4. From the admin panel, the root admin can invite or assign permissions to other team members (`admin`, `editor`, `moderator`).

---

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Compiles and builds the production application.
- `npm run start`: Runs the built production server locally.
- `npm run lint`: Runs ESLint checks.
- `npm run seed:blogs`: Seeds the database with default sample blog posts.
- `npm run seed:blogs -- --format=markdown`: Seeds using markdown-style content blocks.
- `npm run seed:blogs -- --format=editorjs`: Seeds using Editor.js block JSON data.

---

## Deployment Checklist

1. **Environment Variables**: Configure all production variables on Vercel or your hosting provider (ensure `ROOT_ADMIN_EMAIL`, `GEMINI_API_KEY`, and `FILEVAULT_*` are set).
2. **Google OAuth Authorized Redirect URIs**:
   - `https://yourdomain.com/api/auth/callback/google`
3. **Database Indexes**: Verify MongoDB connection and network IP whitelist.
4. **Build Verification**: Run `npm run build` locally or in CI to ensure zero type or compilation errors.
5. **Verify Critical Workflows**:
   - Google Sign-in & root admin privilege elevation.
   - Blog authoring, AI Co-Writer generation, and publishing.
   - Resource upload, multi-file decks, and download telemetry.
   - Comment posting, nested replies, upvoting, and moderation.
   - Reader AI summary generation.
   - Contact and inquiry form email delivery via Resend.
   - Open Graph card generation at `/api/og/blog?title=Test`.
