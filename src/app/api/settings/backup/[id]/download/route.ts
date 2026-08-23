import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'data', 'backups', `${params.id}.db`);
    const fallbackDbPath = path.join(process.cwd(), 'data', 'pr4fang.db');

    const targetFile = fs.existsSync(filePath) ? filePath : fallbackDbPath;

    if (!fs.existsSync(targetFile)) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(targetFile);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="PR4Fang-Backup-${params.id}.db"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
