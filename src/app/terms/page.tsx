'use client';

import { FileText, UserCheck, AlertTriangle, Scale, RefreshCw, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }} className="mb-12">
    <div className="flex items-center gap-3 mb-4">
      <Icon className="text-primary shrink-0" size={26} />
      <h2 className="text-2xl font-bold text-on-background">{title}</h2>
    </div>
    <div className="text-on-surface-variant leading-relaxed space-y-3">{children}</div>
  </motion.section>
);

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopNav />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 pb-24 md:pb-16">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Last updated: August 2026</p>
          <h1 className="text-4xl font-bold text-on-background mb-4" style={{ letterSpacing: '-0.02em' }}>Terms of Service</h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            By using BayanihanHub, you agree to these terms. Please read them carefully — they are written in plain language on purpose.
          </p>
        </motion.div>

        <Section icon={FileText} title="What BayanihanHub Is">
          <p>
            BayanihanHub is a community coordination platform designed to connect people in need with people who
            can help with everyday community needs and hardships in the Philippines.
          </p>
          <p>
            BayanihanHub is <strong>not</strong> an emergency service, a government agency, a medical platform, or
            a marketplace. It is a tool to help neighbors find each other. For life-threatening emergencies, please
            call <strong>911</strong> or your local emergency services.
          </p>
        </Section>

        <Section icon={UserCheck} title="Your Responsibilities">
          <p>By posting or responding to requests, you agree to:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong>Post honestly.</strong> Only post requests that reflect a genuine, current need. Do not fabricate, exaggerate, or post on behalf of others without their consent.</li>
            <li><strong>Keep your request current.</strong> If your need has been met, please mark it as Resolved so community resources can focus elsewhere.</li>
            <li><strong>Protect others&apos; privacy.</strong> Do not post identifying information about third parties (names, addresses, medical details) without their explicit permission.</li>
            <li><strong>Respond in good faith.</strong> If you offer help, follow through. Do not collect contact information without genuine intent to help.</li>
            <li><strong>Not use the platform for commercial purposes.</strong> Spam, advertising, and solicitation are prohibited.</li>
          </ul>
        </Section>

        <Section icon={AlertTriangle} title="Disclaimers">
          <p>
            BayanihanHub does <strong>not</strong> verify the identity of users or the accuracy of any request.
            All requests are community-moderated, not professionally vetted. You interact with other users entirely
            at your own risk.
          </p>
          <p>
            We are not liable for any harm that results from help offered or received through the platform, including
            but not limited to personal injury, property damage, or financial loss.
          </p>
          <p>
            This platform is not intended for situations requiring professional medical, legal, or financial advice.
          </p>
        </Section>

        <Section icon={Ban} title="Prohibited Conduct">
          <p>The following are strictly prohibited and will result in immediate content removal:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>Posting false, misleading, or fabricated requests.</li>
            <li>Scamming, phishing, or soliciting money under false pretenses.</li>
            <li>Harassment, hate speech, or threats directed at any individual or group.</li>
            <li>Posting explicit, violent, or illegal content.</li>
            <li>Exploiting vulnerable individuals.</li>
            <li>Using automated scripts or bots to create or interact with posts.</li>
          </ul>
        </Section>

        <Section icon={RefreshCw} title="Content & Moderation">
          <p>
            You retain ownership of the content you post. By posting, you grant BayanihanHub a non-exclusive,
            royalty-free license to display your content on the platform for the purpose of connecting you with helpers.
          </p>
          <p>
            We reserve the right to remove, hide, or expire any content at any time for any reason, including but
            not limited to community reports, inactivity, or violations of these terms.
          </p>
        </Section>

        <Section icon={Scale} title="Changes to These Terms">
          <p>
            We may update these terms as the platform evolves. Significant changes will be noted with an updated
            date at the top of this page. Continued use of the platform after changes constitutes your acceptance
            of the new terms.
          </p>
          <p>
            Questions? Contact us at{' '}
            <a href="mailto:magharicarlwyne@gmail.com" className="text-primary hover:underline">magharicarlwyne@gmail.com</a>.
          </p>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
