import { Category, RequestType, Urgency, RequestStatus, TrustLabel, SourcePlatform } from './db/schema';

// ─── DATE FORMATTING ─────────────────────────────────────────────────────────

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ─── ID GENERATION ────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── SUBMITTER REF (lightweight identifier, no PII stored directly) ───────────

export async function hashRef(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// ─── EXPIRY LOGIC ─────────────────────────────────────────────────────────────

const EXPIRY_HOURS: Record<Urgency, number> = {
  urgent: 48,
  normal: 120,  // 5 days
  low:    168,  // 7 days
};

export function isExpired(request: { urgency: Urgency; lastConfirmedAt: Date | null; updatedAt: Date }): boolean {
  const checkFrom = request.lastConfirmedAt ?? request.updatedAt;
  const hours = (Date.now() - new Date(checkFrom).getTime()) / 3600000;
  return hours > EXPIRY_HOURS[request.urgency];
}

export function getExpiryHours(urgency: Urgency): number {
  return EXPIRY_HOURS[urgency];
}

// ─── LOCATION JITTER (for sensitive categories) ───────────────────────────────

const SENSITIVE_CATEGORIES = new Set(['health', 'shelter']);
const JITTER_KM = 0.5; // ~500m radius jitter

export function jitterCoords(
  lat: number,
  lng: number,
  category: Category,
): { lat: number; lng: number } {
  if (!SENSITIVE_CATEGORIES.has(category)) return { lat, lng };
  const latOffset = (Math.random() - 0.5) * (JITTER_KM / 111);
  const lngOffset = (Math.random() - 0.5) * (JITTER_KM / (111 * Math.cos(lat * Math.PI / 180)));
  return { lat: lat + latOffset, lng: lng + lngOffset };
}

// ─── PLATFORM LABELS ─────────────────────────────────────────────────────────

export const platformLabels: Record<SourcePlatform, string> = {
  facebook:  'Facebook',
  tiktok:    'TikTok',
  instagram: 'Instagram',
  x:         'X (Twitter)',
  other:     'Other',
  none:      'None',
};

// ─── CATEGORY OPTIONS (for selects) ──────────────────────────────────────────

export const categoryOptions: Array<{ value: Category; label: string }> = [
  { value: 'health',      label: 'Health' },
  { value: 'food',        label: 'Food' },
  { value: 'supplies',    label: 'Supplies' },
  { value: 'shelter',     label: 'Shelter' },
  { value: 'information', label: 'Information' },
  { value: 'transport',   label: 'Transport' },
  { value: 'other',       label: 'Other' },
];

export const urgencyOptions: Array<{ value: Urgency; label: string }> = [
  { value: 'urgent', label: 'Urgent — needed very soon' },
  { value: 'normal', label: 'Soon — within a few days' },
  { value: 'low',    label: 'Whenever — no rush' },
];

export const offerUrgencyOptions: Array<{ value: Urgency; label: string }> = [
  { value: 'urgent', label: 'Available right now' },
  { value: 'normal', label: 'Available within a few days' },
  { value: 'low',    label: 'Flexible — whenever needed' },
];

export const platformOptions: Array<{ value: SourcePlatform; label: string }> = [
  { value: 'facebook',  label: 'Facebook' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x',         label: 'X (Twitter)' },
  { value: 'other',     label: 'Other platform' },
  { value: 'none',      label: 'No source / original post' },
];

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── RATE LIMITING (Upstash Redis with in-memory fallback) ───────────────────

let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
  });
}

const rateLimitMap = new Map<string, number[]>();

export async function checkRateLimit(key: string, maxRequests = 3, windowMs = 3600000): Promise<boolean> {
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(key);
      return success;
    } catch (err) {
      console.warn('[RateLimit Error] Falling back to memory', err);
    }
  }
  
  // In-memory fallback
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}
