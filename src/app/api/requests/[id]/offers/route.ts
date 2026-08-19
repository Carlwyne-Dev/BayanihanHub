export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db, offers, requests } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { generateId, hashRef, checkRateLimit } from '@/lib/utils';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build' });

type Params = { params: Promise<{ id: string }> };

// POST — submit an offer to help (message-gated, fix #1)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const { message, responderEmail, responderName } = await req.json();

    if (!message?.trim() || message.trim().length < 10) {
      return NextResponse.json({ error: 'Please write at least a brief message about how you can help (10+ characters).' }, { status: 400 });
    }
    if (!responderEmail?.trim()) {
      return NextResponse.json({ error: 'Your contact email or handle is required.' }, { status: 400 });
    }

    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (request.status === 'resolved' || request.status === 'expired') {
      return NextResponse.json({ error: 'This request is already resolved or expired.' }, { status: 400 });
    }

    // AI Check for spam/gibberish AND contextual relevance
    // Global Groq rate limit: max 25 AI calls/min across ALL users (Groq free tier protection)
    const groqAllowed = await checkRateLimit('groq_global', 25, 60000);
    if (groqAllowed) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'groq/compound-mini',
          messages: [
            { role: 'system', content: 'You are an AI moderator for a local community help platform. You will be given an original request for help, and a message from a user offering to help. Your job is to classify if the offer message is a legitimate, contextual response to the request, or if it is spam, gibberish, trolling, or completely unrelated. Respond with ONLY the word "VALID" if it is a reasonable attempt to help or communicate regarding the specific request. Respond with ONLY the word "INVALID" if it is keyboard smash, spam, abusive, or totally irrelevant to the request. Err on the side of VALID if unsure.' },
            { role: 'user', content: `Original Request Title: "${request.title}"\nOriginal Request Description: "${request.description}"\n\nOffer Message: "${message}"` }
          ],
          temperature: 0,
          max_tokens: 10,
        });
        const verdict = completion.choices[0]?.message?.content?.trim().toUpperCase();
        if (verdict?.includes('INVALID')) {
          return NextResponse.json({ error: 'Your message appears to be invalid, spam, or totally unrelated to this specific request. Please write a genuine offer to help.' }, { status: 400 });
        }
      } catch (aiErr) {
        console.error('[AI Spam Check Error]', aiErr);
        // Fallback to allowing it if the AI fails, so we don't block legitimate help during an outage
      }
    } else {
      // Global AI limit hit — tell client to retry in a few seconds
      return NextResponse.json({ error: 'We\'re verifying your message. Please wait a moment and try again.', retry: true, retryAfter: 4 }, { status: 503 });
    }

    // Rate limit: 10 offers per hour per IP, 5 per email
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const allowedIp = await checkRateLimit(`offer_ip:${ip}`, 10, 3600000);
    if (!allowedIp) {
      return NextResponse.json({ error: 'Too many offers submitted from this IP. Please try again later.' }, { status: 429 });
    }

    const allowed = await checkRateLimit(`offer:${responderEmail}`, 5, 3600000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many offers submitted. Please try again later.' }, { status: 429 });
    }

    const responderRef = await hashRef(responderEmail);

    // Prevent creators from offering help to their own request from another device/incognito window
    if (responderRef === request.submitterRef) {
      return NextResponse.json({ error: 'You cannot offer help to your own request.' }, { status: 403 });
    }

    await db.insert(offers).values({
      id: generateId(),
      requestId: id,
      message: message.trim().slice(0, 1000),
      responderName: responderName?.trim().slice(0, 100) || null,
      responderRef,
      contactRevealed: false,
    });

    // Bump response count + update status
    await db.update(requests).set({
      responseCount: sql`${requests.responseCount} + 1`,
      status: 'responded',
      updatedAt: new Date(),
    }).where(eq(requests.id, id));

    // Return the contact method (gated — only revealed after message submitted)
    return NextResponse.json({
      success: true,
      contactMethod: request.contactMethod,
    });
  } catch (err) {
    console.error('[POST /api/requests/[id]/offers]', err);
    return NextResponse.json({ error: 'Failed to submit offer.' }, { status: 500 });
  }
}
