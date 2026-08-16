'use client';

import { useState, useEffect } from 'react';
import { User, LayoutDashboard, ChevronRight, Heart, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [saved, setSaved] = useState(false);
  const [view, setView] = useState<'home' | 'edit'>('home');

  useEffect(() => {
    setName(localStorage.getItem('user_name') || '');
    setEmail(localStorage.getItem('user_email') || '');
    setAffiliation(localStorage.getItem('user_affiliation') || '');
  }, []);

  function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_affiliation', affiliation);
    setSaved(true);
    setTimeout(() => { setSaved(false); setView('home'); }, 1500);
  }

  const initial = name ? name[0].toUpperCase() : email ? email[0].toUpperCase() : '?';

  return (
    <div className="flex-1 flex flex-col w-full bg-background min-h-screen">
      <div className="md:hidden sticky top-0 bg-background/90 backdrop-blur-md z-50 flex items-center h-14 border-b border-outline-variant px-4 gap-3">
        {view === 'edit' ? (
          <button onClick={() => setView('home')} className="p-2 text-on-surface hover:bg-surface-variant rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Link href="/feed" className="p-2 text-on-surface hover:bg-surface-variant rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
        )}
        <h1 className="text-base font-bold text-on-surface">{view === 'edit' ? 'Edit Profile' : 'Profile'}</h1>
      </div>
      <div className="hidden md:block"><TopNav /></div>

      <main className="flex-1 w-full max-w-screen-sm mx-auto px-6 py-10 flex flex-col gap-6 pb-32">
        {/* Desktop Back Button */}
        <div className="hidden md:flex items-center gap-2 mb-2">
          <Link href="/feed" className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="text-sm font-semibold">Back to Feed</span>
          </Link>
        </div>

        {/* Mobile Menu View */}
        <div className={`md:hidden flex-col gap-4 ${view === 'home' ? 'flex' : 'hidden'}`}>
          <div className="flex items-center gap-4 mb-4 px-2">
            <div className="w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center text-3xl font-bold">
              {initial}
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">{name || 'Neighbor'}</h2>
              {email && <p className="text-sm text-on-surface-variant">{email}</p>}
            </div>
          </div>
          
          <Link href="/dashboard" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-center gap-4 hover:bg-surface-container transition-colors">
            <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-on-surface">Manage My Posts</h3>
              <p className="text-xs text-on-surface-variant">Update or resolve your requests</p>
            </div>
            <ChevronRight size={20} className="text-outline" />
          </Link>

          <button onClick={() => setView('edit')} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-center gap-4 hover:bg-surface-container transition-colors text-left w-full">
            <div className="w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-on-surface">Personal Info</h3>
              <p className="text-xs text-on-surface-variant">Add details to build trust</p>
            </div>
            <ChevronRight size={20} className="text-outline" />
          </button>
        </div>

        {/* Edit Form (Hidden on mobile if view === 'home') */}
        <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex-col gap-5 ${view === 'edit' ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center text-2xl font-bold">
              {initial}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">Personal Details</h2>
              <p className="text-sm text-on-surface-variant">Only stored on your device.</p>
            </div>
          </div>
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className="w-full bg-background border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">Organization / Affiliation <span className="font-normal text-on-surface-variant">(Optional)</span></label>
              <input
                type="text"
                value={affiliation}
                onChange={e => setAffiliation(e.target.value)}
                placeholder="e.g. Red Cross Volunteer, Brgy Health Worker"
                className="w-full bg-background border border-outline-variant rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {saved ? <><Heart size={16} /> Saved!</> : 'Save Information'}
            </button>
          </form>
        </div>
      </main>
      <div className="hidden md:block"><Footer /></div>
    </div>
  );
}
