export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db, requests, offers } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { generateId, hashRef, checkRateLimit } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

// ─── GET single request ───────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    if (!request) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    
    // Fetch all public offers (the help log)
    const requestOffers = await db.select().from(offers).where(eq(offers.requestId, id)).orderBy(sql`${offers.submittedAt} DESC`);
    
    return NextResponse.json({ success: true, data: request, offers: requestOffers });
  } catch (err) {
    console.error('[GET /api/requests/[id]]', err);
    return NextResponse.json({ error: 'Failed to load request.' }, { status: 500 });
  }
}

// ─── PATCH — status changes (still-needed, resolve, mark-responded) ───────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    // Read all fields in ONE parse — body can only be consumed once
    const { action, submitterEmail, responderEmail } = await req.json();

    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    if (!request) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const now = new Date();

    if (action === 'still_needed') {
      // Ownership check — submitterEmail must match the original poster's hashed ref
      if (!submitterEmail?.trim()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      const ref = await hashRef(submitterEmail.trim());
      if (ref !== request.submitterRef) return NextResponse.json({ error: 'You are not the owner of this request.' }, { status: 403 });

      // Just refreshes the timestamp — signals the request is still active/unfulfilled
      await db.update(requests).set({
        lastConfirmedAt: now,
        updatedAt: now,
      }).where(eq(requests.id, id));
      return NextResponse.json({ success: true });

    } else if (action === 'vouch') {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const allowed = await checkRateLimit(`vouch:${ip}`, 5, 3600000); // 5 vouches per hr per IP
      if (!allowed) return NextResponse.json({ error: 'Too many vouches. Please wait a bit.' }, { status: 429 });

      // Increments community vouch count — builds toward verified trust label
      const newConfirmCount = (request.confirmCount ?? 0) + 1;
      const newTrust = newConfirmCount >= 3 ? 'user_confirmed'
        : newConfirmCount >= 1 ? 'recently_updated'
        : request.trustLabel;
      await db.update(requests).set({
        updatedAt: now,
        confirmCount: newConfirmCount,
        trustLabel: newTrust as typeof request.trustLabel,
      }).where(eq(requests.id, id));
      return NextResponse.json({ success: true, confirmCount: newConfirmCount, trustLabel: newTrust });

    } else if (action === 'resolve') {
      // Ownership check — submitterEmail must match the original poster's hashed ref
      if (!submitterEmail?.trim()) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      const ref = await hashRef(submitterEmail.trim());
      if (ref !== request.submitterRef) return NextResponse.json({ error: 'You are not the owner of this request.' }, { status: 403 });

      await db.update(requests).set({
        status: 'resolved',
        trustLabel: 'resolved',
        resolvedVia: 'bayanihan_hub',
        updatedAt: now,
      }).where(eq(requests.id, id));
    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/requests/[id]]', err);
    return NextResponse.json({ error: 'Failed to update request.' }, { status: 500 });
  }
}
