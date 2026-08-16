'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Bell, Settings, User, Heart, FileText, ChevronRight, X, Menu, Loader2, MapPin } from 'lucide-react';
import Image from 'next/image';
import type { Request } from '@/lib/db/schema';

const NAV_LINKS = [
  { href: '/',         label: 'Requests' },
  { href: '/map',      label: 'Map' },
  { href: '/ask',      label: 'Post Request', primary: true },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams?.get('q') || '';

  const [showMenu, setShowMenu] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [suggestions, setSuggestions] = useState<Request[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim() === '') {
      setShowSuggestions(false);
      router.push('/');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    router.push('/feed');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/feed?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/requests?q=${encodeURIComponent(searchQuery.trim())}&limit=5`);
          const data = await res.json();
          setSuggestions(data.data || []);
          setShowSuggestions(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSuggestions = () => {
    if (!showSuggestions || (suggestions.length === 0 && !isSearching)) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50">
        {isSearching ? (
          <div className="p-4 flex items-center justify-center text-secondary">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : suggestions.length > 0 ? (
          <ul className="flex flex-col py-2">
            {suggestions.map((req) => (
              <li key={req.id}>
                <Link
                  href={`/request/${req.id}`}
                  onClick={() => { setShowSuggestions(false); setIsMobileSearchOpen(false); }}
                  className="flex flex-col px-4 py-2 hover:bg-surface-variant transition-colors"
                >
                  <span className="text-sm font-semibold text-on-surface line-clamp-1">{req.title}</span>
                  <div className="flex flex-row items-center gap-1 mt-0.5 text-xs text-on-surface-variant">
                    <MapPin size={10} />
                    <span className="truncate">{req.locationLabel}</span>
                    <span className="mx-1">•</span>
                    <span className="capitalize">{req.category}</span>
                  </div>
                </Link>
              </li>
            ))}
            <li className="border-t border-outline-variant mt-2">
              <button 
                onClick={handleSearch}
                className="w-full text-center text-sm text-primary font-medium p-3 hover:bg-surface-variant transition-colors"
              >
                See all results
              </button>
            </li>
          </ul>
        ) : (
          <div className="p-4 text-sm text-center text-on-surface-variant">
            No results found.
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 w-full z-50">
      {/* Kantata-style Fading blur background */}
      <div 
        className="absolute inset-0 -bottom-8 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(252, 249, 246, 0.9) 40%, rgba(252, 249, 246, 0) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
        }}
      />
      <div className="flex justify-between items-center h-16 md:h-20 px-4 md:px-12 w-full max-w-screen-2xl mx-auto relative z-10">

        <div className="flex items-center justify-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <Link href="/" className="flex items-center gap-2">
            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <Image
                src="/logo.png"
                alt="BayanihanHub logo"
                width={36}
                height={36}
                className="w-full h-full object-cover scale-[1.15]"
                priority
              />
            </div>
            <span
              className="text-[22px] md:text-2xl font-bold tracking-tight text-primary"
              style={{ fontFamily: 'Be Vietnam Pro, sans-serif', letterSpacing: '-0.01em' }}
            >
              BayanihanHub
            </span>
          </Link>
        </div>

        {/* Center/Left: Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md ml-8 mr-auto relative" ref={searchContainerRef}>
          <form onSubmit={handleSearch} className="relative w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchQuery.length > 1) setShowSuggestions(true); }}
              placeholder="Search community requests..."
              className="w-full bg-surface-container border border-outline-variant rounded-full py-2 pl-11 pr-10 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
              style={{ fontFamily: 'Be Vietnam Pro, sans-serif' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded-full"
              >
                <X size={16} />
              </button>
            )}
          </form>
          {renderSuggestions()}
        </div>

        {/* Mobile Right: Search Icon */}
        <div className="md:hidden flex ml-auto">
          <button 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className={`p-2 rounded-full transition-colors ${isMobileSearchOpen ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-variant'}`}
            aria-label="Toggle search"
          >
            {isMobileSearchOpen ? <X size={22} /> : <Search size={22} />}
          </button>
        </div>

        {/* Floating Mobile Search Bar (appears below header) */}
        {isMobileSearchOpen && (
          <div className="absolute top-full left-0 right-0 px-4 py-3 md:hidden animate-in slide-in-from-top-2 fade-in z-40 pointer-events-none" ref={mobileSearchContainerRef}>
            <div className="relative pointer-events-auto">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchQuery.length > 1) setShowSuggestions(true); }}
                  placeholder="Search community requests..."
                  className="w-full bg-surface-container border border-outline-variant rounded-full py-2.5 pl-11 pr-10 text-sm text-on-surface focus:outline-none focus:border-primary shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
              {renderSuggestions()}
            </div>
          </div>
        )}

        {/* Desktop Right: Nav Links + Avatar */}
        <div className="hidden md:flex items-center gap-8">
          <nav className="hidden md:flex gap-8 h-full items-center">
            <Link
              href="/feed"
              className={`text-base font-medium transition-colors duration-200 pb-1 ${
                pathname === '/feed'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Feed
            </Link>
            <Link
              href="/map"
              className={`text-base font-medium transition-colors duration-200 pb-1 ${
                pathname === '/map'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Map
            </Link>
            <Link
              href="/safety"
              className={`text-base font-medium transition-colors duration-200 pb-1 ${
                pathname === '/safety'
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Trust & Safety
            </Link>
          </nav>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container-high flex items-center justify-center ml-1 hover:border-primary transition-colors"
            >
              <User size={20} className="text-secondary" />
            </button>

            {/* Profile Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50">
                <div className="p-4 border-b border-outline-variant bg-surface">
                  <h3 className="font-semibold text-on-surface">Your Account</h3>
                  <p className="text-xs text-on-surface-variant mt-1">Manage posts and trust settings.</p>
                </div>
                
                <Link 
                  href="/dashboard"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 p-4 hover:bg-surface-container transition-colors border-b border-outline-variant"
                >
                  <div className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-on-surface">Manage My Posts</h4>
                    <p className="text-xs text-on-surface-variant">Update or resolve requests</p>
                  </div>
                </Link>

                <Link 
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 p-4 hover:bg-surface-container transition-colors"
                >
                  <div className="w-8 h-8 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-on-surface">Personal Info</h4>
                    <p className="text-xs text-on-surface-variant">Add details to build trust</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
