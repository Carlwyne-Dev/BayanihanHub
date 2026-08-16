# BayanihanHub — Community Help, Connected

BayanihanHub is a real-time disaster relief and community help platform built for the DoGoodie Impact Hackathon. It centralizes unstructured help requests and offers (often lost in social media feeds), structures them using AI, and connects people faster than ever before.

## 🚀 Features

- **Public Feed (Map & List):** Users can view active requests and offers in their area, toggle between "Ask" and "Offer" feeds, and see everything on an interactive map.
- **AI-Powered Moderation:** 
  - **Spam Filtering:** An AI judge (Groq LLaMA 3.3) analyzes offers to ensure they are contextual and valid before notifying the requester.
  - **Admin AI Assistant:** Admins can ask the AI moderator for 1-sentence summaries and actionable advice on whether to approve, reject, or resolve a request.
- **Trust & Verification System:** Community signals like "Vouches", "Reports", and "Helper Responded" help establish trust. Admins have a dedicated dashboard to manually verify requests, stamping them with a blue "Verified by Admin" shield.
- **Rate Limiting & Security:** All public endpoints (creating requests, offering help, reporting) and admin endpoints are heavily rate-limited using Upstash Redis to prevent spam and brute-force attacks.

## 🛠 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (v4) & Framer Motion for micro-animations
- **Database:** Neon Serverless Postgres with Drizzle ORM
- **AI:** Groq SDK (LLaMA 3.3) for lightning-fast inference
- **Caching & Rate Limiting:** Upstash Redis
- **Maps:** Leaflet & React-Leaflet

## 🏃‍♂️ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your `.env.local` file:**
   You will need credentials for Neon (Database), Upstash (Redis), and Groq (AI).
   ```env
   DATABASE_URL="postgresql://..."
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="..."
   GROQ_API_KEY="gsk_..."
   ADMIN_PASSWORD="your_secure_password"
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** to view it in your browser.

## 🛡️ Admin Dashboard
Access the moderation queue at `/admin`. Enter the `ADMIN_PASSWORD` you set in your `.env.local`. 
- **Needs Review:** View new requests and reports.
- **AI Judge:** Click "Ask AI Moderator" on any request to get instant context and moderation advice.
- **Verify:** Approving a request instantly adds the blue Verified Shield for all users to see.

## 📜 License
Built for the DoGoodie Impact Hack. Open-source.
