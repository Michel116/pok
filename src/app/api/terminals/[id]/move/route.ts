
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await query('BEGIN');
  try {
    const terminalId = params.id;
    const { newSectionId, boxType, user } = await request.json();

    if (!newSectionId || !boxType || !user) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sectionTerminalsRes = await query('SELECT position FROM terminals WHERE location->>\'sectionId\' = $1', [newSectionId]);
    const occupiedPositions = new Set(sectionTerminalsRes.rows.map(r => r.position));
    
    const sectionInfoRes = await query('SELECT capacity FROM shelf_sections WHERE id = $1', [newSectionId]);
    if (sectionInfoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Target section not found.' }, { status: 404 });
    }
    const capacity = sectionInfoRes.rows[0]?.capacity;
    
    // Determine box type for capacity check
    const terminalsInTarget = await query('SELECT "boxType" FROM terminals WHERE location->>\'sectionId\' = $1 LIMIT 1', [newSectionId]);
    const currentBoxType = terminalsInTarget.rows.length > 0 ? terminalsInTarget.rows[0].boxType : null;
    const boxTypeForCapacity = currentBoxType || boxType;

    const capacityConfig = capacity[boxTypeForCapacity];
    const totalCells = capacityConfig.rows * capacityConfig.cols;

    if (currentBoxType && currentBoxType !== boxType) {
        return NextResponse.json({ error: 'Box type mismatch in target section.' }, { status: 400 });
    }

    let targetPosition: number | undefined;
    for (let i = 0; i < totalCells; i++) {
        if (!occupiedPositions.has(i)) {
            targetPosition = i;
            break;
        }
    }

    if (targetPosition === undefined) {
        return NextResponse.json({ error: 'No available cells in the target section.' }, { status: 400 });
    }

    const terminalRes = await query('SELECT location, history FROM terminals WHERE "serialNumber" = $1', [terminalId]);
    const oldLocation = terminalRes.rows[0]?.location;
    const history = terminalRes.rows[0]?.history || [];

    const historyEventText = oldLocation 
        ? `Перемещен со стеллажа ${oldLocation.sectionId} на ${newSectionId}` 
        : `Размещен на стеллаже ${newSectionId}`;

    const newHistory = [...history, { date: new Date().toISOString(), event: historyEventText, responsible: user }];
    const newLocation = { sectionId: newSectionId, cell: targetPosition + 1 };

    await query(
      'UPDATE terminals SET location = $1, position = $2, history = $3 WHERE "serialNumber" = $4',
      [newLocation, targetPosition, JSON.stringify(newHistory), terminalId]
    );

    await query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Failed to move terminal:', error);
    return NextResponse.json({ error: 'Failed to move terminal' }, { status: 500 });
  }
}
