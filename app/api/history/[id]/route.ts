import { NextRequest, NextResponse } from 'next/server';
import { deleteHistoryForUser } from '@/lib/server-data';
import { getRequestSession } from '@/lib/server-session';

export const runtime = 'nodejs';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = getRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteHistoryForUser(session.userId, id);
  return NextResponse.json({ ok: true });
}
