'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import type { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type MiniMapProps = {
  lat: number;
  lng: number;
  onChange?: (lat: number, lng: number) => void;
  readonly?: boolean;
};

function MapEvents({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

export default function MiniMap({ lat, lng, onChange, readonly = false }: MiniMapProps) {
  const initialCenter = useRef<[number, number]>([lat, lng]).current;
  const [mapKey] = useState(() => `minimap-${Math.random().toString(36).substring(7)}`);
  const [icon, setIcon] = useState<Icon | null>(null);

  // Set up Leaflet icon only after mount (avoids SSR / DOM-not-ready crash)
  useEffect(() => {
    // Dynamic import so Leaflet never runs server-side or before DOM is ready
    import('leaflet').then((L) => {
      setIcon(L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      }));
    });
  }, []);

  // Don't render the map until the icon is ready — avoids the appendChild crash
  if (!icon) return <div className="w-full h-full bg-surface-container-low animate-pulse" />;

  return (
    <MapContainer
      key={mapKey}
      center={initialCenter}
      zoom={15}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      dragging={!readonly}
      scrollWheelZoom={!readonly}
      doubleClickZoom={!readonly}
      touchZoom={!readonly}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <Marker
        position={[lat, lng]}
        icon={icon}
        draggable={!readonly}
        eventHandlers={readonly || !onChange ? {} : {
          dragend(e) {
            const pos = e.target.getLatLng();
            onChange!(pos.lat, pos.lng);
          },
        }}
      />
      {!readonly && onChange && <MapEvents onChange={onChange} />}
      <MapUpdater lat={lat} lng={lng} />
    </MapContainer>
  );
}
