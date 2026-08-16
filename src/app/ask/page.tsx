'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, Send, X, Info, ArrowLeft, HeartHandshake, HandHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';
import { LocationPicker } from '@/components/LocationPicker';
import { categoryOptions, urgencyOptions, offerUrgencyOptions, platformOptions } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

type FormData = {
  type:          'ASK' | 'OFFER';
  title:         string;
  description:   string;
  category:      string;
  urgency:       string;
  locationLabel: string;
  locationLat:   number | null;
  locationLng:   number | null;
  contactMethod: string;
  sourcePlatform:string;
  sourceUrl:     string;
  submitterEmail:string;
  consentType:   string;
};

const INITIAL: FormData = {
  type: 'ASK', title: '', description: '', category: '', urgency: 'normal',
  locationLabel: '', locationLat: null, locationLng: null,
  contactMethod: '', sourcePlatform: 'none', sourceUrl: '',
  submitterEmail: '', consentType: '',
};

export default function AskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'offer' ? 'OFFER' : 'ASK';
  
  const [form, setForm] = useState<FormData>({ ...INITIAL, type: initialType });
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiFallback, setAiFallback] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const isFormValid = !!(
    form.title.trim() && 
    form.description.trim() && 
    form.category && 
    form.locationLabel.trim() && 
    form.contactMethod.trim() && 
    form.submitterEmail.trim()
  );

  const showFloatingButton = isFormValid || hasScrolledToBottom;

  useEffect(() => {
    const handleScroll = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 100;
      setHasScrolledToBottom(atBottom);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Auto-fill email if logged in
  useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setForm(prev => ({ ...prev, submitterEmail: savedEmail }));
    }
  }, []);

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleAiExtract() {
    if (aiText.trim().length < 10) {
      setAiError('Please paste at least a few sentences of text.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiFallback(false);
    try {
      const res = await fetch('/api/ai-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
      const json = await res.json();
      if (json.fallback) {
        setAiFallback(true);
        setAiError(json.error);
        setForm(prev => ({ ...prev, description: aiText }));
      } else if (json.success) {
        setForm(prev => {
          const newType = json.data.type || prev.type;
          return {
            ...prev,
            title:         json.data.title         || prev.title,
            description:   json.data.description   || prev.description,
            category:      json.data.category      || prev.category,
            type:          newType,
            urgency:       json.data.urgency       || prev.urgency,
            locationLabel: json.data.locationLabel || prev.locationLabel,
            contactMethod: json.data.contactMethod || prev.contactMethod,
            sourceUrl:     json.data.sourceUrl     || prev.sourceUrl,
            sourcePlatform: json.data.sourcePlatform !== 'none' ? json.data.sourcePlatform : prev.sourcePlatform,
          };
        });
        setShowAiPanel(false);
      }
    } catch {
      setAiError('Could not reach the AI service. Please fill the form manually.');
      setForm(prev => ({ ...prev, description: aiText }));
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isFormValid) {
      triggerToast('Please fill in all required fields to post.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lat: form.locationLat,
          lng: form.locationLng,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); return; }
      
      // Save to localStorage so they "own" this post on this device
      const myRequests = JSON.parse(localStorage.getItem('my_requests') || '[]');
      myRequests.push(json.id);
      localStorage.setItem('my_requests', JSON.stringify(myRequests));
      
      // Save their email for the next time they post
      localStorage.setItem('user_email', form.submitterEmail);

      trackEvent('request_created', json.id);

      router.push(`/request/${json.id}?created=1`);
    } catch {
      setError('Failed to submit. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-surface border border-outline-variant rounded-lg px-6 py-4 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline text-on-surface outline-none";
  const labelClass = "block text-lg font-semibold text-on-surface mb-2";

  // Dynamic copy based on type
  const copy = form.type === 'ASK' ? {
    titleLabel:       'What is needed?',
    titlePlaceholder: 'Brief summary (e.g., Needs transport to clinic)',
    descLabel:        'Details & Context',
    descPlaceholder:  'Share more about the situation, who is involved, and what specific help would be best...',
    locationHint:     'Where is this happening?',
    contactLabel:     'How should neighbors reach out?',
    contactPlaceholder:'e.g. Reply here, Call 09XX-XXX-XXX',
    categoryLabel:    'Category',
    categoryDefault:  'Select category...',
    urgencyLabel:     'Urgency',
    urgencyOpts:      urgencyOptions,
  } : {
    titleLabel:       'What is being offered?',
    titlePlaceholder: 'Brief summary (e.g., Free canned goods)',
    descLabel:        'Details & Context',
    descPlaceholder:  'Share more about what you can provide, availability, and any conditions...',
    locationHint:     'Where is this available?',
    contactLabel:     'How should neighbors reach out?',
    contactPlaceholder:'e.g. Reply here, Call 09XX-XXX-XXX',
    categoryLabel:    'Category',
    categoryDefault:  'Select category...',
    urgencyLabel:     'Availability',
    urgencyOpts:      offerUrgencyOptions,
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-background min-h-screen relative pb-28 md:pb-0">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] bg-error text-on-error px-6 py-3 rounded-full shadow-lg font-medium animate-in fade-in slide-in-from-top-4 flex items-center gap-2 text-sm whitespace-nowrap">
          <AlertCircle size={16} /> {toastMsg}
        </div>
      )}

      <div className="hidden md:block">
        <TopNav />
      </div>

      {/* Mobile Sticky Header */}
      <div className="md:hidden sticky top-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center h-14 border-b border-outline-variant px-4">
        <button onClick={() => router.back()} className="absolute left-4 p-2 text-on-surface hover:bg-surface-variant rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-primary">Create Request</h1>
      </div>

      <main className="flex-grow w-full max-w-screen-md mx-auto px-4 md:px-0 py-6 md:py-12 flex flex-col gap-6">
        {/* Page Header (Desktop) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="hidden md:block text-center space-y-4 mb-2">
          <h1 className="text-5xl font-semibold text-on-background" style={{ letterSpacing: '-0.02em' }}>Create a Request</h1>
          <p className="text-base text-on-surface-variant">Connect with your community to get or offer help.</p>
        </motion.div>

        {/* Type Toggle (Moved above form) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="flex p-1 bg-surface-container rounded-full w-full shadow-sm max-w-sm mx-auto relative">
          {(['ASK', 'OFFER'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={`relative flex-1 py-2.5 text-sm rounded-full transition-colors flex justify-center items-center gap-2 font-bold z-10 ${
                form.type === t
                  ? 'text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {form.type === t && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              {t === 'ASK' ? <HeartHandshake size={16} /> : <HandHeart size={16} />}
              {t === 'ASK' ? 'Ask for Help' : 'Offer Help'}
            </button>
          ))}
        </motion.div>

        {/* AI Assistant Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
          <div className="bg-primary-container text-on-primary-container w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-on-surface">Let AI fill this for you</h3>
            <p className="text-sm text-on-surface-variant">Describe what you need in a few words, and we'll draft the details.</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0">
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className="bg-primary text-on-primary text-base px-6 py-4 rounded-full hover:opacity-90 transition-opacity font-medium shadow-sm w-full"
            >
              {showAiPanel ? 'Hide' : 'Try it out'}
            </button>
          </motion.div>
        </motion.div>

        {/* AI Input Panel */}
        <AnimatePresence>
        {showAiPanel && (
          <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }} className="bg-surface border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-semibold text-on-surface">Paste your message</h4>
              <button onClick={() => setShowAiPanel(false)}><X size={18} className="text-outline" /></button>
            </div>
            <textarea
              className={inputClass}
              rows={4}
              placeholder="e.g. 'Hi neighbors, an elderly couple on Rizal St needs help clearing debris tomorrow morning.'"
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              style={{ resize: 'none' }}
            />
            {aiError && (
              <div className={`flex items-center gap-2 text-sm ${aiFallback ? 'text-on-surface-variant' : 'text-error'}`}>
                <AlertCircle size={14} /> {aiError}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button type="button" onClick={() => { setShowAiPanel(false); set('type', form.type === 'ASK' ? 'OFFER' : 'ASK'); }} className="px-6 py-4 text-sm text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-lg transition-colors w-full h-full">
                  Fill manually instead
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="button"
                  onClick={handleAiExtract}
                  disabled={aiLoading}
                  className="bg-primary text-on-primary text-sm px-6 py-4 rounded-full hover:opacity-90 transition-opacity flex items-center gap-2 font-medium w-full h-full"
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {aiLoading ? 'Extracting…' : 'Extract Info'}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="bg-transparent md:bg-surface-container-lowest md:border md:border-outline-variant rounded-xl md:shadow-sm md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-outline-variant"></div>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Or fill manually</span>
              <div className="flex-1 h-px bg-outline-variant"></div>
            </div>
            
            <div className="flex flex-col gap-6">
              <div>
                <label className={labelClass} htmlFor="title">{copy.titleLabel}</label>
                <input
                  id="title"
                  className={inputClass}
                  placeholder={copy.titlePlaceholder}
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="description">{copy.descLabel}</label>
                <textarea
                  id="description"
                  className={inputClass}
                  placeholder={copy.descPlaceholder}
                  rows={4}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>
            </div>

            <hr className="border-outline-variant" />

            {/* Categorization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass} htmlFor="category">{copy.categoryLabel}</label>
                <select id="category" className={inputClass} value={form.category} onChange={e => set('category', e.target.value)} required>
                  <option value="">{copy.categoryDefault}</option>
                  {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="urgency">{copy.urgencyLabel}</label>
                <select id="urgency" className={inputClass} value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                  {copy.urgencyOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <hr className="border-outline-variant" />

            {/* Location & Contact */}
            <div className="flex flex-col gap-6">
              <div>
                <label className={labelClass}>Location</label>
                <p className="text-xs text-outline mb-2">{copy.locationHint} You can drag the pin to adjust.</p>
                
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg mb-3 leading-relaxed flex items-start gap-3">
                  <Info className="shrink-0 mt-0.5" size={16} />
                  <div>
                    <strong>Approximate Locations:</strong> We never show exact street addresses on our public map. Locations are displayed at the neighborhood or city level by default. For sensitive requests (like health or shelter), locations are deliberately jittered further to protect vulnerable individuals.
                    <br/><br/>
                    <strong>Note:</strong> This isn&apos;t a secure medical or emergency platform — please avoid including more personal or medical detail than necessary.
                  </div>
                </div>
                <LocationPicker
                  label={form.locationLabel}
                  lat={form.locationLat}
                  lng={form.locationLng}
                  onChange={(label, lat, lng) => setForm(prev => ({ ...prev, locationLabel: label, locationLat: lat, locationLng: lng }))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="contact">{copy.contactLabel}</label>
                <input
                  id="contact"
                  className={inputClass}
                  placeholder={copy.contactPlaceholder}
                  value={form.contactMethod}
                  onChange={e => set('contactMethod', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">Your email or handle</label>
                <p className="text-xs text-outline mb-2">This acts as your account to manage your post later. Never displayed publicly.</p>
                <input
                  id="email"
                  className={inputClass}
                  placeholder="you@email.com or @handle"
                  value={form.submitterEmail}
                  onChange={e => set('submitterEmail', e.target.value)}
                  required
                />
              </div>

              {/* Source (optional) */}
              <div>
                <label className={labelClass} htmlFor="source-url">Link to original post (optional)</label>
                <input id="source-url" className={`${inputClass} mb-3`} placeholder="https://facebook.com/..." value={form.sourceUrl} onChange={e => set('sourceUrl', e.target.value)} type="url" />
                
                <label className={labelClass} htmlFor="source-platform">Platform</label>
                <select id="source-platform" className={inputClass} value={form.sourcePlatform} onChange={e => set('sourcePlatform', e.target.value)}>
                  {platformOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Consent */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-on-surface">If sharing someone else&apos;s post</label>
                {[
                  { value: 'is_original_poster', label: 'I am the original poster' },
                  { value: 'has_permission',      label: "I have the original poster's permission to share this" },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="consentType"
                      value={opt.value}
                      checked={form.consentType === opt.value}
                      onChange={e => set('consentType', e.target.value)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-on-surface">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-error-container rounded-lg text-on-error-container text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Actions */}
            <div className="hidden md:flex pt-6 justify-end gap-6 items-center">
              <button type="button" onClick={() => router.back()} className="text-base text-on-surface-variant hover:text-on-surface transition-colors px-6 py-4">
                Cancel
              </button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-on-primary text-base font-medium px-12 py-4 rounded-full hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                  {submitting ? 'Posting…' : <>Review & Post <Send size={18} /></>}
                </button>
              </motion.div>
            </div>

            {/* Mobile Sticky Action Bar — only visible when valid or scrolled to bottom */}
            {showFloatingButton && (
              <div className="md:hidden fixed bottom-[84px] left-4 right-4 z-[9998] animate-in fade-in slide-in-from-bottom-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-on-primary text-base font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : null}
                  {submitting ? 'Posting…' : <>Review & Post <Send size={20} /></>}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
