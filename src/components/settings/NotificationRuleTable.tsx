'use client';
import React, { useState } from 'react';
import { NotificationRule, NotificationChannel, NotificationRole } from '@/types/settings';
import { Bell, Smartphone, Mail, Layout, Power, Check, Loader2 } from 'lucide-react';

interface NotificationRuleTableProps {
  initialRules: NotificationRule[];
  onRefresh: () => void;
}

export default function NotificationRuleTable({ initialRules, onRefresh }: NotificationRuleTableProps) {
  const [rules, setRules] = useState<NotificationRule[]>(initialRules);
  const [savingId, setSavingId] = useState<string | null>(null);

  const eventLabels: Record<string, { title: string; desc: string }> = {
    pending_review: {
      title: 'องค์ความรู้รอตรวจสอบ (Pending Review)',
      desc: 'เมื่อมีเจ้าหน้าที่สร้างหรือแก้ไขบทความและส่งให้อนุมัติ'
    },
    knowledge_approved: {
      title: 'องค์ความรู้ได้รับการอนุมัติ (Knowledge Approved)',
      desc: 'เมื่อบทความได้รับการอนุมัติและเผยแพร่ลงคลังความรู้'
    },
    knowledge_sent_back: {
      title: 'องค์ความรู้ถูกส่งกลับแก้ไข (Sent Back for Edits)',
      desc: 'เมื่อผู้ดูแลระบบส่งข้อคิดเห็นให้เจ้าหน้าที่ปรับปรุงบทความ'
    },
    sync_error: {
      title: 'Google Sheets ซิงค์ผิดพลาด (Sync Error)',
      desc: 'เมื่อเกิดข้อผิดพลาดในการเชื่อมต่อหรืออ่านเขียนข้อมูลชีท'
    },
    sync_conflict: {
      title: 'เกิดข้อขัดแย้งข้อมูล 2 ทาง (Sync Conflict)',
      desc: 'เมื่อข้อมูลในระบบและ Google Sheet มีการแก้ไขพร้อมกัน'
    }
  };

  const handleToggleActive = async (rule: NotificationRule) => {
    setSavingId(rule.rule_id);
    try {
      await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: rule.rule_id,
          is_active: !rule.is_active
        })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleChannel = async (rule: NotificationRule, channel: NotificationChannel) => {
    setSavingId(rule.rule_id);
    const channels = rule.notify_channels.includes(channel)
      ? rule.notify_channels.filter(c => c !== channel)
      : [...rule.notify_channels, channel];

    if (channels.length === 0) {
      setSavingId(null);
      return; // At least one channel required
    }

    try {
      await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: rule.rule_id,
          notify_channels: channels
        })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-5 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
      <div className="flex items-center gap-3 border-b border-outline/20 pb-4">
        <div className="p-2.5 rounded-xl bg-primary-container/40 text-primary">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
            กฎการแจ้งเตือนระดับระบบ (System Notification Rules)
          </h2>
          <p className="text-xs text-onSurface-muted mt-0.5">
            กำหนดว่าเมื่อเกิดเหตุการณ์สำคัญในระบบ จะส่งการแจ้งเตือนถึงใครผ่านช่องทางใด
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-outline/20 text-onSurface-muted bg-surface/50">
              <th className="p-3 font-bold">ประเภทเหตุการณ์</th>
              <th className="p-3 font-bold">กลุ่มผู้รับแจ้งเตือน</th>
              <th className="p-3 font-bold">ช่องทางการแจ้งเตือน</th>
              <th className="p-3 font-bold text-right">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {initialRules.map((rule) => {
              const info = eventLabels[rule.event_type] || { title: rule.event_type, desc: '' };
              const isBusy = savingId === rule.rule_id;

              return (
                <tr key={rule.rule_id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="p-3.5 max-w-xs">
                    <p className="font-bold text-onSurface text-xs md:text-sm">{info.title}</p>
                    <p className="text-[11px] text-onSurface-muted mt-0.5">{info.desc}</p>
                  </td>

                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {rule.notify_roles.map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            role === 'administrator' ? 'bg-secondary/20 text-secondary-dark' : 'bg-primary-container text-primary'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* In-app */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(rule, 'in_app')}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all ${
                          rule.notify_channels.includes('in_app')
                            ? 'bg-primary-container/40 border-primary text-primary'
                            : 'bg-surface border-outline/30 text-onSurface-muted opacity-50'
                        }`}
                      >
                        <Layout className="w-3 h-3" />
                        <span>เว็บ (In-app)</span>
                      </button>

                      {/* LINE */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(rule, 'line')}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all ${
                          rule.notify_channels.includes('line')
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold'
                            : 'bg-surface border-outline/30 text-onSurface-muted opacity-50'
                        }`}
                      >
                        <Smartphone className="w-3 h-3 text-emerald-600" />
                        <span>LINE Push</span>
                      </button>

                      {/* Email */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(rule, 'email')}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all ${
                          rule.notify_channels.includes('email')
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'bg-surface border-outline/30 text-onSurface-muted opacity-50'
                        }`}
                      >
                        <Mail className="w-3 h-3 text-blue-600" />
                        <span>อีเมล</span>
                      </button>
                    </div>
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleActive(rule)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 ${
                        rule.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                      <span>{rule.is_active ? 'เปิดใช้งาน' : 'ปิด'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
