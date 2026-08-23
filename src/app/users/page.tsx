'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import UserSearchBar from '@/components/UserSearchBar';
import UserFilterGroup from '@/components/UserFilterGroup';
import UserTable from '@/components/UserTable';
import Pagination from '@/components/Pagination';
import ConfirmDialog from '@/components/ConfirmDialog';
import SessionAlert from '@/components/SessionAlert';
import { User, SessionUser } from '@/types';
import { UserPlus, RefreshCw, FileSpreadsheet, Key, AlertCircle } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogAction, setDialogAction] = useState<'toggleStatus' | 'delete' | 'resetPass' | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [tempPassResult, setTempPassResult] = useState<{ user: User; pass: string } | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Check Auth & Session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'administrator') {
          router.push('/dashboard');
          return;
        }
        setCurrentUser(data.user);
      } catch (e) {
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // 2. Fetch Users with Search & Filter
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        departmentId,
        role,
        status,
      });

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentId, role, status]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleResetFilters = () => {
    setDepartmentId('');
    setRole('');
    setStatus('');
    setSearch('');
    setPage(1);
  };

  // Actions
  const handleToggleStatus = (user: User) => {
    setSelectedUser(user);
    setDialogAction('toggleStatus');
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDialogAction('delete');
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setDialogAction('resetPass');
  };

  const confirmAction = async () => {
    if (!selectedUser || !dialogAction) return;
    setDialogLoading(true);

    try {
      if (dialogAction === 'toggleStatus') {
        const newStatus = selectedUser.status === 'active' ? 'suspended' : 'active';
        const res = await fetch(`/api/users/${selectedUser.user_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          setAlertMessage({
            type: 'success',
            text: `${newStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับการใช้งาน'} บัญชี ${selectedUser.first_name} เรียบร้อยแล้ว`,
          });
          fetchUsers();
        }
      } else if (dialogAction === 'delete') {
        const res = await fetch(`/api/users/${selectedUser.user_id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setAlertMessage({
            type: 'success',
            text: `ลบบัญชี ${selectedUser.first_name} ${selectedUser.last_name} เรียบร้อยแล้ว`,
          });
          fetchUsers();
        } else {
          const data = await res.json();
          setAlertMessage({ type: 'error', text: data.error || 'ไม่สามารถลบบัญชีนี้ได้' });
        }
      } else if (dialogAction === 'resetPass') {
        const res = await fetch(`/api/users/${selectedUser.user_id}/reset-password`, {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          setTempPassResult({ user: selectedUser, pass: data.tempPassword });
        }
      }
    } catch (e: any) {
      setAlertMessage({ type: 'error', text: e.message });
    } finally {
      setDialogLoading(false);
      setDialogAction(null);
      setSelectedUser(null);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[{ label: 'จัดการผู้ใช้งาน' }]}
    >
      <div className="space-y-6">
        {/* Header Title & Add Button matching Wireframe 4.2 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-onSurface">
              จัดการผู้ใช้งาน (User Management)
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              รายชื่อบุคลากรและสิทธิ์การใช้งานระบบ PR4Fang AI วิทยาลัยการอาชีพฝาง
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/integrations"
              className="h-11 px-4 rounded-lg border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-2 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-secondary" />
              <span>Google Sheets Sync</span>
            </Link>

            <Link
              href="/users/new"
              className="h-11 px-4 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </Link>
          </div>
        </div>

        {/* Global Alert Notification */}
        {alertMessage && (
          <SessionAlert
            type={alertMessage.type}
            message={alertMessage.text}
            onClose={() => setAlertMessage(null)}
          />
        )}

        {/* Password Reset Result Notification */}
        {tempPassResult && (
          <div className="p-4 rounded-xl bg-secondary-container/50 border border-secondary text-onSurface space-y-2 animate-scaleUp">
            <h4 className="font-heading font-bold text-secondary-dark flex items-center gap-2 text-sm">
              <Key className="w-4 h-4 text-secondary" />
              <span>รีเซ็ตรหัสผ่านชั่วคราวสำเร็จ</span>
            </h4>
            <p className="text-xs text-onSurface-variant">
              รหัสผ่านใหม่สำหรับคุณ <strong>{tempPassResult.user.first_name} {tempPassResult.user.last_name}</strong> ({tempPassResult.user.email}):
            </p>
            <div className="flex items-center gap-3 pt-1">
              <code className="px-3 py-1.5 bg-surface-card rounded-lg border border-secondary/40 font-mono text-base font-bold text-primary tracking-wider">
                {tempPassResult.pass}
              </code>
              <button
                onClick={() => setTempPassResult(null)}
                className="text-xs font-semibold text-primary hover:underline ml-auto"
              >
                ปิดข้อความ ✕
              </button>
            </div>
          </div>
        )}

        {/* Filter & Search Bar matching Wireframe 4.2 */}
        <div className="p-4 rounded-xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <UserSearchBar value={search} onChange={handleSearchChange} />
            <UserFilterGroup
              departmentId={departmentId}
              role={role}
              status={status}
              onDepartmentChange={(v) => { setDepartmentId(v); setPage(1); }}
              onRoleChange={(v) => { setRole(v); setPage(1); }}
              onStatusChange={(v) => { setStatus(v); setPage(1); }}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        {/* Users Table */}
        <UserTable
          users={users}
          loading={loading}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={dialogAction === 'toggleStatus'}
        title={selectedUser?.status === 'active' ? 'ระงับการใช้งานบัญชี' : 'เปิดใช้งานบัญชี'}
        message={`คุณต้องการที่จะ ${selectedUser?.status === 'active' ? 'ระงับการใช้งาน' : 'เปิดใช้งาน'} บัญชีของ "${selectedUser?.first_name} ${selectedUser?.last_name}" (${selectedUser?.email}) ใช่หรือไม่?`}
        confirmText={selectedUser?.status === 'active' ? 'ระงับบัญชี' : 'เปิดใช้งาน'}
        variant={selectedUser?.status === 'active' ? 'danger' : 'primary'}
        loading={dialogLoading}
        onConfirm={confirmAction}
        onCancel={() => { setDialogAction(null); setSelectedUser(null); }}
      />

      <ConfirmDialog
        isOpen={dialogAction === 'delete'}
        title="ลบบัญชีผู้ใช้งาน"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของ "${selectedUser?.first_name} ${selectedUser?.last_name}" (${selectedUser?.email})? การดำเนินการนี้ไม่สามารถเรียกคืนได้`}
        confirmText="ยืนยันการลบ"
        variant="danger"
        loading={dialogLoading}
        onConfirm={confirmAction}
        onCancel={() => { setDialogAction(null); setSelectedUser(null); }}
      />

      <ConfirmDialog
        isOpen={dialogAction === 'resetPass'}
        title="รีเซ็ตรหัสผ่านผู้ใช้งาน"
        message={`คุณต้องการสุ่มรหัสผ่านใหม่สำหรับ "${selectedUser?.first_name} ${selectedUser?.last_name}" ใช่หรือไม่?`}
        confirmText="สุ่มรหัสผ่านใหม่"
        variant="primary"
        loading={dialogLoading}
        onConfirm={confirmAction}
        onCancel={() => { setDialogAction(null); setSelectedUser(null); }}
      />
    </DashboardLayout>
  );
}
