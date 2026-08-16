'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { renderToStaticMarkup } from 'react-dom/server';
import { Heart, Utensils, Package, Home, Info, Car, MoreHorizontal, AlertTriangle, HandHeart, Wrench, PawPrint } from 'lucide-react';
import type { Request } from '@/lib/db/schema';
import { getCategoryColor, TypeBadge, UrgencyChip } from './Badges';

const URGENCY_COLORS: Record<string, string> = {
  urgent: '#ba1a1a',
  normal: '#4441c4',
  low:    '#777585',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  items: <Package size={14} color="white" />,
  services: <Wrench size={14} color="white" />,
  transport: <Car size={14} color="white" />,
  food: <Utensils size={14} color="white" />,
  health: <Heart size={14} color="white" />,
  shelter: <Home size={14} color="white" />,
  pets: <PawPrint size={14} color="white" />,
  information: <Info size={14} color="white" />,
  other: <MoreHorizontal size={14} color="white" />,
};

// Inject keyframes once into <head>
const KEYFRAMES = `
  @keyframes markerPopIn {
    0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
    60%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
    80%  { transform: translate(-50%, -50%) scale(0.9); }
    100% { transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes markerPopOut {
    0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
  }
`;

if (typeof document !== 'undefined' && !document.getElementById('marker-keyframes')) {
  const style = document.createElement('style');
  style.id = 'marker-keyframes';
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

function getMarkerIcon(category: string, isUrgent: boolean, type: 'ASK' | 'OFFER', delay = 0) {
  const bg = isUrgent ? URGENCY_COLORS.urgent : getCategoryColor(category as any);
  const iconNode = isUrgent ? <AlertTriangle size={18} color="white" /> : (CATEGORY_ICONS[category] || CATEGORY_ICONS.other);
  const size = isUrgent ? 36 : 28;
  
  // ASK is circle, OFFER is rounded square (squircle)
  const borderRadius = isUrgent ? '50%' : (type === 'ASK' ? '50%' : '8px');
  
  const html = renderToStaticMarkup(
    <div style={{
      backgroundColor: bg,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
      transform: 'translate(-50%, -50%)',
      animation: `markerPopIn 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}ms both`,
      cursor: 'pointer',
      transition: 'box-shadow 0.2s ease, filter 0.2s ease',
    }}>
      {iconNode}
    </div>
  );
  
  return L.divIcon({
    html,
    className: 'leaflet-marker-animated', // prevent default leaflet styles
    iconSize: [0, 0], // handled by CSS transform
    popupAnchor: [0, -size / 2],
  });
}

interface MapViewProps {
  filter: string;
}

export default function MapView({ filter }: MapViewProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [visibleRequests, setVisibleRequests] = useState<Request[]>([]);
  const [filterKey, setFilterKey] = useState(0);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  useEffect(() => {
    // Step 1: fade out current markers instantly by clearing them
    setVisibleRequests([]);

    const params = new URLSearchParams();
    if (filter !== 'all' && filter !== 'urgent') params.set('category', filter);
    if (filter === 'urgent') params.set('urgency', 'urgent');

    fetch(`/api/requests?${params}&limit=50`)
      .then(r => r.json())
      .then(j => {
        const newRequests = (j.data ?? []).filter((r: Request) => r.locationLat && r.locationLng);
        setRequests(newRequests);
        // Step 2: bump the key so markers remount with fresh animation
        setFilterKey(k => k + 1);
        // Step 3: show new markers after a tiny gap (enough for old ones to clear)
        setTimeout(() => setVisibleRequests(newRequests), 50);
      });
  }, [filter]);

  return (
    <>
    <style>{`
      .leaflet-marker-animated > div:hover {
        filter: brightness(1.15);
        box-shadow: 0 6px 16px rgba(0,0,0,0.45) !important;
      }
    `}</style>
    <MapContainer
      center={[14.5995, 120.9842]} // Manila default
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <MapUpdater loc={userLoc} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {visibleRequests.map((r, i) => (
        <Marker
          key={`${filterKey}-${r.id}`}
          position={[r.locationLat!, r.locationLng!]}
          icon={getMarkerIcon(r.category, r.urgency === 'urgent', r.type, i * 30)}
        >
          <Popup>
            <div className="font-sans min-w-[220px]">
              <div className="flex items-center gap-1.5 mb-2">
                <TypeBadge type={r.type} />
                <UrgencyChip urgency={r.urgency} />
              </div>
              <p className="font-semibold text-sm mb-1 leading-tight">{r.title}</p>
              <p className="text-xs text-secondary mb-3">{r.locationLabel}</p>
              <Link href={`/request/${r.id}`} className="text-primary font-semibold text-[13px] hover:underline inline-flex items-center gap-1">
                View details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    </>
  );
}

function MapUpdater({ loc }: { loc: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (loc) {
      map.flyTo(loc, 14, { duration: 1.5 });
    }
  }, [loc, map]);
  return null;
}

