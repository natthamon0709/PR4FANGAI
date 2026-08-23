import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const departments = db.prepare('SELECT * FROM departments ORDER BY code ASC').all();
    const subDepartments = db.prepare('SELECT * FROM sub_departments ORDER BY code ASC').all();

    return NextResponse.json({
      departments,
      subDepartments
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}
