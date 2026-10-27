import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    let departments: any[] = [];
    let subDepartments: any[] = [];

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const [deptRes, subDeptRes] = await Promise.all([
          supabaseAdmin.from('departments').select('*').order('code', { ascending: true }),
          supabaseAdmin.from('sub_departments').select('*').order('code', { ascending: true })
        ]);

        if (!deptRes.error && deptRes.data && deptRes.data.length > 0) {
          departments = deptRes.data;
        }

        if (!subDeptRes.error && subDeptRes.data && subDeptRes.data.length > 0) {
          subDepartments = subDeptRes.data;
        }
      } catch (sbErr) {
        console.warn('Supabase fetch departments warning:', sbErr);
      }
    }

    // 2. Fallback to SQLite for any missing data
    const db = getDb();
    if (departments.length === 0) {
      departments = db.prepare('SELECT * FROM departments ORDER BY code ASC').all();
    }
    if (subDepartments.length === 0) {
      subDepartments = db.prepare('SELECT * FROM sub_departments ORDER BY code ASC').all();
    }

    return NextResponse.json({
      departments,
      subDepartments
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}
