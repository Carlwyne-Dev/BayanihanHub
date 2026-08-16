import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requests, offers } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allRequests = await db.select({
      status: requests.status,
      type: requests.type,
      urgency: requests.urgency,
      email: requests.submitterRef
    }).from(requests);

    const allOffers = await db.select({
      responderRef: offers.responderRef
    }).from(offers);

    const total = allRequests.length;
    
    // Total number of unique people volunteering (either posting an offer or responding to an ask)
    const uniqueVolunteers = new Set<string>();
    
    // Add people who posted an "Offer"
    allRequests.filter(r => r.type === 'OFFER').forEach(r => uniqueVolunteers.add(r.email));
    
    // Add people who offered to help on someone else's "Ask" post
    allOffers.forEach(o => uniqueVolunteers.add(o.responderRef));

    const volunteersCount = uniqueVolunteers.size;
    
    const resolved = allRequests.filter(r => r.status === 'resolved').length;
    const resolvedPercentage = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Urgent active requests
    const urgentActive = allRequests.filter(r => r.urgency === 'urgent' && r.status !== 'resolved').length;

    return NextResponse.json({
      volunteers: volunteersCount,
      resolvedPercentage,
      urgentAlerts: urgentActive
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
