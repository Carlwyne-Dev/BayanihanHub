import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';
import { generateId } from '@/lib/utils';
import type { AnalyticsEventType } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { eventType, requestId, trafficSource } = await req.json();
    
    // In a real app, sessionRef could be derived from a cookie or passed from client
    // For this 7-day MVP, we'll just generate a basic anonymized hash based on IP + Date
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Quick anonymous session identifier for today
    const dateStr = new Date().toISOString().split('T')[0];
    const sessionRef = Buffer.from(`${ip}-${dateStr}`).toString('base64').slice(0, 15);
    
    await db.insert(analyticsEvents).values({
      id: generateId(),
      eventType: eventType as AnalyticsEventType,
      requestId: requestId || null,
      sessionRef: sessionRef,
      trafficSource: trafficSource || null
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/analytics]', err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
