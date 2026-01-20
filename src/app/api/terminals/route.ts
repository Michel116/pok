
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM terminals ORDER BY "serialNumber" ASC');
    // Map history to match expected type
    const terminals = rows.map(row => ({
      ...row,
      history: row.history || []
    }));
    return NextResponse.json(terminals);
  } catch (error) {
    console.error('Failed to fetch terminals:', error);
    return NextResponse.json({ error: 'Failed to fetch terminals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { serialNumber, boxType, sectionId, user } = await request.json();

    if (!serialNumber || !boxType || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if terminal already exists
    const existing = await query('SELECT "serialNumber" FROM terminals WHERE "serialNumber" = $1', [serialNumber]);
    if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Terminal with this serial number already exists' }, { status: 409 });
    }

    const isRental = serialNumber.startsWith('1792');
    const model = isRental ? 'Инспектор 1 (Аренда)' : 'Инспектор 1';
    const initialEvent = isRental ? 'Добавлен в арендный фонд' : 'Добавлен на склад';
    
    const history = JSON.stringify([{ date: new Date().toISOString(), event: initialEvent, responsible: user }]);

    let position = null;
    let location = null;

    if (sectionId) {
        const sectionTerminalsRes = await query('SELECT position FROM terminals WHERE location->>\'sectionId\' = $1', [sectionId]);
        const occupiedPositions = new Set(sectionTerminalsRes.rows.map(r => r.position));
        
        const sectionInfoRes = await query('SELECT capacity FROM shelf_sections WHERE id = $1', [sectionId]);
        const capacity = sectionInfoRes.rows[0]?.capacity;
        const boxTypeForCapacity = capacity?.[boxType] ? boxType : 'type_A'; // fallback
        const totalCells = capacity[boxTypeForCapacity].rows * capacity[boxTypeForCapacity].cols;

        for (let i = 0; i < totalCells; i++) {
            if (!occupiedPositions.has(i)) {
                position = i;
                break;
            }
        }

        if (position === null) {
            return NextResponse.json({ error: 'No available cells in the target section.' }, { status: 400 });
        }
        location = { sectionId, cell: position + 1 };
    }


    const { rows } = await query(
      `INSERT INTO terminals ("serialNumber", model, status, "boxType", history, location, position, "lastVerificationDate", "verifiedUntil")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NULL)
       RETURNING *`,
      [serialNumber, model, 'not_verified', boxType, history, location, position]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to add terminal:', error);
    return NextResponse.json({ error: 'Failed to add terminal' }, { status: 500 });
  }
}
