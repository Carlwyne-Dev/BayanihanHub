import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a helpful assistant for BayanihanHub, a community help platform.
Your task is to extract structured information from a raw social media post or message about someone needing or offering help.

Return ONLY valid JSON with these exact fields:
{
  "title": "Brief one-line summary of the request (max 80 chars)",
  "description": "Cleaned-up description with key details",
  "category": "one of: health | food | supplies | shelter | information | transport | other",
  "type": "ASK or OFFER",
  "urgency": "one of: urgent | normal | low",
  "locationLabel": "Extract ONLY the map-searchable geographic location (e.g. exact hospital name, City, Province, or landmark). Strip out descriptive fluff like 'coastal sitio in', 'near the', etc. Just return the actual location name.",
  "contactMethod": "Extract ONLY phone numbers, emails, or exact social media handles. If the text just says 'contact us' without providing a specific number/email, you MUST return an empty string. NEVER return sentences or conversational text.",
  "sourceUrl": "If there is a web link/URL in the text (e.g. to a Facebook post), extract it here. Otherwise empty.",
  "sourcePlatform": "If a link is found, guess the platform: facebook | tiktok | instagram | x | other. If no link, return 'none'"
}

Rules:
- If a field cannot be determined or is not present, use an empty string (never null or undefined).
- category must be exactly one of the listed values
- type must be exactly ASK or OFFER
- urgency must be exactly urgent, normal, or low
- sourcePlatform must be exactly one of the listed values
- Never invent information not present in the original text
- Keep the title concise and clear`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json({ error: 'Text is too short or missing.' }, { status: 400 });
    }

    if (text.length > 5000) {
      return NextResponse.json({ error: 'Text is too long. Please trim it under 5000 characters.' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Extract structured info from this text:\n\n${text}` },
      ],
      temperature: 0.2,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const parsed = JSON.parse(content);

    // Validate and sanitize
    const result = {
      title:         typeof parsed.title === 'string'         ? parsed.title.slice(0, 80)          : '',
      description:   typeof parsed.description === 'string'   ? parsed.description.slice(0, 2000)  : '',
      category:      ['health','food','supplies','shelter','information','transport','other'].includes(parsed.category)
                     ? parsed.category : 'other',
      type:          ['ASK','OFFER'].includes(parsed.type)     ? parsed.type                        : 'ASK',
      urgency:       ['urgent','normal','low'].includes(parsed.urgency) ? parsed.urgency            : 'normal',
      locationLabel: typeof parsed.locationLabel === 'string'  ? parsed.locationLabel.slice(0, 100) : '',
      contactMethod: typeof parsed.contactMethod === 'string'  ? parsed.contactMethod.slice(0, 200) : '',
      sourceUrl:     typeof parsed.sourceUrl === 'string'      ? parsed.sourceUrl.slice(0, 500)     : '',
      sourcePlatform:['facebook','tiktok','instagram','x','other'].includes(parsed.sourcePlatform) ? parsed.sourcePlatform : 'none',
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('[AI Structure Error]', err);
    // Fallback — return empty structure, client will show manual form
    return NextResponse.json({
      success: false,
      fallback: true,
      error: 'AI could not structure this automatically. Please fill in the fields manually.',
      data: { title: '', description: '', category: 'other', type: 'ASK', urgency: 'normal', locationLabel: '', contactMethod: '' },
    }, { status: 200 }); // 200 so the client can handle gracefully
  }
}
