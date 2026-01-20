
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await query('BEGIN');
  try {
    const requestId = params.id;
    const body = await request.json();

    if (body.status === 'processed') {
      await query(
        'UPDATE verification_requests SET status = $1, "processedAt" = $2 WHERE id = $3',
        ['processed', new Date().toISOString(), requestId]
      );
    } else if (body.newId && body.newDate) {
      // Update ID and Date
      await query(
        'UPDATE verification_requests SET id = $1, "createdAt" = $2 WHERE id = $3',
        [body.newId, body.newDate, requestId]
      );

      if (requestId !== body.newId) {
        // Update history in terminals if ID changed
        const req = await query('SELECT "terminalIds" FROM verification_requests WHERE id = $1', [body.newId]);
        const terminalIds = req.rows[0]?.terminalIds || [];

        const oldHistoryEvent = `Добавлен в заявку на поверку ${requestId}`;
        const newHistoryEvent = `Добавлен в заявку на поверку ${body.newId}`;

        for (const terminalId of terminalIds) {
          const terminalRes = await query('SELECT history FROM terminals WHERE "serialNumber" = $1', [terminalId]);
          let history = terminalRes.rows[0]?.history || [];
          
          history = history.map((h: any) => 
            h.event === oldHistoryEvent ? { ...h, event: newHistoryEvent } : h
          );

          await query('UPDATE terminals SET history = $1 WHERE "serialNumber" = $2', [JSON.stringify(history), terminalId]);
        }
      }
    } else {
        return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to update verification request:', error);
    return NextResponse.json({ error: 'Failed to update verification request' }, { status: 500 });
  }
}
