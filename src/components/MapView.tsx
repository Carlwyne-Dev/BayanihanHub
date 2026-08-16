'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { renderToStaticMarkup } from 'react-dom/server';
import { Heart, Utensils, Package, Home, Info, Car, MoreHorizontal, AlertTriangle, Wrench, PawPrint } from 'lucide-react';
import type { Request } from '@/lib/db/schema';
import { getCategoryColor, TypeBadge, UrgencyChip } from './Badges';

// ─── Constants ────────────────────────────────────────────────────────────────

const URGENCY_COLORS: Record<string, string> = {
  urgent: '#ba1a1a',
  normal: '#4441c4',
  low:    '#777585',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  items:       <Package size={14} color="white" />,
  services:    <Wrench size={14} color="white" />,
  transport:   <Car size={14} color="white" />,
  food:        <Utensils size={14} color="white" />,
  health:      <Heart size={14} color="white" />,
  shelter:     <Home size={14} color="white" />,
  pets:        <PawPrint size={14} color="white" />,
  information: <Info size={14} color="white" />,
  other:       <MoreHorizontal size={14} color="white" />,
};

// ─── Icon builder ─────────────────────────────────────────────────────────────

function buildIcon(category: string, isUrgent: boolean, type: 'ASK' | 'OFFER', anim: 'in' | 'out' | 'none', delay = 0) {
  const bg = isUrgent ? URGENCY_COLORS.urgent : getCategoryColor(category as any);
  const iconNode = isUrgent
    ? <AlertTriangle size={18} color="white" />
    : (CATEGORY_ICONS[category] || CATEGORY_ICONS.other);
  const size = isUrgent ? 36 : 28;
  const borderRadius = isUrgent ? '50%' : (type === 'ASK' ? '50%' : '8px');

  const html = renderToStaticMarkup(
    <div 
      className={`inner-marker ${anim === 'in' ? 'anim-in' : anim === 'out' ? 'anim-out' : ''}`} 
      style={{
        backgroundColor: bg, width: `${size}px`, height: `${size}px`, borderRadius,
        animationDelay: `${delay}ms`
      }}
    >
      {iconNode}
    </div>
  );
  return L.divIcon({ html, className: 'leaflet-marker-anim', iconSize: [0, 0], popupAnchor: [0, -size / 2] });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'on' | 'leaving';
type MarkerEntry = Request & { phase: Phase };

// ─── MapView ──────────────────────────────────────────────────────────────────

export default function MapView({ filter }: { filter: string }) {
  const [markerMap, setMarkerMap] = useState<Map<string, MarkerEntry>>(new Map());
  const [userLoc, setUserLoc]     = useState<[number, number] | null>(null);
  const leaveTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconRef                   = useRef<Map<string, L.DivIcon>>(new Map());

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos =>
        setUserLoc([pos.coords.latitude, pos.coords.longitude])
      );
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== 'all' && filter !== 'urgent') params.set('category', filter);
    if (filter === 'urgent') params.set('urgency', 'urgent');

    let isMounted = true;
    fetch(`/api/requests?${params}&limit=50`)
      .then(r => r.json())
      .then(j => {
        if (!isMounted) return;
        const incoming: Request[] = (j.data ?? []).filter((r: Request) => r.locationLat && r.locationLng);
        const incomingIds = new Set(incoming.map(r => r.id));

        setMarkerMap(prev => {
          const next = new Map<string, MarkerEntry>();
          let enterIdx = 0;

          // 1. Process existing markers
          prev.forEach((entry, id) => {
            if (incomingIds.has(id)) {
              next.set(id, { ...entry, phase: 'on' });
            } else {
              next.set(id, { ...entry, phase: 'leaving' });
              iconRef.current.set(id, buildIcon(entry.category, entry.urgency === 'urgent', entry.type, 'out'));
            }
          });

          // 2. Process new markers
          incoming.forEach(r => {
            if (!prev.has(r.id)) {
              next.set(r.id, { ...r, phase: 'on' });
              if (!iconRef.current.has(r.id)) {
                iconRef.current.set(r.id, buildIcon(r.category, r.urgency === 'urgent', r.type, 'in', enterIdx * 35));
                enterIdx++;
              }
            }
          });

          return next;
        });

        // 3. Purge leaving markers
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        leaveTimer.current = setTimeout(() => {
          setMarkerMap(prev => {
            const next = new Map<string, MarkerEntry>();
            prev.forEach((entry, id) => {
              if (entry.phase !== 'leaving') {
                next.set(id, entry);
              } else {
                iconRef.current.delete(id);
              }
            });
            return next;
          });
        }, 380);
      });

    return () => { 
      isMounted = false;
      if (leaveTimer.current) clearTimeout(leaveTimer.current); 
    };
  }, [filter]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .inner-marker {
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          transform: translate(-50%,-50%);
          cursor: pointer;
          transition: filter 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .anim-in {
          animation: markerPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .anim-out {
          animation: markerPopOut 0.3s ease-out forwards;
        }
        @keyframes markerPopIn {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.5); }
          100% { opacity: 1; transform: translate(-50%,-50%) scale(1);   }
        }
        @keyframes markerPopOut {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1);   }
          100% { opacity: 0; transform: translate(-50%,-50%) scale(0.5); }
        }
        .leaflet-marker-anim > div:hover .inner-marker {
          filter: brightness(1.1);
          box-shadow: 0 6px 12px rgba(0,0,0,0.5) !important;
          transform: translate(-50%,-50%) scale(1.1) !important;
        }
      `}} />
      <MapContainer center={[14.5995, 120.9842]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
        <MapUpdater loc={userLoc} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {Array.from(markerMap.values()).map(r => (
          <Marker
            key={r.id}
            position={[r.locationLat!, r.locationLng!]}
            icon={iconRef.current.get(r.id) ?? buildIcon(r.category, r.urgency === 'urgent', r.type, 'none')}
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

// ─── MapUpdater ───────────────────────────────────────────────────────────────

function MapUpdater({ loc }: { loc: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (loc) map.flyTo(loc, 14, { duration: 1.5 }); }, [loc, map]);
  return null;
}
