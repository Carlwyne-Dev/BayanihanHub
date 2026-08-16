import { NextRequest, NextResponse } from 'next/server';
import { db, reports, requests } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { generateId, checkRateLimit } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { reason, note, reporterRef } = await req.json();

    const validReasons = ['false', 'outdated', 'spam', 'inappropriate', 'suspicious'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid report reason.' }, { status: 400 });
    }

    // Rate limit: 10 reports per hour per IP, 3 per reporterRef
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const allowedIp = await checkRateLimit(`report_ip:${ip}`, 10, 3600000);
    if (!allowedIp) {
      return NextResponse.json({ error: 'Too many reports from this IP. Please try again later.' }, { status: 429 });
    }

    const limiterKey = `report:${reporterRef ?? 'anon'}`;
    const allowed = await checkRateLimit(limiterKey, 3, 3600000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many reports. Please try again later.' }, { status: 429 });
    }

    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    await db.insert(reports).values({
      id: generateId(),
      requestId: id,
      reason,
      note: note?.trim().slice(0, 500) || null,
      reporterRef: reporterRef || null,
    });

    // Immediately surface as "Reported" in the feed
    await db.update(requests).set({
      reportCount: sql`${requests.reportCount} + 1`,
      status: 'reported',
      trustLabel: 'reported',
      updatedAt: new Date(),
    }).where(eq(requests.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/requests/[id]/reports]', err);
    return NextResponse.json({ error: 'Failed to submit report.' }, { status: 500 });
  }
}
