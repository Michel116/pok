
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Optional: Prevent deleting the main admin user
    const userToDelete = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userToDelete.rows.length > 0 && userToDelete.rows[0].role === 'Administrator') {
      return NextResponse.json({ error: 'Cannot delete the main administrator account' }, { status: 403 });
    }

    const result = await query('DELETE FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
