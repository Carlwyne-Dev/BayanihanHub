import { pgTable, text, integer, boolean, timestamp, real } from 'drizzle-orm/pg-core';

// ─── ENUMS (stored as text with TS union types) ──────────────────────────────

export type Category = 'items' | 'services' | 'pets' | 'transport' | 'food' | 'health' | 'shelter' | 'information' | 'other';
export type RequestType = 'ASK' | 'OFFER';
export type Urgency = 'low' | 'normal' | 'urgent';
export type SourcePlatform = 'facebook' | 'tiktok' | 'instagram' | 'x' | 'other' | 'none';
export type RequestStatus = 'active' | 'responded' | 'resolved' | 'expired' | 'reported' | 'needs_review';
export type TrustLabel = 'source_provided' | 'needs_review' | 'recently_updated' | 'user_confirmed' | 'reported' | 'resolved' | 'expired';
export type ResolvedVia = 'bayanihan_hub' | 'elsewhere' | 'unknown';
export type ConsentType = 'is_original_poster' | 'has_permission';
export type AdminRole = 'primary_builder' | 'backup_moderator';
export type ReportReason = 'false' | 'outdated' | 'spam' | 'inappropriate' | 'suspicious';
export type AnalyticsEventType = 'visit' | 'request_view' | 'request_created' | 'offer_made' | 'share' | 'report_filed' | 'request_resolved' | 'still_needed_clicked';

// ─── REQUESTS ────────────────────────────────────────────────────────────────

export const requests = pgTable('requests', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').$type<Category>().notNull(),
  type: text('type').$type<RequestType>().notNull().default('ASK'),
  urgency: text('urgency').$type<Urgency>().notNull().default('normal'),

  // Location (neighborhood/city level — approximate for sensitive categories)
  locationLabel: text('location_label').notNull(),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),

  // Contact
  contactMethod: text('contact_method').notNull(),

  // Source social post
  sourcePlatform: text('source_platform').$type<SourcePlatform>().default('none'),
  sourceUrl: text('source_url'),

  // Status & trust
  status: text('status').$type<RequestStatus>().notNull().default('needs_review'),
  trustLabel: text('trust_label').$type<TrustLabel>().notNull().default('needs_review'),
  resolvedVia: text('resolved_via').$type<ResolvedVia>(),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastConfirmedAt: timestamp('last_confirmed_at'),

  // Counters
  responseCount: integer('response_count').notNull().default(0),
  reportCount:   integer('report_count').notNull().default(0),
  confirmCount:  integer('confirm_count').notNull().default(0),

  // Lightweight submitter identifier (hashed email / handle — no full account)
  submitterRef: text('submitter_ref').notNull(),

  // Screenshot consent (only required if screenshot was uploaded)
  consentType: text('consent_type').$type<ConsentType>(),
});

// ─── OFFERS ──────────────────────────────────────────────────────────────────

export const offers = pgTable('offers', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => requests.id),
  message: text('message').notNull(),           // required short message (fix #1)
  responderName: text('responder_name'),        // optional name of the helper
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  responderRef: text('responder_ref').notNull(), // lightweight identifier
  contactRevealed: boolean('contact_revealed').notNull().default(false),
});

// ─── REPORTS ─────────────────────────────────────────────────────────────────

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => requests.id),
  reason: text('reason').$type<ReportReason>().notNull(),
  note: text('note'),
  reporterRef: text('reporter_ref'),            // optional, no account required
  createdAt: timestamp('created_at').notNull().defaultNow(),
  reviewed: boolean('reviewed').notNull().default(false),
  reviewedBy: text('reviewed_by').references(() => adminUsers.id),
  reviewedAt: timestamp('reviewed_at'),
});

// ─── ADMIN USERS ─────────────────────────────────────────────────────────────

export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),     // email or handle
  role: text('role').$type<AdminRole>().notNull(),
  accessGrantedAt: timestamp('access_granted_at').notNull().defaultNow(),
  accessExpiresAt: timestamp('access_expires_at'), // nullable — backup moderator is time-boxed
});

// ─── ANALYTICS EVENTS ────────────────────────────────────────────────────────

export const analyticsEvents = pgTable('analytics_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').$type<AnalyticsEventType>().notNull(),
  requestId: text('request_id').references(() => requests.id), // nullable — not every event is tied to a request
  sessionRef: text('session_ref').notNull(),    // anonymous session identifier, no PII
  trafficSource: text('traffic_source'),        // e.g. "tiktok", "facebook_group"
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── TYPE EXPORTS ─────────────────────────────────────────────────────────────

export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
