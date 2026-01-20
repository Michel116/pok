
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(request: NextRequest) {
  const client = await query('BEGIN');
  try {
    const { terminalIds, status, event, responsible } = await request.json();
    
    if (!terminalIds || !Array.isArray(terminalIds) || !status || !event || !responsible) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const historyEntry = { date: new Date().toISOString(), event, responsible };

    for (const terminalId of terminalIds) {
      await query(
        'UPDATE terminals SET status = $1, history = history || $2::jsonb WHERE "serialNumber" = $3',
        [status, JSON.stringify(historyEntry), terminalId]
      );
    }
    
    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to batch update terminal status:', error);
    return NextResponse.json({ error: 'Failed to batch update terminal status' }, { status: 500 });
  }
}
