/**
 * Seed script — realistic Filipino community demo data
 * Run with: npx tsx scripts/seed.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db  = drizzle(sql, { schema });

const now = new Date();
function daysAgo(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}

const DEMO_REQUESTS: schema.NewRequest[] = [
  // ITEMS
  {
    id: nanoid(),
    title: 'Looking for school supplies for 3 kids',
    description: "My 3 kids are going back to school next week. We need notebooks, ballpens, and a ruler. Any brand is fine, we just can't afford to buy them this month. Salamat po.",
    category: 'items',
    type: 'ASK',
    urgency: 'normal',
    locationLabel: 'Tondo, Manila',
    locationLat: 14.6177,
    locationLng: 120.9681,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_1',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: nanoid(),
    title: 'Offering spare plastic chairs — 4 pcs',
    description: 'Moving to a smaller place. Giving away 4 monobloc chairs, still in good condition. You just need to pick them up in Cubao. First come first serve.',
    category: 'items',
    type: 'OFFER',
    urgency: 'low',
    locationLabel: 'Cubao, Quezon City',
    locationLat: 14.6195,
    locationLng: 121.0519,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_2',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: nanoid(),
    title: 'Need second-hand school bag for Grade 2',
    description: "Looking for a good condition school bag for my daughter. She's a bit small so medium size lang po. Kahit anong kulay basta matibay.",
    category: 'items',
    type: 'ASK',
    urgency: 'normal',
    locationLabel: 'Caloocan City',
    locationLat: 14.6492,
    locationLng: 120.9671,
    contactMethod: 'FB Messenger: @maricel.reyes',
    sourcePlatform: 'facebook',
    status: 'active',
    trustLabel: 'source_provided',
    submitterRef: 'demo_user_3',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },

  // SERVICES
  {
    id: nanoid(),
    title: 'Need help moving furniture this Saturday',
    description: 'Moving from Mandaluyong to Pasig, 2nd floor to ground floor. Just a bed, ref, and 2 boxes. Willing to pay merienda + small thank you. Need 2-3 people.',
    category: 'services',
    type: 'ASK',
    urgency: 'urgent',
    locationLabel: 'Mandaluyong City',
    locationLat: 14.5794,
    locationLng: 121.0359,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_4',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: nanoid(),
    title: 'Offering free tutoring — Grade 4-6 Math',
    description: 'College student here, Education major. Available Saturday mornings for free tutoring in Math for elementary students. Can do 1-on-1 or small group (3 max). Pasay City area.',
    category: 'services',
    type: 'OFFER',
    urgency: 'low',
    locationLabel: 'Pasay City',
    locationLat: 14.5378,
    locationLng: 121.0014,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_5',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },

  // TRANSPORT
  {
    id: nanoid(),
    title: 'Looking for a ride — Cavite to Alabang Monday 7AM',
    description: 'Need a ride from Bacoor, Cavite going to Alabang Monday morning. Willing to shoulder gas and toll. Regular commute kaya lang walang available.',
    category: 'transport',
    type: 'ASK',
    urgency: 'normal',
    locationLabel: 'Bacoor, Cavite',
    locationLat: 14.4624,
    locationLng: 120.9942,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_6',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },

  // FOOD
  {
    id: nanoid(),
    title: 'Offering extra rice and viand — pick up tonight',
    description: 'Nag-luto ng marami for a family gathering. May sobrang kanin at adobo para sa 10-15 tao. Available tonight until 8PM. Pick up sa Marikina.',
    category: 'food',
    type: 'OFFER',
    urgency: 'urgent',
    locationLabel: 'Marikina City',
    locationLat: 14.6507,
    locationLng: 121.1029,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_7',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },
  {
    id: nanoid(),
    title: 'Looking for anyone who can share food for elderly lola',
    description: "My lola is alone at home and we're out of budget until Friday. She's 78 and can't go out. Any cooked meal or even instant food would be a big help. Fairview, QC.",
    category: 'food',
    type: 'ASK',
    urgency: 'urgent',
    locationLabel: 'Fairview, Quezon City',
    locationLat: 14.7233,
    locationLng: 121.0589,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'facebook',
    status: 'active',
    trustLabel: 'source_provided',
    submitterRef: 'demo_user_8',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },

  // HEALTH
  {
    id: nanoid(),
    title: 'Need blood donor — Type B+ for scheduled surgery',
    description: 'My father is scheduled for surgery this Friday at PGH. We need at least 2 units of Type B+ blood. Replaceable after the operation.',
    category: 'health',
    type: 'ASK',
    urgency: 'urgent',
    locationLabel: 'Philippine General Hospital, Manila',
    locationLat: 14.5794,
    locationLng: 120.9827,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'facebook',
    status: 'active',
    trustLabel: 'source_provided',
    submitterRef: 'demo_user_9',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: nanoid(),
    title: 'Free BP monitoring this Saturday — barangay hall',
    description: "We're medical students conducting a free blood pressure and blood sugar monitoring activity. Open to all residents, no appointment needed. 8AM-12NN only.",
    category: 'health',
    type: 'OFFER',
    urgency: 'normal',
    locationLabel: 'Brgy. San Roque, Antipolo',
    locationLat: 14.5856,
    locationLng: 121.1746,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_10',
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },

  // PETS
  {
    id: nanoid(),
    title: 'Lost dog — brown aspin, near Divisoria',
    description: 'Our brown aspin named Choco went missing yesterday near Divisoria, Manila. Medium size, wearing a blue collar. Please message if you spot him.',
    category: 'pets',
    type: 'ASK',
    urgency: 'urgent',
    locationLabel: 'Divisoria, Manila',
    locationLat: 14.5991,
    locationLng: 120.9738,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'facebook',
    status: 'active',
    trustLabel: 'source_provided',
    submitterRef: 'demo_user_11',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },

  // SHELTER
  {
    id: nanoid(),
    title: 'Looking for temporary lodging — single mom with baby',
    description: 'Single mom here with a 4-month old baby. Pinalayas kami ng landlord ngayong buwan. Kailangan ng matutulugan for about 7 days while I look for a new place. QC/Caloocan area.',
    category: 'shelter',
    type: 'ASK',
    urgency: 'urgent',
    locationLabel: 'Quezon City',
    locationLat: 14.6760,
    locationLng: 121.0437,
    contactMethod: '09xxxxxxxxx',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_12',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
  },

  // INFORMATION
  {
    id: nanoid(),
    title: 'Where can I get free legal advice in Manila?',
    description: "Looking for free legal assistance for a labor case. Lost my job and need help filing a complaint but can't afford a lawyer. Are there any PAO offices open on weekends?",
    category: 'information',
    type: 'ASK',
    urgency: 'normal',
    locationLabel: 'Manila',
    locationLat: 14.5995,
    locationLng: 120.9842,
    contactMethod: '',
    sourcePlatform: 'none',
    status: 'active',
    trustLabel: 'user_confirmed',
    submitterRef: 'demo_user_13',
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
];

async function seed() {
  console.log(`Seeding ${DEMO_REQUESTS.length} demo requests...`);

  await db.delete(schema.analyticsEvents);
  await db.delete(schema.offers);
  await db.delete(schema.reports);
  await db.delete(schema.requests);
  console.log('Cleared existing data');

  await db.insert(schema.requests).values(DEMO_REQUESTS);
  console.log(`Inserted ${DEMO_REQUESTS.length} requests`);

  console.log('Done! Your DB is seeded with realistic Filipino community data.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
