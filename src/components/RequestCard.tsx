'use client';

import Link from 'next/link';
import { MapPin, Clock, Share2, ShieldCheck } from 'lucide-react';
import { Request } from '@/lib/db/schema';
import { CategoryChip, UrgencyChip, StatusChip, TypeBadge } from './Badges';
import { formatRelativeTime } from '../lib/utils';

interface RequestCardProps {
  request: Request;
  style?: React.CSSProperties;
}

export function RequestCard({ request, style }: RequestCardProps) {
  const isResolved = request.status === 'resolved' || request.status === 'expired';

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/request/${request.id}`;
    if (navigator.share) {
      await navigator.share({ title: request.title, text: request.description.slice(0, 80), url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div
      className="card animate-fadeInUp"
      style={{ opacity: isResolved ? 0.65 : 1, ...style }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {request.type === 'OFFER' ? <TypeBadge type={request.type} /> : <UrgencyChip urgency={request.urgency} />}
          <CategoryChip category={request.category} />
        </div>
        <span className="body-sm" style={{ color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <Clock size={12} />
          {formatRelativeTime(request.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h2 className="title-sm" style={{ marginBottom: 4, color: 'var(--on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {request.title}
        {(request.trustLabel === 'user_confirmed' || (request.trustLabel === 'recently_updated' && request.status === 'active')) && (
          <span title="Verified by Admin" style={{ color: 'var(--primary)', flexShrink: 0, display: 'flex' }}>
            <ShieldCheck size={18} />
          </span>
        )}
      </h2>

      {/* Description preview */}
      <p className="body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {request.description}
      </p>

      <hr className="divider" style={{ margin: '0 0 12px' }} />

      {/* Location + Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="body-sm" style={{ color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={13} /> {request.locationLabel}
        </span>
        <StatusChip status={request.status} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className={`btn ${request.type === 'OFFER' ? 'btn-secondary' : 'btn-primary'}`} style={{ flex: 1, pointerEvents: 'none' }}>
          {request.type === 'OFFER' ? 'Contact' : 'View Details'}
        </div>
        <button
          className="btn btn-secondary btn-icon"
          onClick={handleShare}
          aria-label="Share this request"
          title="Share"
        >
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}

export function RequestCardSkeleton() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ width: 64, height: 24 }} />
        <div className="skeleton" style={{ width: 56, height: 24 }} />
      </div>
      <div className="skeleton" style={{ width: '75%', height: 22 }} />
      <div className="skeleton" style={{ width: '100%', height: 16 }} />
      <div className="skeleton" style={{ width: '85%', height: 16 }} />
      <hr className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: 100, height: 16 }} />
        <div className="skeleton" style={{ width: 72, height: 20, borderRadius: 999 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 8 }} />
    </div>
  );
}
