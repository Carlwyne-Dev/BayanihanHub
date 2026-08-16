export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'dogoodie';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${ADMIN_PASS}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const events = await db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt));
    
    // Aggregate data
    const totals = {
      visits: 0,
      request_views: 0,
      requests_created: 0,
      offers_made: 0,
      shares: 0,
      reports_filed: 0,
      requests_resolved: 0,
    };
    
    events.forEach(e => {
      if (e.eventType === 'visit') totals.visits++;
      if (e.eventType === 'request_view') totals.request_views++;
      if (e.eventType === 'request_created') totals.requests_created++;
      if (e.eventType === 'offer_made') totals.offers_made++;
      if (e.eventType === 'share') totals.shares++;
      if (e.eventType === 'report_filed') totals.reports_filed++;
      if (e.eventType === 'request_resolved') totals.requests_resolved++;
    });
    
    // Get unique active sessions (rough estimate based on sessionRef)
    const uniqueSessions = new Set(events.map(e => e.sessionRef)).size;

    return NextResponse.json({ 
      success: true, 
      data: {
        totals,
        uniqueSessions,
        recentEvents: events.slice(0, 50)
      } 
    });
  } catch (err) {
    console.error('Admin Analytics error', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
