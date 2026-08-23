const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 8.1 Overview & General Page (/settings and /settings/general)
ensureDir('./src/app/settings');
const generalPageCode = `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import CollegeProfileForm from '@/components/settings/CollegeProfileForm';
import { CollegeProfile } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsGeneralPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<CollegeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadProfile = () => {
    fetch('/api/settings/general')
      .then(res => res.json())
      .then(d => {
        if (d.profile) setProfile(d.profile);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  if (!user || loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'ข้อมูลทั่วไปของวิทยาลัย' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>ตั้งค่าระบบและศูนย์ควบคุม (System Settings)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ศูนย์รวมการตั้งค่าระดับระบบ นโยบายความปลอดภัย โครงสร้างฝ่าย และการเชื่อมต่อ
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <CollegeProfileForm initialData={profile} onSaveSuccess={loadProfile} />
      </div>
    </DashboardLayout>
  );
}
`;

fs.writeFileSync('./src/app/settings/page.tsx', generalPageCode, 'utf8');
ensureDir('./src/app/settings/general');
fs.writeFileSync('./src/app/settings/general/page.tsx', generalPageCode, 'utf8');

// 8.2 Departments Page
ensureDir('./src/app/settings/departments');
fs.writeFileSync('./src/app/settings/departments/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import DepartmentTreeView from '@/components/settings/DepartmentTreeView';
import { DepartmentTreeNode } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsDepartmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadDepartments = () => {
    fetch('/api/settings/departments')
      .then(res => res.json())
      .then(d => {
        if (d.departments) setDepartments(d.departments);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadDepartments();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'จัดการฝ่ายและงาน' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>จัดการฝ่ายและงาน (Departments & Sub-departments)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            กำหนดโครงสร้างองค์กร 4 ฝ่ายหลักและงานย่อยสำหรับผู้ใช้งานและคลังองค์ความรู้
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <DepartmentTreeView departments={departments} onRefresh={loadDepartments} />
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 8.3 Security Policy Page
ensureDir('./src/app/settings/security');
fs.writeFileSync('./src/app/settings/security/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import SecurityPolicyForm from '@/components/settings/SecurityPolicyForm';
import { SecurityPolicy } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsSecurityPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadPolicy = () => {
    fetch('/api/settings/security')
      .then(res => res.json())
      .then(d => {
        if (d.policy) setPolicy(d.policy);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadPolicy();
  }, [user]);

  if (!user || loading || !policy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'นโยบายความปลอดภัย' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>นโยบายความปลอดภัยระบบ (Security Policies)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ตั้งค่านโยบายรหัสผ่าน การป้องกันล็อกอินผิดพลาด และการหมดเวลา Session
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <SecurityPolicyForm initialPolicy={policy} onSaveSuccess={loadPolicy} />
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 8.4 Notification Rules Page
ensureDir('./src/app/settings/notifications');
fs.writeFileSync('./src/app/settings/notifications/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import NotificationRuleTable from '@/components/settings/NotificationRuleTable';
import { NotificationRule } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsNotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadRules = () => {
    fetch('/api/settings/notifications')
      .then(res => res.json())
      .then(d => {
        if (d.rules) setRules(d.rules);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadRules();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'การแจ้งเตือนระบบ' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>กฎการแจ้งเตือนระดับระบบ (System Notification Rules)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            กำหนดช่องทางและผู้รับการแจ้งเตือนสำหรับเหตุการณ์สำคัญของระบบ
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <NotificationRuleTable initialRules={rules} onRefresh={loadRules} />
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 8.5 Audit Log Page
ensureDir('./src/app/settings/audit-log');
fs.writeFileSync('./src/app/settings/audit-log/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import AuditLogTable from '@/components/settings/AuditLogTable';
import { SystemAuditLog } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsAuditLogPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string | undefined>();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadLogs = (action?: string) => {
    const params = new URLSearchParams();
    if (action) params.set('action', action);

    fetch(\`/api/settings/audit-log?\${params.toString()}\`)
      .then(res => res.json())
      .then(d => {
        if (d.logs) setLogs(d.logs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadLogs(filterAction);
  }, [user, filterAction]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'บันทึกกิจกรรมระบบ' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>บันทึกกิจกรรมระบบ (System Audit Log)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ประวัติการเปลี่ยนแปลงค่าตั้งระบบ โครงสร้างฝ่าย และนโยบายความปลอดภัย
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <AuditLogTable logs={logs} onFilterChange={setFilterAction} />
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 8.6 Backup Page
ensureDir('./src/app/settings/backup');
fs.writeFileSync('./src/app/settings/backup/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import BackupTriggerCard from '@/components/settings/BackupTriggerCard';
import { BackupJob } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsBackupPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [backups, setBackups] = useState<BackupJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadBackups = () => {
    fetch('/api/settings/backup')
      .then(res => res.json())
      .then(d => {
        if (d.backups) setBackups(d.backups);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadBackups();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'สำรองและกู้คืนข้อมูล' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>สำรองและกู้คืนข้อมูล (Backup & Data Export)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            สั่งสำรองข้อมูล Snapshot ฐานข้อมูล SQLite และจัดการไฟล์สำรองย้อนหลัง
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <BackupTriggerCard backups={backups} onRefresh={loadBackups} />
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 8.7 Integrations Hub Page
ensureDir('./src/app/settings/integrations');
fs.writeFileSync('./src/app/settings/integrations/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import IntegrationStatusCard from '@/components/settings/IntegrationStatusCard';
import { IntegrationItem } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsIntegrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadIntegrations = () => {
    fetch('/api/settings/integrations')
      .then(res => res.json())
      .then(d => {
        if (d.integrations) setIntegrations(d.integrations);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadIntegrations();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'ศูนย์รวมการเชื่อมต่อ' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>ศูนย์รวมการเชื่อมต่อระบบ (Integrations Hub)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            สรุปสถานะการเชื่อมต่อแบบเรียลไทม์ของ Google Sheets (Phase 4), AI Engine (Phase 5) และ LINE OA (Phase 6)
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => (
            <IntegrationStatusCard key={item.key} item={item} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 8.8 Personal Preferences Page (/settings/my-preferences)
ensureDir('./src/app/settings/my-preferences');
fs.writeFileSync('./src/app/settings/my-preferences/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import PersonalNotificationForm from '@/components/settings/PersonalNotificationForm';
import { UserPreferences } from '@/types/settings';
import { SessionUser } from '@/types';
import { UserCheck, Loader2 } from 'lucide-react';

export default function SettingsMyPreferencesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) setUser(d.user);
      });
  }, [router]);

  const loadPreferences = () => {
    fetch('/api/settings/my-preferences')
      .then(res => res.json())
      .then(d => {
        if (d.preferences) setPreferences(d.preferences);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadPreferences();
  }, [user]);

  if (!user || loading || !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'การตั้งค่าส่วนตัว' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            <span>การตั้งค่าส่วนตัว (My Preferences)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ปรับแต่งช่องทางและประเภทการแจ้งเตือนสำหรับบัญชีของคุณ
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <PersonalNotificationForm initialPreferences={preferences} />
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

console.log('All Phase 8 Pages (8.1 - 8.8) created successfully!');
