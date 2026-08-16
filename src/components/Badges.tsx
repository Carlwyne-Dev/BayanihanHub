import { Category, RequestType, Urgency, RequestStatus, TrustLabel } from '@/lib/db/schema';
import {
  Heart, Utensils, Package, Home, Info, Car, MoreHorizontal,
  Clock, CheckCircle, AlertTriangle, Flag, Archive, RefreshCw, Shield,
  HeartHandshake, HandHeart, PawPrint, Wrench
} from 'lucide-react';

// ─── CATEGORY ────────────────────────────────────────────────────────────────

const categoryConfig: Record<Category, { label: string; icon: React.ReactNode; color: string }> = {
  items:       { label: 'Items & Supplies',  icon: <Package size={14} />,       color: '#2a5c7a' },
  services:    { label: 'Help & Services',   icon: <Wrench size={14} />,        color: '#5c3a7a' },
  transport:   { label: 'Rides & Transport', icon: <Car size={14} />,           color: '#5c4a1a' },
  food:        { label: 'Food & Groceries',  icon: <Utensils size={14} />,      color: '#7a5c00' },
  health:      { label: 'Health & Wellness', icon: <Heart size={14} />,         color: '#ba1a1a' },
  shelter:     { label: 'Housing & Shelter', icon: <Home size={14} />,          color: '#3a7a5c' },
  pets:        { label: 'Pets & Animals',    icon: <PawPrint size={14} />,      color: '#4a7a2a' },
  information: { label: 'Questions & Info',  icon: <Info size={14} />,          color: '#1a5c4a' },
  other:       { label: 'Other',             icon: <MoreHorizontal size={14} />, color: '#5f5e59' },
};

export function CategoryChip({ category }: { category: Category }) {
  const { label, icon } = categoryConfig[category] ?? categoryConfig.other;
  return (
    <span className="chip chip-normal" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon} {label}
    </span>
  );
}

export function getCategoryLabel(category: Category) {
  return categoryConfig[category]?.label ?? category;
}
export function getCategoryColor(category: Category) {
  return categoryConfig[category]?.color ?? '#5f5e59';
}

// ─── TYPE BADGE ──────────────────────────────────────────────────────────────

export function TypeBadge({ type }: { type: RequestType }) {
  return (
    <span className={`chip ${type === 'OFFER' ? 'chip-offer' : 'chip-normal'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {type === 'OFFER' ? <HandHeart size={14} /> : <HeartHandshake size={14} />}
      {type === 'OFFER' ? 'Offering' : 'Asking'}
    </span>
  );
}

// ─── URGENCY CHIP ────────────────────────────────────────────────────────────

export function UrgencyChip({ urgency }: { urgency: Urgency }) {
  if (urgency === 'urgent') {
    return (
      <span className="chip chip-urgent" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <AlertTriangle size={11} /> Urgent
      </span>
    );
  }
  if (urgency === 'low') return null; // low urgency — don't show any chip
  return null; // normal — no chip either, keep visual noise low
}

// ─── STATUS CHIP ─────────────────────────────────────────────────────────────

const statusConfig: Record<RequestStatus, { label: string; chipClass: string; icon: React.ReactNode }> = {
  active:       { label: 'Active',        chipClass: 'chip-active',    icon: <Clock size={11} /> },
  responded:    { label: 'Responded',     chipClass: 'chip-responded', icon: <RefreshCw size={11} /> },
  resolved:     { label: 'Resolved',      chipClass: 'chip-resolved',  icon: <CheckCircle size={11} /> },
  expired:      { label: 'Expired',       chipClass: 'chip-expired',   icon: <Archive size={11} /> },
  reported:     { label: 'Reported',      chipClass: 'chip-reported',  icon: <Flag size={11} /> },
  needs_review: { label: 'Needs review',  chipClass: 'chip-review',    icon: <Clock size={11} /> },
};

export function StatusChip({ status }: { status: RequestStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.needs_review;
  return (
    <span className={`chip ${cfg.chipClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── TRUST LABEL ─────────────────────────────────────────────────────────────

const trustConfig: Record<TrustLabel, { label: string; description: string; icon: React.ReactNode; colorClass: string }> = {
  source_provided:  {
    label: 'Source provided',
    description: 'The requester linked back to an original social media post. You can check the source yourself.',
    icon: <Shield size={14} />,
    colorClass: 'trust-source-provided',
  },
  needs_review: {
    label: 'Needs review',
    description: "This request was just posted or reported and hasn't been checked yet. Use your judgment.",
    icon: <Clock size={14} />,
    colorClass: 'trust-needs-review',
  },
  recently_updated: {
    label: 'Recently updated',
    description: 'The requester or a moderator confirmed this request is still current.',
    icon: <RefreshCw size={14} />,
    colorClass: 'trust-recently-updated',
  },
  user_confirmed: {
    label: 'User-confirmed',
    description: 'Someone who responded to this request confirmed it was legitimate.',
    icon: <CheckCircle size={14} />,
    colorClass: 'trust-user-confirmed',
  },
  reported: {
    label: 'Reported',
    description: 'One or more users flagged a concern about this request. Proceed carefully.',
    icon: <Flag size={14} />,
    colorClass: 'trust-reported',
  },
  resolved: {
    label: 'Resolved',
    description: 'The requester or a responder marked this need as met.',
    icon: <CheckCircle size={14} />,
    colorClass: 'trust-resolved',
  },
  expired: {
    label: 'Expired',
    description: 'This request is past its relevant window and has been auto-archived.',
    icon: <Archive size={14} />,
    colorClass: 'trust-expired',
  },
};

export function TrustBadge({ trustLabel }: { trustLabel: TrustLabel }) {
  const cfg = trustConfig[trustLabel] ?? trustConfig.needs_review;
  return (
    <span
      className={`body-sm ${cfg.colorClass}`}
      title={cfg.description}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

export function getTrustConfig(trustLabel: TrustLabel) {
  return trustConfig[trustLabel] ?? trustConfig.needs_review;
}
