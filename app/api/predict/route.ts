import { NextRequest, NextResponse } from 'next/server';
import { detectImage } from '@/lib/detection';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    let imageData = body.image as string;
    if (imageData.includes(',')) {
      imageData = imageData.split(',')[1];
    }

    const bytes = Buffer.from(imageData, 'base64');
    if (bytes.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 });
    }
    if (bytes.length < 100) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    const result = await detectImage(imageData);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('[predict]', message);
    return NextResponse.json({ error: 'Analysis failed', message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
