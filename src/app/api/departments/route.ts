import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import getDb from '@/lib/db';

export async function GET() {
  try {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const [deptRes, subDeptRes] = await Promise.all([
          supabaseAdmin.from('departments').select('*').order('code', { ascending: true }),
          supabaseAdmin.from('sub_departments').select('*').order('code', { ascending: true })
        ]);

        if (!deptRes.error && deptRes.data && deptRes.data.length > 0) {
          return NextResponse.json({
            departments: deptRes.data,
            subDepartments: subDeptRes.data || []
          });
        }
      } catch (sbErr) {
        // Fallback below
      }
    }

    // 2. Fallback to SQLite
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
