
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query('SELECT name FROM contragents ORDER BY name ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch contragents:', error);
    return NextResponse.json({ error: 'Failed to fetch contragents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Contragent name is required' }, { status: 400 });
    }
    await query('INSERT INTO contragents (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
    return NextResponse.json({ message: 'Contragent added' }, { status: 201 });
  } catch (error) {
    console.error('Failed to add contragent:', error);
    return NextResponse.json({ error: 'Failed to add contragent' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
    try {
      const { name } = await request.json();
      if (!name) {
        return NextResponse.json({ error: 'Contragent name is required' }, { status: 400 });
      }
      await query('DELETE FROM contragents WHERE name = $1', [name]);
      return NextResponse.json({ message: 'Contragent deleted' }, { status: 200 });
    } catch (error) {
      console.error('Failed to delete contragent:', error);
      return NextResponse.json({ error: 'Failed to delete contragent' }, { status: 500 });
    }
  }
