'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { LocateFixed, Loader2, MapPin, Search } from 'lucide-react';

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container-low animate-pulse flex items-center justify-center text-sm text-outline rounded-lg">
      Loading map…
    </div>
  ),
});

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

type LocationPickerProps = {
  label: string;
  lat: number | null;
  lng: number | null;
  onChange: (label: string, lat: number | null, lng: number | null) => void;
};

const DEFAULT_LAT = 14.5995; // Manila fallback only
const DEFAULT_LNG = 120.9842;

export function LocationPicker({ label, lat, lng, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState(label);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [defaultLat, setDefaultLat] = useState(DEFAULT_LAT);
  const [defaultLng, setDefaultLng] = useState(DEFAULT_LNG);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether the last query change came from the user (true) or AI/external (false)
  const isUserTyping = useRef(false);
  const prevLabel = useRef(label);

  // On mount, silently try to get user's real location for the map default
  useEffect(() => {
    if (!lat && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDefaultLat(pos.coords.latitude);
          setDefaultLng(pos.coords.longitude);
          // Auto-fill the form with their real location
          reverseGeocode(pos.coords.latitude, pos.coords.longitude).finally(() => setLocating(false));
        },
        () => { setLocating(false); /* silent fail — keep Manila fallback */ },
        { timeout: 5000 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the AI/parent changes the label externally, auto-geocode it
  useEffect(() => {
    if (label === prevLabel.current) return; // no change
    prevLabel.current = label;

    // If the new label matches what the user is typing, don't interfere with autocomplete
    if (label === query) return;

    isUserTyping.current = false;
    setQuery(label);

    if (!label || label.trim().length < 2) return;

    // Auto-search & auto-pin
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        let res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(label)}&limit=5`,
          { headers: { 'User-Agent': 'BayanihanHubAI/1.0' } }
        );
        let data: Suggestion[] = await res.json();

        // Fallback: if no results and has comma, try searching just the broader area
        if (data.length === 0 && label.includes(',')) {
          const parts = label.split(',');
          const broaderQuery = parts[parts.length - 1].trim();
          if (broaderQuery.length > 2) {
            res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(broaderQuery)}&limit=5`,
              { headers: { 'User-Agent': 'BayanihanHubAI/1.0' } }
            );
            data = await res.json();
          }
        }

        if (data.length > 0) {
          // Always auto-pin the best match so the map moves, but keep the user's specific label
          const s = data[0];
          onChange(label, parseFloat(s.lat), parseFloat(s.lon));
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch {
        // silent fail — user can still type manually
      } finally {
        setSearching(false);
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  // Live search autocomplete — only fires when user is actually typing
  useEffect(() => {
    if (!isUserTyping.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        let res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { 'User-Agent': 'BayanihanHubAI/1.0' } }
        );
        let data: Suggestion[] = await res.json();

        // Fallback for live search
        if (data.length === 0 && query.includes(',')) {
          const parts = query.split(',');
          const broaderQuery = parts[parts.length - 1].trim();
          if (broaderQuery.length > 2) {
            res = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(broaderQuery)}&limit=5`,
              { headers: { 'User-Agent': 'BayanihanHubAI/1.0' } }
            );
            data = await res.json();
          }
        }

        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handleSelect(s: Suggestion) {
    const newLat = parseFloat(s.lat);
    const newLng = parseFloat(s.lon);
    const cleanLabel = s.display_name.split(', ').slice(0, 3).join(', ');
    isUserTyping.current = false;
    setQuery(cleanLabel);
    setSuggestions([]);
    setShowDropdown(false);
    onChange(cleanLabel, newLat, newLng);
  }

  async function reverseGeocode(rlat: number, rlng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${rlat}&lon=${rlng}`,
        { headers: { 'User-Agent': 'BayanihanHubAI/1.0' } }
      );
      const data = await res.json();
      const cleanLabel = data?.display_name
        ? data.display_name.split(', ').slice(0, 3).join(', ')
        : 'Selected Location';
      isUserTyping.current = false;
      setQuery(cleanLabel);
      onChange(cleanLabel, rlat, rlng);
    } catch {
      setQuery('Selected Location');
      onChange('Selected Location', rlat, rlng);
    }
  }

  function handleUseLocation() {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        reverseGeocode(pos.coords.latitude, pos.coords.longitude).finally(() => setLocating(false));
      },
      () => {
        alert('Could not get your location. Please check your browser permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const mapLat = lat ?? defaultLat;
  const mapLng = lng ?? defaultLng;

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar + GPS button */}
      <div className="flex gap-2 relative">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none z-10" />
          <input
            className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-10 py-4 text-base focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-outline text-on-surface outline-none"
            placeholder="Search for a barangay, street, or landmark…"
            value={query}
            onChange={(e) => {
              isUserTyping.current = true;
              setQuery(e.target.value);
              onChange(e.target.value, lat, lng);
            }}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            autoComplete="off"
            required
          />
          {searching && (
            <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-outline" />
          )}

          {/* Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+4px)] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-surface-container cursor-pointer border-b border-outline-variant last:border-0 transition-colors"
                >
                  <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-on-surface leading-snug">{s.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Use My Location */}
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locating}
          title="Use my current GPS location"
          className="shrink-0 w-14 bg-surface-container border border-outline-variant rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary hover:border-primary transition-all"
        >
          {locating ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
        </button>
      </div>

      {/* Mini map — always visible */}
      <div className="h-56 w-full rounded-xl border border-outline-variant overflow-hidden relative z-0 shadow-sm">
        <MiniMap lat={mapLat} lng={mapLng} onChange={reverseGeocode} />
        {lat === null && (
          <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-4">
            <span className="bg-inverse-surface text-inverse-on-surface text-xs font-medium px-3 py-1.5 rounded-full opacity-80">
              Search above or tap map to drop a pin
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
