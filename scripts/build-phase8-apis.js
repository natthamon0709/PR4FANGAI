const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. General Info API
ensureDir('./src/app/api/settings/general');
fs.writeFileSync('./src/app/api/settings/general/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getCollegeProfile, updateCollegeProfile } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = getCollegeProfile();
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const updated = updateCollegeProfile(body, session.user_id);
    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 2. Departments API
ensureDir('./src/app/api/settings/departments');
fs.writeFileSync('./src/app/api/settings/departments/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDepartmentTree, createDepartment } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const departments = getDepartmentTree();
    return NextResponse.json({ departments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, display_order } = body;
    if (!name || !code) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อฝ่ายและรหัสฝ่าย' }, { status: 400 });
    }

    const created = createDepartment({ name, code, display_order }, session.user_id);
    return NextResponse.json({ success: true, department: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 3. Single Department API
ensureDir('./src/app/api/settings/departments/[id]');
fs.writeFileSync('./src/app/api/settings/departments/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { updateDepartment, checkDepartmentUsage, deleteOrDeactivateDepartment } from '@/lib/settings-service';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    updateDepartment(params.id, body, session.user_id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const forceDeactivate = searchParams.get('force') === 'deactivate';

    const result = deleteOrDeactivateDepartment(params.id, forceDeactivate, session.user_id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
`, 'utf8');

// 4. Sub-departments API
ensureDir('./src/app/api/settings/sub-departments');
fs.writeFileSync('./src/app/api/settings/sub-departments/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createSubDepartment } from '@/lib/settings-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const { department_id, name, code, display_order } = body;
    if (!department_id || !name || !code) {
      return NextResponse.json({ error: 'กรุณาระบุฝ่าย สังกัดชื่องาน และรหัสงาน' }, { status: 400 });
    }

    const created = createSubDepartment({ department_id, name, code, display_order }, session.user_id);
    return NextResponse.json({ success: true, sub_department: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 5. Single Sub-department API
ensureDir('./src/app/api/settings/sub-departments/[id]');
fs.writeFileSync('./src/app/api/settings/sub-departments/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { updateSubDepartment, deleteOrDeactivateSubDepartment } from '@/lib/settings-service';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    updateSubDepartment(params.id, body, session.user_id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const forceDeactivate = searchParams.get('force') === 'deactivate';

    const result = deleteOrDeactivateSubDepartment(params.id, forceDeactivate, session.user_id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
`, 'utf8');

// 6. Security Policies API
ensureDir('./src/app/api/settings/security');
fs.writeFileSync('./src/app/api/settings/security/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getSecurityPolicy, updateSecurityPolicy, resetSecurityPolicy } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const policy = getSecurityPolicy();
    return NextResponse.json({ policy });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    let updated;
    if (body.action === 'reset_default') {
      updated = resetSecurityPolicy(session.user_id);
    } else {
      updated = updateSecurityPolicy(body, session.user_id);
    }

    return NextResponse.json({ success: true, policy: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 7. Notification Rules API
ensureDir('./src/app/api/settings/notifications');
fs.writeFileSync('./src/app/api/settings/notifications/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getNotificationRules, updateNotificationRule } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const rules = getNotificationRules();
    return NextResponse.json({ rules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const { rule_id, notify_roles, notify_channels, is_active } = body;
    if (!rule_id) return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });

    updateNotificationRule(rule_id, { notify_roles, notify_channels, is_active }, session.user_id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 8. System Audit Log API
ensureDir('./src/app/api/settings/audit-log');
fs.writeFileSync('./src/app/api/settings/audit-log/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getSystemAuditLogs } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 100;
    const action = searchParams.get('action') || undefined;

    const logs = getSystemAuditLogs(limit, action);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 9. Backup API
ensureDir('./src/app/api/settings/backup');
fs.writeFileSync('./src/app/api/settings/backup/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getBackupJobs, createBackupJob } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const backups = getBackupJobs();
    return NextResponse.json({ backups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const job = createBackupJob('manual', session.user_id);
    return NextResponse.json({ success: true, backup: job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 10. Backup Download API
ensureDir('./src/app/api/settings/backup/[id]/download');
fs.writeFileSync('./src/app/api/settings/backup/[id]/download/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'data', 'backups', \`\${params.id}.db\`);
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
        'Content-Disposition': \`attachment; filename="PR4Fang-Backup-\${params.id}.db"\`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 11. Integrations Summary API
ensureDir('./src/app/api/settings/integrations');
fs.writeFileSync('./src/app/api/settings/integrations/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getIntegrationsSummary } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const summary = getIntegrationsSummary();
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 12. Personal Preferences API
ensureDir('./src/app/api/settings/my-preferences');
fs.writeFileSync('./src/app/api/settings/my-preferences/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getUserPreferences, updateUserPreferences } from '@/lib/settings-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const preferences = getUserPreferences(session.user_id);
    return NextResponse.json({ preferences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const updated = updateUserPreferences(session.user_id, body);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

console.log('All Phase 8 API routes (12 routes) built successfully!');
