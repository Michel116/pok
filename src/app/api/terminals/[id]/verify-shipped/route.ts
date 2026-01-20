
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await query('BEGIN');
  try {
    const terminalId = params.id;
    const { verificationDate, verifiedUntil, user } = await request.json();

    if (!verificationDate || !verifiedUntil || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const terminalRes = await query('SELECT status FROM terminals WHERE "serialNumber" = $1', [terminalId]);
    if (terminalRes.rows.length === 0) {
        return NextResponse.json({ error: 'Terminal not found' }, { status: 404 });
    }
    const currentStatus = terminalRes.rows[0].status;

    const newStatus = currentStatus === 'awaits_verification_after_shipping' ? 'shipped' : 'verified';
    const historyEvent = 'Данные о поверке внесены (после отгрузки)';
    
    await query(
      'UPDATE terminals SET status = $1, "lastVerificationDate" = $2, "verifiedUntil" = $3, history = history || $4::jsonb WHERE "serialNumber" = $5',
      [newStatus, verificationDate, verifiedUntil, JSON.stringify({ date: new Date().toISOString(), event: historyEvent, responsible: user }), terminalId]
    );
    
    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to update shipped terminal verification:', error);
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
  }
}
