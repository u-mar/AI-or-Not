import { NextRequest, NextResponse } from 'next/server';
import { addHistoryForUser, clearHistoryForUser, getHistoryForUser } from '@/lib/server-data';
import { getRequestSession } from '@/lib/server-session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = getRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const history = await getHistoryForUser(session.userId);
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  const session = getRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const item = await addHistoryForUser(session.userId, {
      thumbnail: body.thumbnail ?? '',
      prediction: body.prediction ?? '',
      isAI: Boolean(body.isAI),
      confidence: Number(body.confidence ?? 0),
      model: body.model ?? '',
      duration: Number(body.duration ?? 0),
      fileName: body.fileName ?? '',
    });
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save history';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await clearHistoryForUser(session.userId);
  return NextResponse.json({ ok: true });
}
