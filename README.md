# Accordiax

**Trust through structured agreements.**  
A platform connecting Nigerian university students with academic consultants. Every engagement starts with a written, signed agreement. Payment goes into escrow and is only released after the student confirms the work is complete.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)

**Live:** [accordiax.vercel.app](https://accordiax.vercel.app)

---

## The Problem

Across Nigerian universities, students hire educational consultants through informal channels — WhatsApp, Telegram, word of mouth. The result:

- Students pay upfront and receive nothing.
- Work is delivered but payment is withheld.
- No written terms, no accountability, no recourse.

---

## How It Works

1. A student posts a request describing what they need, their budget, and their deadline.
2. Consultants respond with a structured offer: scope, price, timeline, and deliverables — all in writing.
3. The student accepts the offer. Both parties are bound to the written terms.
4. The student pays via Flutterwave. Funds are held in escrow — not released to the consultant yet.
5. The consultant delivers. The student confirms completion and releases payment.
6. If there is a dispute, the admin team reviews the original agreement and delivers a fair resolution.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + OAuth) |
| File Storage | Supabase Storage |
| Payments | Flutterwave |
| Email | Brevo (transactional) |
| Hosting | Vercel |

---

## Features

**For students**
- Post service requests with category, budget range, and description
- Review consultant offers and accept on written terms
- Pay into escrow via Flutterwave
- Chat with the consultant on the agreement page
- Confirm delivery to release payment
- Raise a dispute if the work does not meet the agreed terms
- Rate consultants after completion

**For consultants**
- Browse open student requests
- Submit structured offers (scope, price, timeline, deliverables)
- Negotiate price on active agreements
- Mark work as delivered
- Appeal admin decisions
- View ratings received

**Trust and safety**
- Identity verification (admin-reviewed documents)
- Consultant trust badge (manually granted by admin)
- User reporting with evidence uploads
- Dispute and appeal resolution by admin

**Admin panel**
- Session-protected at `/admin`
- Sub-pages: Appeals, Verification, Escrow, Reports

---

## Local Development

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- Flutterwave account (test keys are fine locally)

### 1. Clone and install

```bash
git clone https://github.com/Dammy7942/accordiax.git
cd accordiax
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key

BREVO_API_KEY=your_brevo_api_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  page.tsx                  # Landing page
  login/                    # Auth (email + OAuth)
  role-selection/           # Student or consultant
  profile-completion/       # Onboarding step
  profile/                  # Edit profile
  student-dashboard/        # Student home
  consultant-dashboard/     # Consultant home
  requests/[id]/            # Request detail
  agreement/[id]/           # Agreement detail + chat
  ratings/                  # Rating history
  how-it-works/             # Marketing page
  admin/                    # Admin panel (appeals)
    verification/           # Identity + trust verification
    escrow/                 # Escrow management
    reports/                # User reports
  api/
    flutterwave/verify/     # Payment verification webhook
    admin/appeals/          # List open appeals
    admin/resolve-appeal/   # Resolve an appeal
    admin/escrow/           # Escrow overview
    email/send/             # Transactional email via Brevo
    email/notify-delivered/ # Delivery notification

components/
  ui/                       # Button, Input, Badge, Modal, Toast, Skeleton, EmptyState
  MarketingNav.tsx
  BrandedLoader.tsx
  FadeIn.tsx
  AnimatedCounter.tsx

hooks/
  useAuthRedirect.ts        # Shared post-login routing logic

lib/
  supabaseClient.ts
  supabaseAdmin.ts
  supabaseServer.ts
  flutterwave.ts
  email.ts
```

---

## License

MIT
