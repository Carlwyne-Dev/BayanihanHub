'use client';

import { Heart, Check, X, Flag, Users, Lightbulb } from 'lucide-react';
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

const DoCard = ({ items, type }: { items: string[]; type: 'do' | 'dont' }) => (
  <div className={`rounded-xl border p-5 space-y-3 ${type === 'do' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
    <p className={`text-sm font-bold uppercase tracking-wider ${type === 'do' ? 'text-green-700' : 'text-red-700'}`}>
      {type === 'do' ? '✓  Please Do' : '✗  Please Don\'t'}
    </p>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          {type === 'do'
            ? <Check size={16} className="text-green-600 shrink-0 mt-0.5" />
            : <X size={16} className="text-red-600 shrink-0 mt-0.5" />}
          <span className={type === 'do' ? 'text-green-900' : 'text-red-900'}>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default function GuidelinesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNav />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 pb-24 md:pb-16">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Last updated: August 2026</p>
          <h1 className="text-4xl font-bold text-on-background mb-4" style={{ letterSpacing: '-0.02em' }}>Community Guidelines</h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            BayanihanHub is powered by trust. These guidelines help us maintain a space where people feel safe
            asking for help and confident in the help they offer. The spirit of <em>bayanihan</em> — neighbors
            helping neighbors without condition — guides everything here.
          </p>
        </motion.div>

        <Section icon={Heart} title="The Bayanihan Spirit">
          <p>
            Bayanihan means coming together as a community — not for personal gain, but because it is the right thing
            to do. When you post or respond here, you are extending that tradition. We ask that every interaction on
            this platform reflects that spirit: honest, generous, and respectful.
          </p>
        </Section>

        <Section icon={Check} title="Posting Requests">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DoCard type="do" items={[
              'Post genuine, current needs only.',
              'Be specific — describe what you need, how much, and by when.',
              'Include a source link to a Facebook post or news article when available.',
              'Mark your request as Resolved once the need has been met.',
              'Bump your request with "Still Needed" if it is still active after a few days.',
              'Disclose if you are posting on behalf of someone else and have their consent.',
            ]} />
            <DoCard type="dont" items={[
              'Post needs that have already been met.',
              'Exaggerate quantities or urgency to attract more attention.',
              'Include full street addresses or identifying details for vulnerable individuals.',
              'Post the same request multiple times.',
              'Use requests to solicit donations for organizations without disclosing affiliation.',
              'Post medical or legal advice as a "request" response.',
            ]} />
          </div>
        </Section>

        <Section icon={Users} title="Offering Help">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DoCard type="do" items={[
              'Write a genuine, personal message when offering — it helps the poster trust you.',
              'Follow through on your offer once contact is made.',
              'Be clear about what you can and cannot provide.',
              'Respect the requester\'s situation and privacy.',
            ]} />
            <DoCard type="dont" items={[
              'Offer help you cannot deliver.',
              'Collect contact information without genuine intent to help.',
              'Share a requester\'s contact info with others.',
              'Pressure requesters to accept your help.',
            ]} />
          </div>
        </Section>

        <Section icon={Lightbulb} title="Vouching for Requests">
          <p>
            The "Vouch for This" button lets you signal to the community that you believe a request is genuine —
            perhaps because you personally know the requester, saw the same situation on social media, or have verified
            the information yourself.
          </p>
          <p>
            Vouching is a <strong>statement of good faith, not a guarantee.</strong> Please only vouch for requests you have
            genuine reason to believe are legitimate. Vouching for false or suspicious requests undermines the trust
            of the entire community.
          </p>
        </Section>

        <Section icon={Flag} title="Reporting & Moderation">
          <p>
            If you see a post that looks suspicious, outdated, or harmful, please report it immediately using the
            Report button. You do not need an account. Reported posts are immediately flagged for community review.
          </p>
          <p>
            Our moderation approach is <strong>transparent</strong>: we display the status of every post openly
            ("Reported," "Needs Review," "Source Provided") so you can make your own judgment rather than relying
            on a hidden system. We rely on community members like you to keep this feed honest.
          </p>
          <p className="text-sm">
            For urgent moderation concerns, contact us at{' '}
            <a href="mailto:magharicarlwyne@gmail.com" className="text-primary hover:underline">magharicarlwyne@gmail.com</a>.
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
