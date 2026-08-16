'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { renderToStaticMarkup } from 'react-dom/server';
import { Heart, Utensils, Package, Home, Info, Car, MoreHorizontal, AlertTriangle, HandHeart } from 'lucide-react';
import type { Request } from '@/lib/db/schema';
import { getCategoryColor, TypeBadge, UrgencyChip } from './Badges';

const URGENCY_COLORS: Record<string, string> = {
  urgent: '#ba1a1a',
  normal: '#4441c4',
  low:    '#777585',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  health: <Heart size={15} color="white" />,
  food: <Utensils size={15} color="white" />,
  supplies: <Package size={15} color="white" />,
  shelter: <Home size={15} color="white" />,
  information: <Info size={15} color="white" />,
  transport: <Car size={15} color="white" />,
  other: <MoreHorizontal size={15} color="white" />,
};

function getMarkerIcon(category: string, isUrgent: boolean) {
  const bg = isUrgent ? URGENCY_COLORS.urgent : getCategoryColor(category as any);
  const iconNode = isUrgent ? <AlertTriangle size={18} color="white" /> : (CATEGORY_ICONS[category] || CATEGORY_ICONS.other);
  const size = isUrgent ? 36 : 28;
  
  const html = renderToStaticMarkup(
    <div style={{
      backgroundColor: bg,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
      boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
      transform: 'translate(-50%, -50%)',
    }}>
      {iconNode}
    </div>
  );
  
  return L.divIcon({
    html,
    className: '', // prevent default leaflet styles
    iconSize: [0, 0], // handled by CSS transform
    popupAnchor: [0, -size / 2],
  });
}

interface MapViewProps {
  filter: string;
}

export default function MapView({ filter }: MapViewProps) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== 'all' && filter !== 'urgent') params.set('category', filter);
    if (filter === 'urgent') params.set('urgency', 'urgent');
    fetch(`/api/requests?${params}&limit=50`)
      .then(r => r.json())
      .then(j => setRequests((j.data ?? []).filter((r: Request) => r.locationLat && r.locationLng)));
  }, [filter]);

  return (
    <>
    <style>{`
      .leaflet-marker-icon > div { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      .leaflet-marker-icon > div:hover { transform: translate(-50%, -50%) scale(1.15) !important; box-shadow: 0 6px 12px rgba(0,0,0,0.4) !important; z-index: 1000 !important; }
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
      {requests.map(r => (
        <Marker
          key={r.id}
          position={[r.locationLat!, r.locationLng!]}
          icon={getMarkerIcon(r.category, r.urgency === 'urgent')}
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
