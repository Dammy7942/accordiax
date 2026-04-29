# 📜 Accordiax

**Trust through structured agreements.**  
A platform connecting Nigerian university students with educational consultants – payments happen **only after** a clear, signed agreement.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![Build in Public](https://img.shields.io/badge/Build%20in-Public-orange)](https://twitter.com/search?q=buildinpublic)

🔗 **Live:** [accordiax.vercel.app](https://accordiax.vercel.app)  
📅 **12‑week public build** – updates every Monday, Wednesday, Friday.

---

## ❓ The Problem

Across Nigerian universities, students hire educational consultants via informal channels (WhatsApp, Telegram). Common issues:

- Students pay upfront → receive nothing.
- Poor quality work with no recourse.
- Consultants also face non‑payment after delivery.

**No clear terms. No accountability. Broken trust.**

---

## 💡 The Solution

Accordiax introduces a **pre‑payment agreement system**:

1. Student submits a service request.
2. Consultant engages and proposes **scope, price, timeline, deliverables**.
3. Both parties **sign the agreement**.
4. **Only then** payment is made.
5. Service is delivered → both confirm completion.

> Trust should not be assumed – it should be **structured**.

---

## 🧱 Tech Stack (MVP)

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (App Router) + Tailwind  |
| Backend     | Supabase (PostgreSQL, Auth, Storage)|
| Payments    | Paystack (Week 3)                   |
| Hosting     | Vercel                              |
| Language    | TypeScript                          |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- Supabase account (free tier)

### 1. Clone the repository
```bash
git clone https://github.com/Dammy7942/accordiax.git
cd accordiax

### 2. Install dependencies

npm install

### 3. Set up environment variables
Create .env.local:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key

### 4. Run the development server

npm run dev

Open http://localhost:3000

### 5. (Optional) Set up Supabase schema

-- Core tables for Accordiax
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'consultant')),
  full_name TEXT,
  university TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_range TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  consultant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  price INTEGER NOT NULL,
  timeline TEXT,
  deliverables TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'paid', 'completed', 'disputed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
  paystack_ref TEXT UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can view open requests" ON requests FOR SELECT USING (status = 'open' OR student_id = auth.uid());
CREATE POLICY "Students can insert own requests" ON requests FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Participants can view agreements" ON agreements FOR SELECT USING (auth.uid() = consultant_id OR auth.uid() = (SELECT student_id FROM requests WHERE id = request_id));

-- Grant privileges (for anon role)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.requests TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agreements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.transactions TO anon, authenticated;


📅 Build Progress (12‑week plan)
We document every step in public (Twitter / blog).

✅ Week 1 (Completed)
Mon: Next.js + Tailwind + Supabase client

Wed: Database schema + RLS + API grants

Fri: Authentication + role selection (in progress)

🔜 Week 2
Request & agreement creation flow (no payment)

📅 Weeks 3–12
Week 3: Paystack integration (test)

Week 4: Delivery & completion

Week 5: UI polish & error handling

Week 6: Basic verification & reporting

Week 7: Ratings

Week 8: Live payments & onboarding

Week 9: First real paying transaction

Week 10: Bug fixes & mobile polish

Week 11: Public launch

Week 12: Measure & plan post-MVP

📄 License
MIT – free to use and adapt.

🌟 Acknowledgments
Inspired by a real‑life experience of paying a consultant who never delivered.

Built with Supabase, Next.js, and the open‑source community.