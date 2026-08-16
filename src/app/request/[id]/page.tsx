'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Clock, ExternalLink, Share2, ShieldAlert, HeartHandshake, User, CheckCircle2, RefreshCw, Loader2, AlertCircle, X, Flag, Search, History, AlertTriangle, Package, Users, ShieldCheck, HandshakeIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';
import type { Request } from '@/lib/db/schema';
import { formatRelativeTime, platformLabels } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const MiniMap = dynamic(() => import('@/components/MiniMap'), { ssr: false, loading: () => <div className="h-48 animate-pulse bg-surface-container-low" /> });

const REPORT_REASONS = [
  { value: 'false',         label: 'False or misleading' },
  { value: 'outdated',      label: 'Already resolved / outdated' },
  { value: 'spam',          label: 'Spam or advertising' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'suspicious',    label: 'Looks suspicious' },
];

function RequestDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === '1';

  const [request, setRequest] = useState<Request | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showOffer, setShowOffer] = useState(false);
  const [offerMsg, setOfferMsg] = useState('');
  const [offerEmail, setOfferEmail] = useState('');
  const [offerName, setOfferName] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerResult, setOfferResult] = useState<{ contactMethod: string } | null>(null);
  const [hasOffered, setHasOffered] = useState(false); // prevents re-opening modal after close
  const [showContactResult, setShowContactResult] = useState(true); // controls contact info visibility
  const [offerError, setOfferError] = useState('');

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reported, setReported] = useState(false);

  const [stillLoading, setStillLoading] = useState(false);
  const [stillDone, setStillDone] = useState(false);
  const [vouchLoading, setVouchLoading] = useState(false);
  const [vouchDone, setVouchDone] = useState(false);
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const [helpedConfirmed, setHelpedConfirmed] = useState(false);

  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [showResolve, setShowResolve] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/requests/${id}`)
      .then(r => r.json())
      .then(j => {
        setRequest(j.data ?? null);
        setOffers(j.offers ?? []);
        trackEvent('request_view', id);
      })
      .finally(() => setLoading(false));

    const savedEmail = localStorage.getItem('user_email');
    const myRequests = JSON.parse(localStorage.getItem('my_requests') || '[]');
    setIsOwner(!!savedEmail && myRequests.includes(id));

    const myVouches = JSON.parse(localStorage.getItem('my_vouches') || '[]');
    if (myVouches.includes(id)) {
      setVouchDone(true);
    }

    const savedContact = localStorage.getItem(`offer_contact_${id}`);
    if (savedContact) {
      setOfferResult({ contactMethod: savedContact });
      setHasOffered(true);
    }

    const savedHelped = localStorage.getItem(`helped_${id}`);
    if (savedHelped === '1') {
      setHelpedConfirmed(true);
    }

    if (savedEmail) setOfferEmail(savedEmail);
    const savedName = localStorage.getItem('user_name');
    if (savedName) setOfferName(savedName);
  }, [id]);

  async function handleOffer(attempt = 0) {
    if (!offerMsg.trim() || offerMsg.trim().length < 10) { setOfferError('Please write at least a brief message (10+ chars).'); return; }
    if (!offerEmail.trim()) { setOfferError('Your email or handle is required.'); return; }
    setOfferLoading(true); setOfferError('');
    try {
      const res = await fetch(`/api/requests/${id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: offerMsg, responderEmail: offerEmail, responderName: offerName }),
      });
      const json = await res.json();

      // AI moderator is busy — auto-retry after a short wait (max 3 retries)
      if (res.status === 503 && json.retry && attempt < 3) {
        const wait = (json.retryAfter ?? 4) * 1000;
        setOfferError(`Verifying your message, please wait a moment...`);
        setTimeout(() => handleOffer(attempt + 1), wait);
        return;
      }

      if (!res.ok) { setOfferError(json.error); setOfferLoading(false); return; }
      localStorage.setItem(`offer_contact_${id}`, json.contactMethod);
      if (offerName.trim()) localStorage.setItem('user_name', offerName.trim());
      setOfferResult({ contactMethod: json.contactMethod });
      setHasOffered(true);
      setShowContactResult(true);
      setOffers(prev => [{ id: Date.now(), message: offerMsg, responderName: offerName, submittedAt: new Date().toISOString() }, ...prev]);
      trackEvent('offer_made', id);
    } catch { setOfferError('Failed to submit. Please try again.'); }
    finally {
      // Only stop loading if we're not waiting to retry
      setOfferLoading(prev => attempt >= 3 ? false : prev);
    }
  }

  async function handleReport() {
    if (!reportReason) return;
    setReportLoading(true);
    try {
      await fetch(`/api/requests/${id}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, note: reportNote }),
      });
      setReported(true); setShowReport(false);
      trackEvent('report_filed', id);
    } finally { setReportLoading(false); }
  }

  async function handleStillNeeded() {
    setStillLoading(true);
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'still_needed', submitterEmail: localStorage.getItem('user_email') }),
      });
      setStillDone(true);
      toast.success('Status updated');
      trackEvent('still_needed_clicked', id);
    } catch { toast.error('Failed to update status.'); }
    finally { setStillLoading(false); }
  }

  async function handleResolve() {
    setResolveLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', submitterEmail: localStorage.getItem('user_email') }),
      });
      if (!res.ok) { toast.error('You are not authorized to resolve this request.'); return; }
      setRequest(prev => prev ? { ...prev, status: 'resolved', trustLabel: 'resolved' } : null);
      setShowResolve(false);
      toast.success('Request marked as resolved');
      trackEvent('request_resolved', id);
    } catch { toast.error('Failed to resolve.'); }
    finally { setResolveLoading(false); }
  }

  async function handleVouch() {
    setVouchLoading(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vouch' }),
      });
      const json = await res.json();
      setVouchDone(true);
      const myVouches = JSON.parse(localStorage.getItem('my_vouches') || '[]');
      if (!myVouches.includes(id)) localStorage.setItem('my_vouches', JSON.stringify([...myVouches, id]));
      setConfirmCount(json.confirmCount ?? null);
      toast.success('Thanks for vouching!');
    } finally { setVouchLoading(false); }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: request?.title, url });
    else await navigator.clipboard.writeText(url);
    trackEvent('share', id);
  }

  const inputClass = "w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline text-on-surface outline-none";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }
  if (!request) {
    return (
      <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}>
        <TopNav />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-on-surface-variant">
          <p className="text-xl font-semibold text-on-surface">Request not found</p>
          <button onClick={() => router.push('/feed')} className="bg-primary text-on-primary px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">Back to Feed</button>
        </div>
      </div>
    );
  }

  const isActive = ['active', 'responded', 'needs_review'].includes(request.status);
  const isUrgent = request.urgency === 'urgent';

  return (
    <div className="flex-1 flex flex-col w-full">
      <TopNav />
      <main className="flex-grow w-full max-w-screen-xl mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {justCreated && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium mb-6">
            <CheckCircle2 size={16} /> Your request has been posted! It will appear in the feed shortly.
          </div>
        )}
        {reported && (
          <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium mb-6">
            <Flag size={16} /> Report submitted. Thank you for keeping the community safe.
          </div>
        )}

        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Link 
            href="/feed" 
            className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Back to Feed
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold text-on-background mb-2 flex flex-wrap items-center gap-3" style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {request.title}
                {request.trustLabel === 'user_confirmed' && (
                  <span title="Verified by Admin" className="text-primary flex shrink-0">
                    <ShieldCheck size={28} strokeWidth={2.5} />
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
                <span className="flex items-center gap-1"><Clock size={14} /> {formatRelativeTime(request.createdAt)}</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {request.locationLabel}</span>
              </div>
            </div>
            {isUrgent && (
              <div className="bg-error-container text-on-error-container text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full flex items-center gap-1 w-fit shrink-0">
                <AlertCircle size={14} /> High Urgency
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid md:grid-cols-3 gap-8"
        >
          <div className="md:col-span-2 flex flex-col gap-6">
            <motion.section variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant shadow-sm">
              <h2 className="text-lg font-semibold text-on-background mb-3">The Full Story</h2>
              <p className="text-base text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {request.description}
              </p>
            </motion.section>

            <motion.section variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant shadow-sm">
              <h2 className="text-lg font-semibold text-on-background mb-6">What to Expect</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex items-center justify-center shrink-0">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-on-background mb-1">Category</h3>
                    <p className="text-sm text-on-surface-variant capitalize">{request.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-on-background mb-1">Type</h3>
                    <p className="text-sm text-on-surface-variant">{request.type === 'ASK' ? 'Asking for help' : 'Offering help'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary-container text-on-primary-container p-2 rounded-full flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-on-background mb-1">Urgency Level</h3>
                    <p className="text-sm text-on-surface-variant capitalize">{request.urgency}</p>
                  </div>
                </div>
              </div>
            </motion.section>

            {request.sourceUrl && (
              <a href={request.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-4 mt-2 w-full bg-primary-fixed text-primary rounded-full text-base font-bold hover:bg-primary hover:text-on-primary transition-colors shadow-sm border border-primary/20">
                <ExternalLink size={18} /> 
                {request.sourcePlatform === 'none' || request.sourcePlatform === 'other' || !request.sourcePlatform
                  ? 'View original post'
                  : `View original post on ${platformLabels[request.sourcePlatform as keyof typeof platformLabels] || request.sourcePlatform}`}
              </a>
            )}

            {(() => {
              const tl = request.trustLabel;
              const configs: Record<string, any> = {
                source_provided: { icon: <Search size={22} className="text-primary mt-0.5 shrink-0" />, title: 'Source provided', body: 'The requester linked back to an original social media post.', cls: 'bg-primary-fixed border-outline-variant' },
                user_confirmed: { icon: <ShieldCheck size={22} className="text-primary mt-0.5 shrink-0" />, title: 'Verified by Admin', body: 'This request has been reviewed and approved by a moderator.', cls: 'bg-primary/10 border-primary/20' },
                recently_updated: { icon: <History size={22} className="text-secondary mt-0.5 shrink-0" />, title: 'Recently updated', body: 'The requester confirmed this request is current.', cls: 'bg-secondary-container border-outline-variant' },
                needs_review: { icon: <Clock size={22} className="text-orange-600 mt-0.5 shrink-0" />, title: 'Needs review', body: 'This request was just posted and hasn\'t been checked yet.', cls: 'bg-orange-100 border-orange-200' },
                reported: { icon: <AlertTriangle size={22} className="text-error mt-0.5 shrink-0" />, title: 'Reported', body: 'One or more users flagged a concern about this request.', cls: 'bg-error-container border-outline-variant' },
                resolved: { icon: <CheckCircle2 size={22} className="text-outline mt-0.5 shrink-0" />, title: 'Resolved', body: 'The requester or a responder marked this need as met.', cls: 'bg-surface-variant border-outline-variant' },
              };
              const cfg = configs[tl] ?? configs.needs_review;
              return (
                <div className={`border rounded-xl p-6 flex items-start gap-3 ${cfg.cls}`}>
                  {cfg.icon}
                  <div>
                    <h4 className="text-base font-semibold text-on-background mb-1">{cfg.title}</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{cfg.body}</p>
                  </div>
                </div>
              );
            })()}

            {isActive && isOwner === false && (
              <div className="flex gap-3">
                <button onClick={handleVouch} disabled={vouchLoading || vouchDone} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-sm font-medium border border-outline-variant rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50">
                  {vouchDone ? <><CheckCircle2 size={16} className="text-green-600" /><span className="text-xs">Thanks for vouching!</span></> : vouchLoading ? <Loader2 size={16} className="animate-spin" /> : <><span className="flex items-center gap-1"><ShieldCheck size={15} /> Vouch for This</span><span className="text-xs text-outline">{confirmCount !== null ? `${confirmCount} vouche${confirmCount === 1 ? '' : 's'} so far` : request.confirmCount ? `${request.confirmCount} vouche${request.confirmCount === 1 ? '' : 's'} so far` : 'Confirm this request is genuine'}</span></>}
                </button>
                <button onClick={() => setShowReport(true)} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border border-outline-variant rounded-xl text-error hover:bg-error-container/10 transition-colors">
                  <Flag size={16} /> Report
                </button>
              </div>
            )}

            {offers.length > 0 && (
              <div className="mt-4 pt-6 border-t border-outline-variant">
                <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <HandshakeIcon size={20} className="text-secondary" /> Community Help Log ({offers.length})
                </h3>
                <div className={`flex flex-col gap-3 ${offers.length > 5 ? 'max-h-[420px] overflow-y-auto pr-1' : ''}`}>
                  {[...offers].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(offer => (
                    <div key={offer.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
                      <p className="text-sm text-on-surface leading-relaxed">"{offer.message}"</p>
                      <span className="text-xs text-outline font-medium">— {offer.responderName || 'A neighbor'} • {formatRelativeTime(new Date(offer.submittedAt))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {isOwner && isActive && (
              <div className="bg-primary-container text-on-primary-container border border-primary/20 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Manage Your Request</h2>
                  <p className="text-sm opacity-90">Have you received the help you needed? Close this request to let others focus on active needs.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowResolve(true)} disabled={resolveLoading} className="w-full bg-primary text-on-primary font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                    {resolveLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Mark as Resolved
                  </button>
                  <button onClick={handleStillNeeded} disabled={stillLoading || stillDone} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border border-on-primary-container/30 rounded-lg text-on-primary-container hover:bg-on-primary-container/10 transition-colors disabled:opacity-50">
                    {stillDone ? <><CheckCircle2 size={16} /> Bumped successfully</> : stillLoading ? <Loader2 size={16} className="animate-spin" /> : <><RefreshCw size={16} /> Bump / Refresh Date</>}
                  </button>
                </div>
              </div>
            )}

            {(isActive || offerResult) && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4 shadow-sm">
                {offerResult && showContactResult ? (
                  <div className="flex flex-col gap-4 text-center pb-4 border-b border-outline-variant">
                    {helpedConfirmed ? (
                      <>
                        <div className="flex flex-col items-center gap-3 py-2">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle2 size={36} className="text-green-600" /></div>
                          <p className="text-lg font-bold text-on-surface">Thank you! 🎉</p>
                          <p className="text-sm text-on-surface-variant">You've reported helping. This adds a trust badge to the post.</p>
                        </div>
                        <button onClick={() => { setShowContactResult(false); setHelpedConfirmed(false); }} className="text-sm text-secondary border border-outline-variant rounded-full py-2 hover:bg-surface-container transition-colors">Close</button>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={40} className="text-green-600 mx-auto" />
                        <p className="text-lg font-semibold text-on-surface">Here's how to reach them:</p>
                        <div className="bg-primary-fixed rounded-xl p-4 text-base font-semibold text-on-surface break-all">{offerResult.contactMethod}</div>
                        <button onClick={async () => { await handleVouch(); localStorage.setItem(`helped_${id}`, '1'); setHelpedConfirmed(true); }} disabled={vouchLoading || vouchDone} className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                          {vouchLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} {vouchDone ? 'Already confirmed — thank you!' : 'I helped with this!'}
                        </button>
                        <button onClick={() => setShowContactResult(false)} className="text-sm text-secondary border border-outline-variant rounded-full py-2 hover:bg-surface-container transition-colors">Not yet — close</button>
                      </>
                    )}
                  </div>
                ) : !hasOffered && isOwner === false && isActive ? (
                  <div className="flex flex-col gap-4 pb-4 border-b border-outline-variant">
                    <div>
                      <h2 className="text-lg font-semibold text-on-background mb-1">Can you lend a hand?</h2>
                      <p className="text-sm text-on-surface-variant">Join your neighbors and make a difference today.</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <button onClick={() => setShowOffer(true)} className="bg-primary text-on-primary text-lg font-semibold py-4 px-6 rounded-full w-full hover:opacity-90 transition-opacity flex justify-center items-center gap-2">
                        <HandshakeIcon size={20} /> Offer Help
                      </button>
                    </motion.div>
                  </div>
                ) : hasOffered && !showContactResult ? (
                  <div className="flex flex-col gap-3 pb-4 border-b border-outline-variant">
                    <p className="text-sm text-center text-on-surface-variant">You've already offered to help with this request.</p>
                    <button onClick={() => setShowContactResult(true)} className="text-sm text-primary border border-primary/30 rounded-full py-2 hover:bg-primary-fixed transition-colors font-medium">View contact info again</button>
                  </div>
                ) : null}
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <button onClick={handleShare} className="bg-surface text-secondary border border-outline-variant text-lg font-semibold py-4 px-6 rounded-full w-full hover:bg-surface-variant transition-colors">
                    Share with Neighbors
                  </button>
                </motion.div>
              </div>
            )}

            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
              <div className="p-5 border-b border-outline-variant flex items-center gap-3">
                <MapPin size={20} className="text-secondary" />
                <div>
                  <h3 className="text-base font-semibold text-on-background">Location</h3>
                  <p className="text-sm text-on-surface-variant">{request.locationLabel}</p>
                </div>
              </div>
              {request.locationLat && request.locationLng ? (
                <div className="h-48">
                  <MiniMap lat={request.locationLat} lng={request.locationLng} readonly />
                </div>
              ) : (
                <div className="h-48 bg-surface-container-low flex flex-col items-center justify-center gap-2 text-on-surface-variant text-sm">
                  <MapPin size={22} className="text-outline" />
                  <span>No precise location pinned</span>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </main>
      <Footer />

      {/* Offer Modal */}
      {showOffer && !offerResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowOffer(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-on-surface">How can you help?</p>
              <button onClick={() => setShowOffer(false)} className="text-outline hover:text-on-surface"><X size={20} /></button>
            </div>
            <p className="text-sm text-on-surface-variant">Write a brief message, then you'll see how to reach the requester.</p>
            <textarea className={inputClass} rows={4} placeholder="e.g. I have a car and can drive them tomorrow morning…" value={offerMsg} onChange={e => setOfferMsg(e.target.value)} style={{ resize: 'none' }} />
            <input className={inputClass} placeholder="Your email or handle" value={offerEmail} onChange={e => setOfferEmail(e.target.value)} />
            <input className={inputClass} placeholder="Your Name (optional)" value={offerName} onChange={e => setOfferName(e.target.value)} />
            {offerError && <div className="flex items-center gap-2 text-error text-sm"><AlertCircle size={14} /> {offerError}</div>}
            <button className="bg-primary text-on-primary py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2" onClick={() => handleOffer(0)} disabled={offerLoading}>
              {offerLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {offerLoading ? 'Submitting…' : 'Send & See Contact Info'}
            </button>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-on-surface">Report this request</p>
              <button onClick={() => setShowReport(false)} className="text-outline hover:text-on-surface"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map(r => (
                <label key={r.value} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${reportReason === r.value ? 'border-primary bg-primary-fixed' : 'border-outline-variant'}`}>
                  <input type="radio" name="reason" value={r.value} checked={reportReason === r.value} onChange={e => setReportReason(e.target.value)} className="accent-primary" />
                  <span className="text-sm text-on-surface">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea className={inputClass} rows={2} placeholder="Any additional notes? (optional)" value={reportNote} onChange={e => setReportNote(e.target.value)} style={{ resize: 'none' }} />
            <button className="bg-error text-on-error py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2" onClick={handleReport} disabled={!reportReason || reportLoading}>
              {reportLoading ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />} Submit Report
            </button>
          </motion.div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowResolve(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-xl font-bold text-on-surface">Mark as Resolved?</p>
              <button onClick={() => setShowResolve(false)} className="text-outline hover:text-on-surface"><X size={20} /></button>
            </div>
            <div className="bg-primary-container/20 text-on-surface rounded-xl p-4 flex gap-3">
              <CheckCircle2 size={24} className="text-primary shrink-0" />
              <p className="text-sm">Have you received the help you needed? Marking this as resolved will close it and let the community know they can focus on other active requests.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowResolve(false)} className="flex-1 bg-surface text-secondary border border-outline-variant py-3 rounded-full font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleResolve} disabled={resolveLoading} className="flex-1 bg-primary text-on-primary py-3 rounded-full font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {resolveLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function RequestDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col pt-[72px] items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <RequestDetailContent />
    </Suspense>
  );
}
