
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  const client = await query('BEGIN');
  try {
    const { terminalId, user } = await request.json();

    if (!terminalId || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const terminalRes = await query('SELECT history FROM terminals WHERE "serialNumber" = $1 AND status = \'rented\'', [terminalId]);
    if (terminalRes.rows.length === 0) {
      return NextResponse.json({ error: 'Terminal not found or not in rented status' }, { status: 404 });
    }

    const currentHistory = terminalRes.rows[0].history || [];
    const keptHistory = currentHistory.filter((h: any) => 
      h.event.includes('Поверен') || h.event.includes('Добавлен в арендный фонд')
    );

    const newHistory = [
      ...keptHistory,
      {
        date: new Date().toISOString(),
        event: 'Возвращен на арендный склад',
        responsible: user
      }
    ];

    await query(
      'UPDATE terminals SET status = $1, location = NULL, position = NULL, history = $2 WHERE "serialNumber" = $3',
      ['not_verified', JSON.stringify(newHistory), terminalId]
    );

    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to return terminal:', error);
    return NextResponse.json({ error: 'Failed to return terminal' }, { status: 500 });
  }
}
