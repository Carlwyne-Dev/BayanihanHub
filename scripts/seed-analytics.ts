/// <reference types="node" />
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';

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

const EVENT_TYPES: schema.AnalyticsEventType[] = [
  'visit', 'visit', 'visit', 'visit', 'visit', 'visit',
  'request_view', 'request_view', 'request_view',
  'request_created', 'offer_made', 'share', 'request_resolved'
];

async function seedAnalytics() {
  console.log('Seeding 350 fake analytics events...');
  const events = [];
  
  for (let i = 0; i < 350; i++) {
    const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    events.push({
      id: nanoid(),
      eventType,
      sessionRef: `demo_session_${Math.floor(Math.random() * 100)}`,
      createdAt: randomDatePast14Days(),
    });
  }

  await db.insert(schema.analyticsEvents).values(events);
  console.log('Successfully injected fake analytics data!');
  process.exit(0);
}

seedAnalytics().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
