export type Role = 'administrator' | 'staff';
export type Status = 'active' | 'suspended';

export interface Department {
  department_id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface SubDepartment {
  sub_department_id: string;
  department_id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  department_id: string;
  sub_department_id: string;
  role: Role;
  status: Status;
  avatar_url?: string | null;
  line_user_id?: string | null;
  failed_login_count: number;
  locked_until?: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  department_name?: string;
  sub_department_name?: string;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export interface LoginAuditLog {
  log_id: string;
  user_id?: string | null;
  email_attempted: string;
  result: 'success' | 'failed_password' | 'account_suspended' | 'account_locked';
  ip_address: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  department_name?: string;
}

export interface SessionUser {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  status: Status;
  department_id: string;
  sub_department_id: string;
  department_name: string;
  sub_department_name: string;
  avatar_url?: string | null;
  line_user_id?: string | null;
}

export * from './dashboard';

export * from './knowledge';

export * from './sheets';
