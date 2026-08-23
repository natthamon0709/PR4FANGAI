'use client';
import React from 'react';
import { Users, Search, UserCheck, ShieldAlert, User, Clock } from 'lucide-react';
import { LineFollower } from '@/types/line';

interface FollowerTableProps {
  followers: LineFollower[];
  search: string;
  onSearchChange: (s: string) => void;
  statusFilter: string;
  onStatusFilterChange: (st: string) => void;
}

export default function FollowerTable({
  followers,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}: FollowerTableProps) {
  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-onSurface-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อโปรไฟล์ LINE หรือชื่อเจ้าหน้าที่ที่ผูกบัญชี..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="linked">✅ ผูกบัญชีบุคลากรแล้ว</option>
          <option value="guest">👤 ผู้ติดตามทั่วไป (Guest)</option>
          <option value="blocked">🚫 บล็อก Official Account</option>
        </select>
      </div>

      {/* Followers Table */}
      <div className="rounded-2xl bg-surface-card border border-outline/30 shadow-level1 overflow-hidden">
        {followers.length === 0 ? (
          <div className="p-12 text-center text-onSurface-muted space-y-3">
            <Users className="w-12 h-12 mx-auto text-[#00B900]/40" />
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-onSurface">ยังไม่มีรายชื่อผู้ติดตามในระบบ</h4>
              <p className="text-xs text-onSurface-muted mt-1 leading-relaxed">
                ท่านสามารถกดปุ่ม <strong>"ดึงผู้ติดตามสดจาก LINE API"</strong> ด้านบนเพื่อดึงรายชื่อจริงทั้งหมด หรือเมื่อมีผู้ใช้งานเพิ่มเพื่อน / ส่งข้อความหาบอท ระบบจะบันทึกโปรไฟล์จริงให้อัตโนมัติทันที
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-variant/40 border-b border-outline/20 text-onSurface-muted font-heading font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">ผู้ติดตาม (LINE Profile)</th>
                  <th className="py-3.5 px-4">การผูกบัญชีบุคลากร</th>
                  <th className="py-3.5 px-4">ฝ่ายงาน</th>
                  <th className="py-3.5 px-4">ติดตามเมื่อ</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/15">
                {followers.map((f) => (
                  <tr key={f.follower_id} className="hover:bg-surface-variant/30 transition-colors">
                    {/* Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={f.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.line_user_id}`}
                          alt={f.display_name || 'LINE User'}
                          className="w-8 h-8 rounded-full border border-outline/30 object-cover bg-surface"
                        />
                        <div>
                          <span className="font-semibold text-onSurface block">
                            {f.display_name || 'ผู้ใช้งาน LINE'}
                          </span>
                          <span className="font-mono text-[10px] text-onSurface-muted truncate max-w-[140px] block">
                            {f.line_user_id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Linked User */}
                    <td className="py-3.5 px-4">
                      {f.linked_master_user_id ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                          <UserCheck className="w-4 h-4 text-[#00B900]" />
                          <span>{f.linked_user_name || 'เจ้าหน้าที่วิทยาลัย'}</span>
                        </div>
                      ) : (
                        <span className="text-onSurface-muted text-[11px]">— บุคคลทั่วไป</span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-onSurface">
                      {f.department_name || '—'}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-onSurface-muted">
                      {new Date(f.followed_at).toLocaleDateString('th-TH')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {f.blocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBE9E7] text-[#B3261E] border border-[#B3261E]/30">
                          บล็อกแล้ว
                        </span>
                      ) : f.linked_master_user_id ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                          ผูกบัญชีแล้ว
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-variant/60 text-onSurface-muted">
                          ผู้ติดตามปกติ
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
