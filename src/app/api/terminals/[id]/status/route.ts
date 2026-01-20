
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await query('BEGIN');
  try {
    const terminalId = params.id;
    const { status, verificationDate, verifiedUntil, user } = await request.json();

    if (!status || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let historyEvent = '';
    let queryText = '';
    let queryParams: any[] = [];

    if (status === 'verified' && verificationDate && verifiedUntil) {
      historyEvent = 'Поверен';
      queryText = 'UPDATE terminals SET status = $1, "lastVerificationDate" = $2, "verifiedUntil" = $3, history = history || $4::jsonb WHERE "serialNumber" = $5';
      queryParams = ['verified', verificationDate, verifiedUntil, JSON.stringify({ date: new Date().toISOString(), event: historyEvent, responsible: user }), terminalId];
    } else if (status === 'pending') {
      historyEvent = 'Переведен в статус "Ожидание"';
      queryText = 'UPDATE terminals SET status = $1, history = history || $2::jsonb WHERE "serialNumber" = $3';
      queryParams = ['pending', JSON.stringify({ date: new Date().toISOString(), event: historyEvent, responsible: user }), terminalId];
    } else if (status === 'not_verified') {
      historyEvent = 'Статус сброшен на "Не поверен"';
      queryText = 'UPDATE terminals SET status = $1, "lastVerificationDate" = NULL, "verifiedUntil" = NULL, history = history || $2::jsonb WHERE "serialNumber" = $3';
      queryParams = ['not_verified', JSON.stringify({ date: new Date().toISOString(), event: historyEvent, responsible: user }), terminalId];
    } else {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    await query(queryText, queryParams);
    
    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to update terminal status:', error);
    return NextResponse.json({ error: 'Failed to update terminal status' }, { status: 500 });
  }
}
