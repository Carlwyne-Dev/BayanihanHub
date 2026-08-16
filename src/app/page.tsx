'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, HeartHandshake, MapPin, ShieldAlert, Sparkles, Navigation, Users, ShieldCheck } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Globe } from '@/components/Globe';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import { useEffect } from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function LandingPage() {
  useEffect(() => {
    trackEvent('visit');
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans overflow-x-hidden">
      
      {/* ── Top Nav for Landing ── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center border-b border-outline-variant/30 bg-background/50 backdrop-blur-sm"
      >
        <Link href="/" className="flex items-center gap-2">
          <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <Image
              src="/logo.png"
              alt="BayanihanHub logo"
              width={32}
              height={32}
              className="w-full h-full object-cover scale-[1.15]"
              priority
            />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight text-primary" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
            BayanihanHub
          </span>
        </Link>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link 
            href="/feed" 
            className="text-sm font-semibold bg-primary text-on-primary px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm block"
          >
            Open App
          </Link>
        </motion.div>
      </motion.header>

      {/* ── Hero Section (Clean & Editorial) ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-6 md:px-12 flex flex-col md:flex-row items-center gap-12 max-w-screen-xl mx-auto w-full">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex-1 flex flex-col items-start text-left pt-8"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider mb-8">
            <HeartHandshake size={14} /> Community First
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl font-bold text-on-surface tracking-tight leading-[1.15] mb-6">
            Bayanihan in the digital age.
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
            BayanihanHub is a community platform connecting locals who need a hand—from a spare school supply to a blood donor—with neighbors who can help.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link 
                href="/feed" 
                className="inline-flex justify-center items-center gap-2 bg-primary text-on-primary font-semibold text-base px-8 py-4 rounded-xl shadow-sm transition-opacity hover:opacity-90 w-full"
              >
                See who needs help
                <ArrowRight size={18} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link 
                href="/ask" 
                className="inline-flex justify-center items-center gap-2 bg-surface text-on-surface border border-outline-variant font-semibold text-base px-8 py-4 rounded-xl shadow-sm transition-colors hover:bg-surface-variant w-full"
              >
                Ask for assistance
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Globe */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex-1 w-full flex justify-center md:justify-end relative"
        >
          <div className="relative w-full max-w-md aspect-square">
            <Globe />
          </div>
        </motion.div>
      </section>

      {/* ── Problem & Solution (Features) ── */}
      <section className="py-20 bg-surface-container-low px-6 md:px-12">
        <div className="max-w-screen-xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-4">How It Works</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              We cut through the noise of social media so you can easily find and help neighbors nearby with everyday community needs.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* Card 1 */}
            <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <Navigation size={28} />
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-3">Hyperlocal Mapping</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Posts are pinned to a map. Instead of asking "Where are they?", volunteers can instantly see who needs help within a 5-kilometer radius.
              </p>
            </motion.div>
            
            {/* Card 2 */}
            <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-3">AI Data Extraction</h3>
              <p className="text-on-surface-variant leading-relaxed">
                Paste a community request, and our AI automatically extracts the location, urgency, and category. Less typing, faster connection.
              </p>
            </motion.div>
            
            {/* Card 3 */}
            <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-center justify-center mb-6">
                <HeartHandshake size={28} />
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-3">Community Vouching</h3>
              <p className="text-on-surface-variant leading-relaxed">
                To build trust, locals can "vouch" for requests to confirm they are legitimate, helping the community prioritize real needs.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Disclaimer / Limitations ── */}
      <section className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="max-w-4xl mx-auto bg-error-container/30 border border-error/20 rounded-3xl p-8 md:p-12 relative z-10"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-16 h-16 shrink-0 bg-error-container text-on-error-container rounded-full flex items-center justify-center">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-on-surface mb-3">Scope & Limitations</h2>
              <p className="text-on-surface-variant mb-4 leading-relaxed">
                BayanihanHub is a <strong>community-driven crowdsourcing tool</strong>, not an official emergency dispatch system (like 911). 
                Information posted here is community-generated and may not be verified immediately.
              </p>
              <ul className="list-disc list-inside text-sm text-on-surface-variant space-y-2 font-medium">
                <li>If you are in a life-threatening situation, always contact local emergency services first.</li>
                <li>Do not coordinate high-risk rescues unless you are a trained professional.</li>
                <li>Be cautious of scams when offering or receiving donations/supplies.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer / CTA ── */}
      <section className="py-24 bg-surface px-6 md:px-12 text-center border-t border-outline-variant">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-on-surface mb-6">Ready to make a difference?</h2>
          <p className="text-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
            Whether you need assistance or have resources to spare, your community is waiting.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
            <Link 
              href="/feed" 
              className="inline-flex justify-center items-center bg-primary text-on-primary font-semibold text-lg px-10 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              Open App
            </Link>
          </motion.div>
        </motion.div>
      </section>
      
      <Footer />
    </div>
  );
}
