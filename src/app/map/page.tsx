'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { TopNav } from '@/components/TopNav';

type MapViewProps = { filter: string };

// Leaflet must be loaded client-side only (no SSR)
const MapView = dynamic<MapViewProps>(() => import('../../components/MapView'), { ssr: false, loading: () => (
  <div className="flex-1 flex items-center justify-center bg-surface-container-low text-outline w-full h-full">
    Loading map…
  </div>
)});

const FILTERS = [
  { key: 'all',         label: 'All Requests' },
  { key: 'urgent',      label: 'Urgent' },
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

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* Desktop TopNav */}
      <div className="hidden md:block shrink-0 relative z-[9999]">
        <TopNav />
      </div>

      {/* ── Full-screen map ── */}
      <div className="flex-1 relative w-full overflow-hidden">

        {/* Floating top bar */}
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }} className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 flex flex-col gap-2">
          {/* Search bar — hidden on desktop because TopNav has one */}
          <div className="md:hidden flex items-center gap-2 bg-surface/90 backdrop-blur-md rounded-xl border border-outline-variant shadow-sm px-4 h-14">
            <Search size={18} className="text-outline shrink-0" />
            <input
              type="text"
              placeholder="Search requests..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-base text-on-surface placeholder:text-outline outline-none"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto py-2 px-1 -mx-1 no-scrollbar">
            {FILTERS.map(f => (
              <motion.button
                key={f.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(f.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors shadow-sm backdrop-blur-sm ${ 
                  activeFilter === f.key
                    ? f.key === 'urgent'
                      ? 'bg-error text-on-error border-error'
                      : 'bg-primary text-on-primary border-primary'
                    : f.key === 'urgent'
                    ? 'bg-surface/90 border-error text-error hover:bg-error-container'
                    : 'bg-surface/90 border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {f.key === 'urgent' && <span className="w-2 h-2 rounded-full bg-current" />}
                {f.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Map */}
        <div className="w-full h-full">
          <MapView filter={activeFilter} />
        </div>
      </div>
    </div>
  );
}
