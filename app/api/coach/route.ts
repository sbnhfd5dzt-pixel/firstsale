import { NextResponse } from 'next/server';

const GEMINI_KEY = 'AQ.Ab8RN6KGd0_XV0ibCzrDXvLzONkEcL48F8kke_ua-2zzR5sG2w';

export async function POST(req: Request) {
  try {
    const { message, planContext } = await req.json();

    const prompt = `You are FirstSale AI, an expert startup coach.
User Context: ${planContext || 'General micro-SaaS / digital business'}
User Question: "${message}"

Give direct, encouraging, actionable, and concise advice (2-4 sentences max).`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to contact AI Coach' }, { status: 500 });
    }

    const replyText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error('Coach API Error:', error);
    return NextResponse.json({ error: 'Coach API error' }, { status: 500 });
  }
}