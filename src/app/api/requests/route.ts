
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM verification_requests ORDER BY "createdAt" DESC');
    const requests = rows.map(r => ({
        ...r,
        terminalIds: r.terminalIds || [],
    }));
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to fetch verification requests:', error);
    return NextResponse.json({ error: 'Failed to fetch verification requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const client = await query('BEGIN');
  try {
    const { terminalIds, customId, user } = await request.json();
    if (!terminalIds || terminalIds.length === 0 || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    let newId = customId;
    if (!newId) {
        const result = await query('SELECT COUNT(*) FROM verification_requests');
        const count = parseInt(result.rows[0].count, 10);
        newId = `Заявка №${String(count + 1).padStart(4, '0')}`;
    }

    const now = new Date();
    await query(
        'INSERT INTO verification_requests (id, status, "createdAt", "terminalIds", "createdBy") VALUES ($1, $2, $3, $4, $5)',
        [newId, 'pending', now.toISOString(), terminalIds, user]
    );

    const historyEvent = `Добавлен в заявку на поверку ${newId}`;
    for (const terminalId of terminalIds) {
        await query(
            'UPDATE terminals SET status = $1, history = history || $2::jsonb WHERE "serialNumber" = $3',
            ['pending', JSON.stringify({ date: now.toISOString(), event: historyEvent, responsible: user }), terminalId]
        );
    }
    
    await query('COMMIT');
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to create verification request:', error);
    return NextResponse.json({ error: 'Failed to create verification request' }, { status: 500 });
  }
}
