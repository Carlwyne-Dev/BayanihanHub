/// <reference types="node" />
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db  = drizzle(sql, { schema });

const now = new Date();
function randomDatePast14Days() {
  const d = new Date(now);
  d.setDate(d.getDate() - Math.floor(Math.random() * 14));
  d.setHours(Math.floor(Math.random() * 24));
  return d;
}

// Ensure event happens slightly after the base date
function slightlyAfter(date: Date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + Math.floor(Math.random() * 120));
  return d;
}

async function seedAnalytics() {
  console.log('Clearing old analytics events...');
  await db.delete(schema.analyticsEvents);

  console.log('Fetching real data from database...');
  const allRequests = await db.select().from(schema.requests);
  const allOffers = await db.select().from(schema.offers);
  
  const events = [];

  // 1. Create real events for every request
  for (const req of allRequests) {
    events.push({
      id: nanoid(),
      eventType: 'request_created' as const,
      requestId: req.id,
      sessionRef: req.submitterRef,
      createdAt: req.createdAt,
    });

    if (req.status === 'resolved') {
      events.push({
        id: nanoid(),
        eventType: 'request_resolved' as const,
        requestId: req.id,
        sessionRef: req.submitterRef,
        createdAt: req.updatedAt,
      });
    }

    // Add some random views and shares for this request
    const views = Math.floor(Math.random() * 15);
    for (let i = 0; i < views; i++) {
      events.push({
        id: nanoid(),
        eventType: 'request_view' as const,
        requestId: req.id,
        sessionRef: `demo_session_${Math.floor(Math.random() * 100)}`,
        createdAt: slightlyAfter(req.createdAt),
      });
    }

    const shares = Math.floor(Math.random() * 3);
    for (let i = 0; i < shares; i++) {
      events.push({
        id: nanoid(),
        eventType: 'share' as const,
        requestId: req.id,
        sessionRef: `demo_session_${Math.floor(Math.random() * 100)}`,
        createdAt: slightlyAfter(req.createdAt),
      });
    }
  }

  // 2. Create real events for every offer
  for (const offer of allOffers) {
    events.push({
      id: nanoid(),
      eventType: 'offer_made' as const,
      requestId: offer.requestId,
      sessionRef: offer.responderRef,
      createdAt: offer.submittedAt,
    });
  }

  // 3. Add general site visits
  for (let i = 0; i < 200; i++) {
    events.push({
      id: nanoid(),
      eventType: 'visit' as const,
      requestId: null,
      sessionRef: `demo_session_${Math.floor(Math.random() * 100)}`,
      createdAt: randomDatePast14Days(),
    });
  }

  console.log(`Inserting ${events.length} realistic analytics events...`);
  // Insert in chunks to avoid blowing up payload size limits
  const chunkSize = 100;
  for (let i = 0; i < events.length; i += chunkSize) {
    await db.insert(schema.analyticsEvents).values(events.slice(i, i + chunkSize));
  }
  
  console.log('Successfully injected real-data aligned analytics!');
  process.exit(0);
}

seedAnalytics().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
