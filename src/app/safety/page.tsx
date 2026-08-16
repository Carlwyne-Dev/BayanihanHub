'use client';

import { Shield, MapPin, EyeOff, AlertTriangle, CheckCircle2, Search, History, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/TopNav';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';

const TRUST_LABELS = [
  { label: 'Source provided', icon: Search, color: 'text-primary', bg: 'bg-primary-fixed', desc: 'The requester linked back to an original social media post. You can check the source yourself.' },
  { label: 'Recently updated', icon: History, color: 'text-secondary', bg: 'bg-secondary-container', desc: 'The requester or a moderator confirmed this request is still current.' },
  { label: 'User-confirmed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', desc: 'Someone who responded to this request confirmed it was legitimate.' },
  { label: 'Needs review', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'This request was just posted or reported and hasn\'t been checked yet. Use your judgment.' },
  { label: 'Reported', icon: AlertTriangle, color: 'text-error', bg: 'bg-error-container', desc: 'One or more users flagged a concern about this request. Reasons are not publicly detailed, but proceed carefully.' },
  { label: 'Resolved', icon: CheckCircle2, color: 'text-outline', bg: 'bg-surface-variant', desc: 'The requester or a responder marked this need as met.' },
];

export default function SafetyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNav />

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 pb-24 md:pb-12">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <h1 className="text-4xl font-bold text-on-background mb-4" style={{ letterSpacing: '-0.02em' }}>Trust & Safety</h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            BayanihanHub is built to help neighbors connect faster, but safety always comes first. 
            We rely on community judgment and transparent information, rather than making claims of certainty we can't back up.
          </p>
        </motion.div>

        {/* Section 1: Trust Labels */}
        <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }} className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-primary" size={28} />
            <h2 className="text-2xl font-bold text-on-background">How we handle Trust</h2>
          </div>
          <p className="text-on-surface-variant mb-6">
            We never use AI to automatically stamp requests as "Verified." Instead, every post carries a transparent status label to help you make your own judgment before helping.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRUST_LABELS.map((item, i) => (
              <motion.div key={i} whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }} transition={{ duration: 0.2 }} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-full ${item.bg}`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <span className="font-bold text-on-surface">{item.label}</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Section 2: Privacy */}
        <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }} className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <EyeOff className="text-primary" size={28} />
            <h2 className="text-2xl font-bold text-on-background">Your Privacy Protected</h2>
          </div>
          <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 md:p-8 flex flex-col gap-6">
            <div className="flex gap-4 items-start">
              <div className="bg-primary-fixed text-primary p-3 rounded-full shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-1">Approximate Locations</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  We never show exact street addresses on our public map. Locations are displayed at the neighborhood or city level by default. For sensitive requests (like health or shelter), locations are deliberately jittered further to protect vulnerable individuals.
                </p>
              </div>
            </div>
            
            <div className="h-px bg-outline-variant w-full" />

            <div className="flex gap-4 items-start">
              <div className="bg-primary-fixed text-primary p-3 rounded-full shrink-0">
                <EyeOff size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface mb-1">Gated Contact Info</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Your phone number or personal link is never exposed publicly to passing traffic or web scrapers. Helpers are required to write a brief, personal message offering help before the app reveals how they can contact you.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 3: Moderation */}
        <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-primary" size={28} />
            <h2 className="text-2xl font-bold text-on-background">Community Moderation</h2>
          </div>
          <p className="text-on-surface-variant mb-4">
            If you see something that looks like spam, outdated information, or a scam, you can flag it instantly. 
            Any user can report a post without needing an account.
          </p>
          <p className="text-on-surface-variant">
            Reported requests are immediately labeled "Reported" so others know to proceed carefully, and our moderation team reviews them to either confirm, hide, or expire the post.
          </p>
        </motion.section>

      </main>

      <BottomNav />
      <Footer />
    </div>
  );
}
