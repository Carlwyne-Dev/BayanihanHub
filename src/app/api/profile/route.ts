export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { db, requests } from '@/lib/db';
import { hashRef } from '@/lib/utils';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const hashedEmail = await hashRef(email.trim().toLowerCase());

    const userRequests = await db
      .select()
      .from(requests)
      .where(eq(requests.submitterRef, hashedEmail))
      .orderBy(desc(requests.createdAt));

    return NextResponse.json({ success: true, data: userRequests });
  } catch (err) {
    console.error('[GET /api/profile]', err);
    return NextResponse.json({ success: false, error: 'Failed to load profile data.' }, { status: 500 });
  }
}
