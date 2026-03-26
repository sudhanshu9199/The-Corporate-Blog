# 🏢 The Corporate Blog

A high-performance, SEO-optimized blogging platform built with modern web technologies.

## 🚀 Tech Stack
* **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
* **Backend:** Node.js, Express, TypeScript
* **Database:** Neon PostgreSQL
* **Deployment:** Vercel

## ⚙️ Publishing Pipeline & Public Rendering
1. **Drafting:** Authors write posts in the secure dashboard (Status: `draft`).
2. **Review:** Editors review and approve.
3. **Publishing:** Status changes to `published`. Next.js triggers Incremental Static Regeneration (ISR) to rebuild the specific blog post page in the background without bringing down the site.
4. **SEO Engine:** JSON-LD schema (Article, FAQ, Breadcrumbs) is automatically injected into the `<head>` for rich Google Search results.

## 💻 Local Setup
1. Clone the repo.
2. Add your Neon Database URL to `.env`.
3. Run `npm install` and `npm run dev` in both frontend and backend folders.