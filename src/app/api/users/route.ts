
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const { rows } = await query('SELECT id, name, email, role, avatar_url FROM users ORDER BY name');
    const users = rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        avatarUrl: row.avatar_url
    }));
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const { name, password, role } = await request.json();

    if (!name || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await query('SELECT id FROM users WHERE name = $1', [name]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this name already exists' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const id = `user-${Date.now()}`;
    const email = `${name.toLowerCase()}@example.com`;
    const avatarUrl = `https://picsum.photos/seed/${name}/100/100`;

    const { rows } = await query(
      'INSERT INTO users (id, name, email, role, password_hash, avatar_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, avatar_url',
      [id, name, email, role, passwordHash, avatarUrl]
    );

    return NextResponse.json(rows[0], { status: 201 });

  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
