'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShieldAlert, CheckCircle2, XCircle, Clock, Users, HeartHandshake, Sparkles, RotateCcw } from 'lucide-react';
import type { Request } from '@/lib/db/schema';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [pass, setPass] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'reported' | 'needs_review' | 'active'>('all');
  const [confirmModal, setConfirmModal] = useState<{ id: string, action: 'approve' | 'expire' | 'resolve' | 'revert' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<Record<string, { loading: boolean, text?: string, error?: string }>>({});

  useEffect(() => {
    const saved = localStorage.getItem('admin_pass');
    if (saved) {
      setPass(saved);
      fetchQueue(saved);
    }
  }, []);

  async function fetchQueue(password: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          setIsAuth(false);
          localStorage.removeItem('admin_pass');
          toast.error('Invalid password');
          throw new Error('Invalid password');
        }
        toast.error(data.error || 'Failed to load');
        throw new Error(data.error || 'Failed to load');
      }
      
      setIsAuth(true);
      localStorage.setItem('admin_pass', password);
      setRequests(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pass.trim()) fetchQueue(pass.trim());
  }

  function handleActionClick(id: string, action: 'approve' | 'expire' | 'resolve' | 'revert') {
    setConfirmModal({ id, action });
  }

  async function executeAction() {
    if (!confirmModal) return;
    const { id, action } = confirmModal;
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pass}` 
        },
        body: JSON.stringify({ id, action })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update request');
      }
      
      // Refresh the queue to show the updated status
      fetchQueue(pass.trim());
      setConfirmModal(null);
      toast.success(`Request ${action}d successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update request');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAskAI(id: string) {
    setAiAdvice(prev => ({ ...prev, [id]: { loading: true } }));
    try {
      const res = await fetch('/api/admin/ai-judge', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pass}`
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Failed');
      
      setAiAdvice(prev => ({ ...prev, [id]: { loading: false, text: data.advice } }));
    } catch (err: any) {
      setAiAdvice(prev => ({ ...prev, [id]: { loading: false, error: err.message } }));
    }
  }

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return req.status === 'active' || req.status === 'responded';
    return req.status === activeTab;
  });

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-background">
      <main className="flex-1 w-full max-w-screen-lg mx-auto px-6 py-12 flex flex-col gap-8">
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-on-background">Moderation Queue</h1>
          {isAuth && (
            <button 
              onClick={() => {
                localStorage.removeItem('admin_pass');
                setIsAuth(false);
                setPass('');
                setRequests([]);
              }} 
              className="text-sm text-error font-medium hover:underline"
            >
              Logout
            </button>
          )}
        </div>

        {!isAuth ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 max-w-sm mx-auto w-full">
            <div className="bg-error-container text-on-error-container w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-center mb-6">Admin Access</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Enter admin password"
                className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-primary outline-none"
                value={pass}
                onChange={e => setPass(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-semibold py-3 rounded-lg hover:opacity-90 flex items-center justify-center"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Login'}
              </button>
              {error && <p className="text-error text-sm text-center">{error}</p>}
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-outline-variant">
              {(['all', 'reported', 'needs_review', 'active'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeTab === tab 
                      ? 'bg-primary text-on-primary' 
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tab === 'all' ? 'All Pending' : tab === 'active' ? 'Active / Responded' : tab === 'reported' ? 'Reported' : 'Needs Review'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-primary" /></div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center p-12 bg-surface-container-lowest border border-outline-variant rounded-xl">
                <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-on-surface">Queue is empty</h3>
                <p className="text-on-surface-variant mt-2">No requests found for this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRequests.map(req => (
                  <div key={req.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          req.status === 'reported' ? 'bg-error-container text-on-error-container' : 
                          req.status === 'needs_review' ? 'bg-orange-100 text-orange-800' :
                          'bg-primary-container text-on-primary-container'
                        }`}>
                          {req.status === 'reported' ? 'Reported' : req.status === 'needs_review' ? 'Needs Review' : req.status === 'active' ? 'Active' : 'Responded'}
                        </span>
                        <span className="text-xs text-outline font-medium">
                          {formatRelativeTime(new Date(req.createdAt))}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-on-surface mb-1">{req.title}</h3>
                      <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{req.description}</p>
                      
                      {/* Community Signals */}
                      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-medium">
                        {(req.reportCount > 0) && (
                          <span className="flex items-center gap-1 bg-error/10 text-error px-2 py-1 rounded-md">
                            <ShieldAlert size={14} /> {req.reportCount} Reports
                          </span>
                        )}
                        {(req.responseCount > 0) && (
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md">
                            <HeartHandshake size={14} /> {req.responseCount} Helps
                          </span>
                        )}
                        {(req.confirmCount > 0) && (
                          <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md">
                            <Users size={14} /> {req.confirmCount} Vouches
                          </span>
                        )}
                      </div>

                      <Link href={`/request/${req.id}`} target="_blank" className="text-primary text-sm font-medium hover:underline">
                        View full post ↗
                      </Link>
                    </div>
                    
                    <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
                      {req.status === 'active' || req.status === 'responded' ? (
                        <button 
                          onClick={() => handleActionClick(req.id, 'revert')}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-orange-100 text-orange-800 hover:bg-orange-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <RotateCcw size={16} /> Revert to Review
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleActionClick(req.id, 'approve')}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <CheckCircle2 size={16} /> Approve
                        </button>
                      )}
                      <button 
                        onClick={() => handleActionClick(req.id, 'resolve')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surface-variant text-on-surface-variant hover:bg-surface-container-high px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                      >
                        <ShieldAlert size={16} /> Resolve
                      </button>
                      <button 
                        onClick={() => handleActionClick(req.id, 'expire')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-error-container text-on-error-container hover:bg-error/20 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                      >
                        <XCircle size={16} /> Expire/Hide
                      </button>
                    </div>
                  </div>
                    
                    {/* AI Advice Section */}
                    <div className="pt-4 border-t border-outline-variant/50">
                      {!aiAdvice[req.id] ? (
                        <button 
                          onClick={() => handleAskAI(req.id)}
                          className="text-sm flex items-center gap-2 text-primary font-semibold hover:underline"
                        >
                          <Sparkles size={16} /> Ask AI Moderator for Advice
                        </button>
                      ) : (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
                          <Sparkles size={20} className="text-primary shrink-0 mt-0.5" />
                          <div className="text-sm text-on-surface">
                            {aiAdvice[req.id].loading ? (
                              <span className="flex items-center gap-2 text-on-surface-variant italic">
                                <Loader2 size={14} className="animate-spin" /> AI is analyzing community signals...
                              </span>
                            ) : aiAdvice[req.id].error ? (
                              <span className="text-error">{aiAdvice[req.id].error}</span>
                            ) : (
                              <p className="font-medium">{aiAdvice[req.id].text}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-on-surface">Confirm Action</h3>
            <p className="text-sm text-on-surface-variant">
              Are you sure you want to <strong>{confirmModal.action}</strong> this request? This action cannot be easily undone.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
                className="flex-1 bg-surface-variant text-on-surface-variant font-semibold py-3 rounded-xl hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={actionLoading}
                className={`flex-1 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  confirmModal.action === 'expire' ? 'bg-error text-on-error hover:opacity-90' : 'bg-primary text-on-primary hover:opacity-90'
                }`}
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
