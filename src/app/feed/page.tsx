'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Clock, ArrowRight, HeartHandshake, Navigation, Loader2, AlertTriangle, ChevronDown, HandHeart, Share2, PlusCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';
import { RequestCardSkeleton } from '@/components/RequestCard';
import type { Request } from '@/lib/db/schema';
import { formatRelativeTime } from '@/lib/utils';

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(km: number) {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

const CATEGORIES = [
  { key: 'all',         label: 'All Requests' },
  { key: 'items',       label: 'Items' },
  { key: 'services',    label: 'Services' },
  { key: 'transport',   label: 'Transport' },
  { key: 'food',        label: 'Food' },
  { key: 'health',      label: 'Health' },
  { key: 'shelter',     label: 'Shelter' },
  { key: 'pets',        label: 'Pets' },
  { key: 'information', label: 'Info' },
  { key: 'other',       label: 'Other' },
];

const URGENCY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  urgent:  { bg: 'bg-error-container',     text: 'text-on-error-container', label: 'Urgent' },
  normal:  { bg: 'bg-surface-variant',     text: 'text-on-surface-variant', label: 'Normal' },
  low:     { bg: 'bg-surface-container',   text: 'text-secondary',          label: 'Low' },
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  active:     { bg: 'bg-primary/10',            text: 'text-primary' },
  responded:  { bg: 'bg-primary/10',            text: 'text-primary' },
  resolved:   { bg: 'bg-secondary-container/50', text: 'text-secondary' },
  expired:    { bg: 'bg-surface-container',      text: 'text-secondary' },
  reported:   { bg: 'bg-error-container/50',     text: 'text-on-error-container' },
  needs_review: { bg: 'bg-surface-variant',      text: 'text-secondary' },
};

function FeedContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('q') || '';

  const [requests, setRequests] = useState<Request[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState<'nearest' | 'urgent' | 'latest'>('latest');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [stats, setStats] = useState({ volunteers: 0, resolvedPercentage: 0, urgentAlerts: 0 });
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Try to get location silently on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
        setActiveSort('nearest'); // auto-switch to nearest when location granted
      },
      () => setLocationLoading(false),
      { timeout: 5000 }
    );
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (activeSort === 'nearest' && userCoords) {
        params.set('lat', String(userCoords.lat));
        params.set('lng', String(userCoords.lng));
      }
      if (queryParam) params.set('q', queryParam);
      params.set('limit', '50');
      const res = await fetch(`/api/requests?${params}`);
      const data = await res.json();
      let rows: Request[] = data.data ?? [];
      // Client-side secondary sort for urgent (show all urgencies but sorted)
      if (activeSort === 'urgent') {
        const urgencyScore: Record<string, number> = { urgent: 0, normal: 1, low: 2 };
        rows = [...rows].sort((a, b) => (urgencyScore[a.urgency] ?? 1) - (urgencyScore[b.urgency] ?? 1));
        // Remove urgency filter we sent, re-fetch all
      }
      setRequests(rows);
      
      const statsRes = await fetch('/api/stats');
      const statsJson = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsJson);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeSort, userCoords, queryParam]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <TopNav />

      <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 md:px-12 pt-4 pb-28 md:py-12 flex flex-col md:flex-row gap-12">
        {/* ── Sidebar (desktop only) ── */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6">
          {/* Ask Card */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface mb-1">Make a Post</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Ask the community for assistance, or offer supplies and manpower to those nearby.
            </p>
            <div className="flex flex-col gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/ask"
                  className="w-full bg-primary text-on-primary text-base font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm block"
                >
                  <span className="flex items-center justify-center gap-2"><HeartHandshake size={18} /> Ask for Help</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/ask?type=offer"
                  className="w-full bg-surface text-primary border-2 border-primary text-base font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors shadow-sm block"
                >
                  <span className="flex items-center justify-center gap-2"><HandHeart size={18} /> Offer Help</span>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-surface rounded-xl p-6 border border-outline-variant">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Community Stats</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex justify-between items-center border-b border-surface-variant pb-4">
                <span className="text-sm text-on-surface-variant">Active Volunteers</span>
                <span className="text-lg font-semibold text-primary">{stats.volunteers || 0}</span>
              </li>
              <li className="flex justify-between items-center border-b border-surface-variant pb-4">
                <span className="text-sm text-on-surface-variant">Requests Resolved</span>
                <span className="text-lg font-semibold text-primary">{stats.resolvedPercentage || 0}%</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Nearby Alerts</span>
                <span className="text-xs font-semibold bg-error-container text-on-error-container px-2 py-1 rounded-full">{stats.urgentAlerts || 0} High</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* ── Feed ── */}
        <section className="flex-1 flex flex-col">
          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-4xl font-semibold text-on-background mb-2 md:mb-6" style={{ letterSpacing: '-0.02em' }}>
              What&apos;s needed nearby
            </h1>
            <p className="text-sm text-on-surface-variant mb-6 md:hidden">See how you can help or ask for support.</p>

            {/* Filter chips row — scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 md:mx-0 px-4 md:px-0 md:flex-wrap mb-3" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`text-sm px-4 py-2 rounded-full border transition-colors whitespace-nowrap shrink-0 ${
                    activeCategory === key
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface text-on-surface border-outline-variant hover:bg-surface-variant'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-on-surface-variant">
                {loading ? 'Loading…' : `${requests.length} result${requests.length !== 1 ? 's' : ''}`}
              </span>
              {/* Sort dropdown */}
              <div className="relative shrink-0" ref={sortRef}>
                {(() => {
                  const SORT_OPTIONS = [
                    { key: 'latest'  as const, label: 'Latest',      Icon: Clock         },
                    { key: 'nearest' as const, label: 'Nearest',     Icon: Navigation    },
                    { key: 'urgent'  as const, label: 'Most Urgent', Icon: AlertTriangle  },
                  ];
                  const active = SORT_OPTIONS.find(o => o.key === activeSort)!;
                  return (
                    <>
                      <button
                        onClick={() => setShowSortMenu(v => !v)}
                        className="flex items-center gap-2 text-sm font-medium bg-surface border border-outline-variant rounded-lg px-3 py-2 text-on-surface hover:bg-surface-variant transition-colors"
                      >
                        {activeSort === 'nearest' && locationLoading
                          ? <Loader2 size={14} className="animate-spin" />
                          : <active.Icon size={14} />}
                        {active.label}
                        <ChevronDown size={13} className={`text-outline transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showSortMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-30 overflow-hidden min-w-[160px]">
                          {SORT_OPTIONS.map(({ key, label, Icon }) => (
                            <button
                              key={key}
                              onClick={() => {
                                setActiveSort(key);
                                setShowSortMenu(false);
                                if (key === 'nearest' && !userCoords) {
                                  setLocationLoading(true);
                                  navigator.geolocation?.getCurrentPosition(
                                    (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationLoading(false); },
                                    () => setLocationLoading(false)
                                  );
                                }
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                activeSort === key
                                  ? 'bg-primary-fixed text-primary font-semibold'
                                  : 'text-on-surface hover:bg-surface-container'
                              }`}
                            >
                              <Icon size={14} />
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Cards */}
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            className="flex flex-col gap-4"
          >
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <RequestCardSkeleton key={i} />)
            ) : requests.length === 0 ? (
              <div className="text-center py-24 text-on-surface-variant">
                <p className="text-lg font-semibold mb-2">No requests yet</p>
                <p className="text-sm">Be the first to post a request for your community.</p>
              </div>
            ) : (
              <AnimatePresence>
              {requests.slice(0, visibleCount).map((r) => {
                const urgency = URGENCY_STYLE[r.urgency] ?? URGENCY_STYLE.normal;
                const status  = STATUS_STYLE[r.status]  ?? STATUS_STYLE.active;
                const isResolved = r.status === 'resolved' || r.status === 'expired';
                const distKm = (userCoords && r.locationLat && r.locationLng)
                  ? haversineKm(userCoords.lat, userCoords.lng, r.locationLat, r.locationLng)
                  : null;

                return (
                  <motion.article
                    layout
                    variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={!isResolved ? { y: -2, scale: 1.005 } : {}}
                    whileTap={!isResolved ? { scale: 0.99 } : {}}
                    key={r.id}
                    className={`bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm transition-colors flex flex-col gap-3 ${isResolved ? 'opacity-65' : ''}`}
                  >
                    {/* Top row: urgency + category + time */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.urgency === 'urgent' && (
                        <span className={`inline-flex items-center gap-1 ${urgency.bg} ${urgency.text} text-xs font-semibold tracking-wide uppercase px-2 py-1 rounded`}>
                          <AlertTriangle size={11} />
                          {urgency.label}
                        </span>
                      )}
                      {r.type === 'OFFER' && (
                        <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container text-xs font-semibold px-2 py-1 rounded">
                          <HeartHandshake size={11} />
                          Offering
                        </span>
                      )}
                      <span className="bg-surface-container-high text-on-surface-variant text-xs font-semibold px-2 py-1 rounded capitalize">
                        {r.category}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-xs text-on-surface-variant">
                        <Clock size={12} />
                        {formatRelativeTime(r.createdAt)}
                      </span>
                    </div>

                    {/* Title + description */}
                    <div>
                      <h2 className="text-base font-semibold text-on-surface leading-snug mb-1 flex items-center gap-2">
                        {r.title}
                        {(r.trustLabel === 'user_confirmed' || (r.trustLabel === 'recently_updated' && r.status === 'active')) && (
                          <span title="Verified by Admin" className="text-primary flex shrink-0">
                            <ShieldCheck size={16} strokeWidth={2.5} />
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-on-surface-variant line-clamp-2">{r.description}</p>
                    </div>

                    {/* Location + status footer */}
                    <div className="flex items-center gap-2 border-t border-surface-variant pt-3 text-sm text-on-surface-variant">
                      <MapPin size={15} />
                      <span>{r.locationLabel}</span>
                      <span className="w-1 h-1 bg-outline-variant rounded-full mx-1" />
                      <span className={`font-semibold ${status.text} capitalize`}>
                        {r.status.replace('_', ' ')}
                      </span>
                      {distKm !== null && (
                        <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary">
                          <Navigation size={10} />
                          {distKm < 0.3 ? 'Near you' : formatDist(distKm)}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    {!isResolved && (
                      <div className="flex gap-2 items-center">
                        <Link
                          href={`/request/${r.id}`}
                          className={`ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                            r.type === 'OFFER'
                              ? 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container'
                              : 'bg-primary text-on-primary hover:opacity-90'
                          }`}
                        >
                          {r.type === 'OFFER' ? 'Contact' : 'View Details'}
                        </Link>
                        <button
                          className="p-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors"
                          aria-label="Share"
                          onClick={() => navigator.share?.({ title: r.title, url: `/request/${r.id}` })}
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                    )}
                  </motion.article>
                );
              })}
              </AnimatePresence>
            )}
          </motion.div>

          {requests.length > visibleCount && (
            <button 
              onClick={handleLoadMore}
              className="mt-6 w-full py-3 text-sm font-semibold text-on-surface-variant border border-outline-variant rounded-xl hover:bg-surface-container transition-colors"
            >
              Load More Requests
            </button>
          )}
        </section>
      </main>

      {/* Floating action buttons (mobile) */}
      <div className="fixed bottom-24 right-5 flex flex-col gap-3 md:hidden z-40">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link
            href="/ask?type=offer"
            className="w-14 h-14 bg-secondary-container text-on-secondary-container rounded-2xl shadow-md flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Offer Help"
          >
            <HandHeart size={24} />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link
            href="/ask"
            className="w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-md flex items-center justify-center hover:opacity-90 transition-opacity"
            aria-label="Ask for Help"
          >
            <HeartHandshake size={26} />
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col pt-[72px] pb-24 items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <FeedContent />
    </Suspense>
  );
}
