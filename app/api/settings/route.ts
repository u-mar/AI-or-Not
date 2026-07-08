import { NextRequest, NextResponse } from 'next/server';
import { getSettingsForUser, saveSettingsForUser } from '@/lib/server-data';
import { getRequestSession } from '@/lib/server-session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = getRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getSettingsForUser(session.userId);
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = getRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const settings = await saveSettingsForUser(session.userId, {
      theme: body?.theme,
      notifications: body?.notifications,
    });
    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
