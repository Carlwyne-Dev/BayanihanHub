export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { db, requests } from '@/lib/db';
import { inArray, eq, desc } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/utils';

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'dogoodie';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${ADMIN_PASS}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const pendingRequests = await db.select()
      .from(requests)
      .where(inArray(requests.status, ['reported', 'needs_review', 'active', 'responded']))
      .orderBy(desc(requests.createdAt));
      
    return NextResponse.json({ success: true, data: pendingRequests });
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const allowed = await checkRateLimit(`admin_auth_v2:${ip}`, 500, 3600000);
  if (!allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${ADMIN_PASS}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id, action } = await req.json();
    if (!id || !action) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    
    const now = new Date();
    
    if (action === 'approve') {
      await db.update(requests).set({ 
        status: 'active', 
        trustLabel: 'user_confirmed', 
        updatedAt: now 
      }).where(eq(requests.id, id));
    } else if (action === 'revert') {
      await db.update(requests).set({ 
        status: 'needs_review', 
        trustLabel: 'needs_review', 
        updatedAt: now 
      }).where(eq(requests.id, id));
    } else if (action === 'expire') {
      await db.update(requests).set({ 
        status: 'expired', 
        trustLabel: 'expired', 
        updatedAt: now 
      }).where(eq(requests.id, id));
    } else if (action === 'resolve') {
      await db.update(requests).set({ 
        status: 'resolved', 
        trustLabel: 'resolved', 
        updatedAt: now 
      }).where(eq(requests.id, id));
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
