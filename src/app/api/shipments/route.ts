
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM shipments ORDER BY "shippingDate" DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch shipments:', error);
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { terminalId, contragent, type, user } = await request.json(); // type is 'ship' or 'rent'

    if (!terminalId || !contragent || !type || !user) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const terminalRes = await query('SELECT status, history FROM terminals WHERE "serialNumber" = $1', [terminalId]);
    if (terminalRes.rows.length === 0) {
        return NextResponse.json({ error: 'Terminal not found' }, { status: 404 });
    }
    const terminalToShip = terminalRes.rows[0];
    const statusBeforeShipment = terminalToShip.status;

    // Add contragent if not exists
    await query('INSERT INTO contragents (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;', [contragent]);
    
    let newStatus: string;
    let historyEventText: string;

    const shippingDate = new Date().toISOString();

    if (type === 'ship') {
        newStatus = (statusBeforeShipment === 'pending' || statusBeforeShipment === 'not_verified' || statusBeforeShipment === 'expired') ? 'awaits_verification_after_shipping' : 'shipped';
        historyEventText = statusBeforeShipment === 'expired'
            ? `Отгружен контрагенту (с истекшим сроком поверки): ${contragent}`
            : `Отгружен контрагенту: ${contragent}`;
        
        // Create a shipment record
        await query(
            'INSERT INTO shipments ("terminalId", "shippingDate", contragent, "statusBeforeShipment") VALUES ($1, $2, $3, $4)',
            [terminalId, shippingDate, contragent, statusBeforeShipment]
        );

    } else if (type === 'rent') {
        newStatus = 'rented';
        historyEventText = statusBeforeShipment === 'expired'
            ? `Передан в аренду контрагенту (с истекшим сроком поверки): ${contragent}`
            : `Передан в аренду контрагенту: ${contragent}`;
    } else {
        return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
    }
    
    const newHistory = [...(terminalToShip.history || []), { date: shippingDate, event: historyEventText, responsible: user }];

    await query(
        'UPDATE terminals SET status = $1, location = NULL, position = NULL, history = $2 WHERE "serialNumber" = $3',
        [newStatus, JSON.stringify(newHistory), terminalId]
    );

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Failed to process shipment/rental:', error);
    return NextResponse.json({ error: 'Failed to process shipment/rental' }, { status: 500 });
  }
}
