'use client';

import { ShieldCheck, MapPin, EyeOff, Database, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.5 }} className="mb-12">
    <div className="flex items-center gap-3 mb-4">
      <Icon className="text-primary shrink-0" size={26} />
      <h2 className="text-2xl font-bold text-on-background">{title}</h2>
    </div>
    <div className="text-on-surface-variant leading-relaxed space-y-3">{children}</div>
  </motion.section>
);

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNav />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 pb-24 md:pb-16">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Last updated: August 2026</p>
          <h1 className="text-4xl font-bold text-on-background mb-4" style={{ letterSpacing: '-0.02em' }}>Privacy Policy</h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            BayanihanHub is a community tool, not a surveillance platform. We collect the minimum amount of information
            necessary to connect people in need with people who can help — nothing more.
          </p>
        </motion.div>

        <Section icon={Database} title="What We Collect">
          <p>When you <strong>post a request</strong>, we collect:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Your request title, description, category, and urgency level.</li>
            <li>An approximate location (neighborhood or city level — never an exact street address).</li>
            <li>Your preferred contact method (e.g., phone number, Facebook handle) — this is kept private and only revealed to users who actively offer to help.</li>
            <li>An email address or handle used only to let you manage your own post later. It is never publicly displayed.</li>
            <li>An optional link to an original social media post for verification purposes.</li>
          </ul>
          <p className="mt-2">When you <strong>offer help</strong>, we collect a brief message and your contact email or handle so the original requester can reach back out.</p>
          <p>We do <strong>not</strong> require you to create an account, and we do <strong>not</strong> track you across other websites.</p>
        </Section>

        <Section icon={MapPin} title="Location Data">
          <p>
            Locations are always displayed at the neighborhood or city level, never as an exact street address.
            For sensitive categories — such as Health and Shelter — coordinates are deliberately <em>jittered</em> (shifted
            by a random offset of up to ~500 meters) before being stored, to further protect vulnerable individuals from
            being located precisely.
          </p>
          <p>
            If you grant browser location permission, your coordinates are used purely to sort requests by proximity
            in your current session and are never sent to our servers or stored.
          </p>
        </Section>

        <Section icon={EyeOff} title="How We Use Your Information">
          <p>We use the information you provide only to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Display requests on the community feed.</li>
            <li>Connect a helper with a requester by sharing the requester's contact method after the helper submits an offer.</li>
            <li>Allow the original poster to manage (edit, bump, or resolve) their own request.</li>
            <li>Review reports from the community to keep the platform safe.</li>
          </ul>
          <p>We do <strong>not</strong> sell your data to any third party, use it for advertising, or share it with any organization outside of what is described above.</p>
        </Section>

        <Section icon={ShieldCheck} title="Data Storage & Security">
          <p>
            All data is stored in a SQLite database. Contact methods and submitter emails are stored in plain text
            and are protected by application-level access controls — they are never returned in public API responses.
          </p>
          <p>
            This platform is a community prototype. While we take reasonable precautions, we are not a
            HIPAA-compliant or fully certified secure service. <strong>Please do not share sensitive medical, legal, or
            financial information in your request.</strong>
          </p>
        </Section>

        <Section icon={Trash2} title="Deletion & Expiry">
          <p>
            Requests automatically expire after a period of time depending on their urgency level (Urgent: 48h,
            Normal: 7 days, Low: 30 days). Expired requests are hidden from the public feed.
          </p>
          <p>
            If you want your post or personal data removed early, you can mark it as Resolved from your original
            device, or contact us through the form below.
          </p>
        </Section>

        <Section icon={AlertCircle} title="Contact">
          <p>
            If you have any questions or concerns about your privacy, please reach out to us at{' '}
            <a href="mailto:magharicarlwyne@gmail.com" className="text-primary hover:underline">magharicarlwyne@gmail.com</a>.
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
