
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await query('BEGIN');
  try {
    const terminalId = params.id;
    const { newShippingDate } = await request.json();

    if (!newShippingDate) {
        return NextResponse.json({ error: 'newShippingDate is required' }, { status: 400 });
    }
    
    // Update shipment table
    await query('UPDATE shipments SET "shippingDate" = $1 WHERE "terminalId" = $2', [newShippingDate, terminalId]);

    // Update history in terminal table
    const terminalRes = await query('SELECT history FROM terminals WHERE "serialNumber" = $1', [terminalId]);
    if (terminalRes.rows.length > 0) {
        let history = terminalRes.rows[0].history || [];
        const shipmentEventIndex = history.findIndex((h: any) => h.event.startsWith('Отгружен контрагенту:'));
        
        if (shipmentEventIndex !== -1) {
            history[shipmentEventIndex].date = newShippingDate;
            await query('UPDATE terminals SET history = $1 WHERE "serialNumber" = $2', [JSON.stringify(history), terminalId]);
        }
    }
    
    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to update shipment date:', error);
    return NextResponse.json({ error: 'Failed to update shipment date' }, { status: 500 });
  }
}
