
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM shelf_sections ORDER BY id ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch shelf sections:', error);
    return NextResponse.json({ error: 'Failed to fetch shelf sections' }, { status: 500 });
  }
}
