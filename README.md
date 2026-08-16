# BayanihanHub — Community Help, Connected

> A real-time disaster relief and community help platform built for the **DoGoodie Impact Hackathon**.

BayanihanHub centralizes unstructured help requests and offers (often lost in social media feeds), structures them using AI, and connects people faster than ever before — embodying the Filipino spirit of **Bayanihan**.

---

## 🚀 Features

- **Public Feed & Map** — Real-time list and interactive map of active community requests and offers, filterable by category, urgency, and location.
- **Post a Request or Offer** — Anyone can ask for help or offer help in seconds, with AI structuring and spam filtering on submit.
- **AI-Powered Moderation** — Groq LLaMA 3.3 checks every offer message for spam/gibberish before it reaches the requester. An AI assistant also helps the admin make fast moderation decisions.
- **Trust & Verification System** — Community signals (Vouches, Reports, "Still Needed") and an admin-verified blue shield badge help surface credible requests.
- **Admin Dashboard** — Full moderation queue with tabs, community signals, AI advice, and confirmation modals for every action.
- **Rate Limiting & Security** — All endpoints are protected with Upstash Redis rate limiting (per-IP + per-email) to prevent spam and abuse.
- **Toast Notifications** — Real-time feedback across the whole app, styled to match the aesthetic.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + Framer Motion |
| Database | Neon Serverless Postgres + Drizzle ORM |
| AI | Groq SDK (LLaMA 3.3-70b) |
| Rate Limiting | Upstash Redis |
| Maps | Leaflet + React-Leaflet |
| Notifications | react-hot-toast |

---

## 📜 License

This project is **not open for cloning or reuse**. All rights reserved © 2026 Carlwyne. Built for the DoGoodie Impact Hack.
