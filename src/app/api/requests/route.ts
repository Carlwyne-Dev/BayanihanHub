import { NextRequest, NextResponse } from 'next/server';
import { db, requests } from '@/lib/db';
import { generateId, hashRef, jitterCoords, checkRateLimit } from '@/lib/utils';
import { desc, eq, and, or, inArray, ilike, sql } from 'drizzle-orm';
import type { Category, Urgency } from '@/lib/db/schema';

// ─── GET — list requests (feed) ───────────────────────────────────────────────

/** Haversine distance in km */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category  = searchParams.get('category') as Category | null;
    const urgency   = searchParams.get('urgency')  as Urgency | null;
    const type      = searchParams.get('type');
    const q         = searchParams.get('q');
    const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit     = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
    const offset    = (page - 1) * limit;
    const userLat   = searchParams.get('lat')  ? parseFloat(searchParams.get('lat')!)  : null;
    const userLng   = searchParams.get('lng')  ? parseFloat(searchParams.get('lng')!)  : null;

    const conditions = [
      // Only show active content in the feed (not expired/hidden)
      inArray(requests.status, ['active', 'responded', 'needs_review']),
      // Auto-expiry logic: Urgent = 48h, Normal/Low = 5 days
      sql`CASE 
            WHEN urgency = 'urgent' THEN updated_at > NOW() - INTERVAL '48 hours'
            ELSE updated_at > NOW() - INTERVAL '5 days'
          END`
    ];
    if (category) conditions.push(eq(requests.category, category));
    if (urgency)  conditions.push(eq(requests.urgency, urgency));
    if (type)     conditions.push(eq(requests.type, type as 'ASK' | 'OFFER'));
    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(or(ilike(requests.title, searchTerm), ilike(requests.description, searchTerm)) as any);
    }

    const rows = await db
      .select()
      .from(requests)
      .where(and(...conditions))
      .orderBy(desc(requests.createdAt))
      .limit(limit)
      .offset(offset);

    // If user sent coords, sort by proximity (with urgency boost)
    if (userLat !== null && userLng !== null) {
      const URGENCY_BONUS_KM: Record<string, number> = { urgent: -3, normal: 0, low: 2 };
      rows.sort((a, b) => {
        const distA = (a.locationLat && a.locationLng)
          ? haversineKm(userLat, userLng, a.locationLat, a.locationLng) + (URGENCY_BONUS_KM[a.urgency] ?? 0)
          : 99999;
        const distB = (b.locationLat && b.locationLng)
          ? haversineKm(userLat, userLng, b.locationLat, b.locationLng) + (URGENCY_BONUS_KM[b.urgency] ?? 0)
          : 99999;
        return distA - distB;
      });
    }

    return NextResponse.json({ success: true, data: rows, page, limit });
  } catch (err) {
    console.error('[GET /api/requests]', err);
    return NextResponse.json({ success: false, error: 'Failed to load requests.' }, { status: 500 });
  }
}

// ─── POST — create a new request ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Rate-limit: 3 requests per hour per submitter email (lightweight, no full account)
    const submitterEmail = (body.submitterEmail ?? '').trim().toLowerCase();
    if (!submitterEmail) {
      return NextResponse.json({ error: 'A contact email or handle is required.' }, { status: 400 });
    }
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const allowedIp = await checkRateLimit(`create_ip:${ip}`, 5, 3600000);
    if (!allowedIp) {
      return NextResponse.json({ error: 'Too many requests from this IP. Please try again later.' }, { status: 429 });
    }

    const allowed = await checkRateLimit(`create:${submitterEmail}`, 3, 3600000);
    if (!allowed) {
      return NextResponse.json({ error: 'You have submitted too many requests recently. Please try again later.' }, { status: 429 });
    }

    // Basic validation
    const { title, description, category, type, urgency, locationLabel, contactMethod, sourceUrl, sourcePlatform, consentType } = body;
    if (!title?.trim() || !description?.trim() || !locationLabel?.trim() || !contactMethod?.trim()) {
      return NextResponse.json({ error: 'Title, description, location, and contact method are required.' }, { status: 400 });
    }

    let lat = typeof body.lat === 'number' ? body.lat : null;
    let lng = typeof body.lng === 'number' ? body.lng : null;

    // Auto-geocode if missing
    if (!lat || !lng) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationLabel)}&limit=1`, {
          headers: { 'User-Agent': 'BayanihanHubAI/1.0' }
        });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        } else {
          // Fallback to Manila area for prototype
          lat = 14.5995 + (Math.random() - 0.5) * 0.1;
          lng = 120.9842 + (Math.random() - 0.5) * 0.1;
        }
      } catch (e) {
        lat = 14.5995 + (Math.random() - 0.5) * 0.1;
        lng = 120.9842 + (Math.random() - 0.5) * 0.1;
      }
    }

    // Jitter coordinates for sensitive categories
    const coords = lat && lng ? jitterCoords(lat, lng, category) : { lat: null, lng: null };

    // Determine initial trust label
    const trustLabel = sourceUrl ? 'source_provided' : 'needs_review';

    const id = generateId();
    const submitterRef = await hashRef(submitterEmail);

    const newRequest = {
      id,
      title:          title.trim().slice(0, 120),
      description:    description.trim().slice(0, 3000),
      category:       category ?? 'other',
      type:           type ?? 'ASK',
      urgency:        urgency ?? 'normal',
      locationLabel:  locationLabel.trim().slice(0, 100),
      locationLat:    coords.lat,
      locationLng:    coords.lng,
      contactMethod:  contactMethod.trim().slice(0, 300),
      sourcePlatform: sourcePlatform ?? 'none',
      sourceUrl:      sourceUrl?.trim() || null,
      status:         'needs_review' as const,
      trustLabel:     trustLabel as 'source_provided' | 'needs_review',
      submitterRef,
      consentType:    consentType ?? null,
      responseCount:  0,
      reportCount:    0,
    };

    await db.insert(requests).values(newRequest);

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/requests]', err);
    return NextResponse.json({ success: false, error: 'Failed to create request.' }, { status: 500 });
  }
}
