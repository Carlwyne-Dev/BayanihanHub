export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server';
import { db, requests } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Groq from 'groq-sdk';
import { checkRateLimit } from '@/lib/utils';

const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'dogoodie';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const allowed = await checkRateLimit(`admin_auth_v2:${ip}`, 500, 3600000);
  if (!allowed) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${ADMIN_PASS}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const prompt = `You are an AI moderator assistant for a local community help platform (Bayanihan Hub). 
Please analyze this request and give a brief 2-sentence recommendation on what the human admin should do (Approve, Resolve, or Expire/Hide).

Details:
Title: ${request.title}
Description: ${request.description}
Status: ${request.status}
Urgency: ${request.urgency}
Vouches (Confirmations): ${request.confirmCount}
Reports (Flags): ${request.reportCount}
Helps (Responses): ${request.responseCount}
Time Since Created: ${Math.floor((Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60))} hours

Rules:
- If there are many reports, you might suggest Expire/Hide.
- If there are many helps/responses, you might suggest Resolve.
- If there are vouches and no reports, you might suggest Approve.
Be concise and direct. Do not say "Here is the recommendation". Just give the recommendation.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 150,
    });

    const advice = chatCompletion.choices[0]?.message?.content?.trim() || 'No advice generated.';

    return NextResponse.json({ success: true, advice });
  } catch (err) {
    console.error('[POST /api/admin/ai-judge]', err);
    return NextResponse.json({ error: 'AI failed to process.' }, { status: 500 });
  }
}
