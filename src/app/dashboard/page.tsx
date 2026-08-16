'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, User, FileText, ArrowRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import { TopNav } from '@/components/TopNav';
import type { Request } from '@/lib/db/schema';
import { formatRelativeTime } from '@/lib/utils';

export default function DashboardPage() {
  const [email, setEmail] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const local = localStorage.getItem('user_email');
    if (local) {
      setSavedEmail(local);
      fetchDashboard(local);
    }
  }, []);

  async function fetchDashboard(emailToFetch: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(emailToFetch)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      
      const fetchedRequests: Request[] = data.data || [];
      setRequests(fetchedRequests);

      // Sync fetched post IDs into my_requests so isOwner works on the request page
      if (fetchedRequests.length > 0) {
        const existing: string[] = JSON.parse(localStorage.getItem('my_requests') || '[]');
        const merged = Array.from(new Set([...existing, ...fetchedRequests.map(r => r.id)]));
        localStorage.setItem('my_requests', JSON.stringify(merged));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    localStorage.setItem('user_email', cleanEmail);
    setSavedEmail(cleanEmail);
    fetchDashboard(cleanEmail);
  }

  function handleLogout() {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('my_requests'); // MUST clear this so another user logging in on the same browser doesn't inherit these posts
    localStorage.removeItem('my_vouches');
    setSavedEmail(null);
    setRequests([]);
    setEmail('');
  }

  return (
    <div className="flex-1 flex flex-col w-full">
      <TopNav />
      <main className="flex-1 w-full max-w-screen-md mx-auto px-6 py-12 flex flex-col gap-8">
        
        {/* Back Button */}
        <div className="flex items-center gap-2 -mt-4 mb-2">
          <Link href="/feed" className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-full transition-colors flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="text-sm font-semibold">Back to Feed</span>
          </Link>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-on-background">Your Dashboard</h1>
          {savedEmail && (
            <button onClick={handleLogout} className="text-sm text-error font-medium hover:underline">
              Logout
            </button>
          )}
        </div>

        {!savedEmail ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 max-w-md mx-auto w-full">
            <div className="bg-primary-container text-on-primary-container w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Access Your Posts</h2>
            <p className="text-on-surface-variant text-center text-sm mb-6">
              Enter the email or handle you used when creating your requests to manage them.
            </p>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="you@email.com or @handle"
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Continue'}
              </button>
              {error && <p className="text-error text-sm text-center">{error}</p>}
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-on-surface-variant bg-surface-container-low p-4 rounded-lg border border-outline-variant">
              Logged in as: <strong className="text-on-surface">{savedEmail}</strong>
            </p>

            {loading ? (
              <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
            ) : requests.length === 0 ? (
              <div className="text-center p-12 bg-surface-container-lowest border border-outline-variant rounded-xl">
                <FileText size={48} className="text-outline mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-on-surface">No posts found</h3>
                <p className="text-on-surface-variant mt-2 mb-6">You haven't made any requests with this email yet.</p>
                <Link href="/ask" className="text-primary font-medium hover:underline">Create a new post</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {requests.map(req => (
                  <Link href={`/request/${req.id}`} key={req.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          req.status === 'resolved' ? 'bg-secondary-container text-on-secondary-container' : 
                          req.status === 'active' || req.status === 'responded' ? 'bg-primary-container text-on-primary-container' : 
                          'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {req.status === 'resolved' ? 'Resolved' : req.status === 'needs_review' ? 'Pending Review' : 'Active'}
                        </span>
                        <span className="text-xs text-outline font-medium">{formatRelativeTime(new Date(req.createdAt))}</span>
                      </div>
                      <h3 className="font-semibold text-lg text-on-surface line-clamp-1">{req.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-medium text-sm whitespace-nowrap">
                      View details <ArrowRight size={16} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
