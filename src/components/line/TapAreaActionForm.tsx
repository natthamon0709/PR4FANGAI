'use client';
import React from 'react';
import { MessageSquare, Globe, ArrowRightLeft, Edit3, Trash2 } from 'lucide-react';
import { LineTapArea, TapAreaActionType } from '@/types/line';

interface TapAreaActionFormProps {
  tapAreas: LineTapArea[];
  selectedAreaId: string | null;
  onSelectArea: (id: string) => void;
  onUpdateArea: (updated: LineTapArea) => void;
  onDeleteArea?: (id: string) => void;
  disabled?: boolean;
}

export default function TapAreaActionForm({
  tapAreas,
  selectedAreaId,
  onSelectArea,
  onUpdateArea,
  onDeleteArea,
  disabled = false
}: TapAreaActionFormProps) {
  const currentArea = tapAreas.find(a => a.id === selectedAreaId) || tapAreas[0];

  if (!currentArea) return null;

  return (
    <div className="space-y-4">
      {/* Tap Area Selector Tabs */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-onSurface">
          เลือกพื้นที่กดแตะ (Tap Area Selection):
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {tapAreas.map((area, idx) => (
            <button
              key={area.id || idx}
              type="button"
              onClick={() => onSelectArea(area.id)}
              className={`h-9 px-2 rounded-xl text-xs font-bold transition-all border ${
                selectedAreaId === area.id
                  ? 'bg-primary text-onPrimary border-primary shadow-sm'
                  : 'bg-surface-card hover:bg-surface-variant text-onSurface border-outline/30'
              }`}
            >
              #{idx + 1} {area.label ? area.label.slice(0, 5) : `ช่อง ${idx + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Action Configuration Box */}
      <div className="p-4 rounded-2xl bg-surface border border-outline/30 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline/15">
          <h4 className="font-heading font-bold text-xs text-onSurface flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-primary" />
            <span>ตั้งค่าการทำงานของ: {currentArea.label || `ช่อง ${tapAreas.indexOf(currentArea) + 1}`}</span>
          </h4>
        </div>

        {/* Label Field */}
        <div>
          <label className="block text-[11px] font-semibold text-onSurface mb-1">
            ชื่อปุ่ม / คำอธิบายกำกับ:
          </label>
          <input
            type="text"
            value={currentArea.label}
            onChange={(e) => onUpdateArea({ ...currentArea, label: e.target.value })}
            disabled={disabled}
            placeholder="เช่น ถามคำถาม AI, ขอแบบฟอร์ม"
            className="w-full h-9 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
          />
        </div>

        {/* Action Type Select */}
        <div>
          <label className="block text-[11px] font-semibold text-onSurface mb-1">
            ประเภท Action (Action Type):
          </label>
          <select
            value={currentArea.action.type}
            onChange={(e) =>
              onUpdateArea({
                ...currentArea,
                action: {
                  ...currentArea.action,
                  type: e.target.value as TapAreaActionType
                }
              })
            }
            disabled={disabled}
            className="w-full h-9 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary font-mono cursor-pointer"
          >
            <option value="message">💬 ส่งข้อความแชทอัตโนมัติ (Send Message)</option>
            <option value="uri">🌐 เปิดลิงก์เว็บไซต์ (Open URL)</option>
            <option value="postback">⚡ Postback Event (ส่งข้อมูลเบื้องหลัง)</option>
          </select>
        </div>

        {/* Action Value Input */}
        {currentArea.action.type === 'message' && (
          <div>
            <label className="block text-[11px] font-semibold text-onSurface mb-1">
              ข้อความที่จะถูกส่งในแชทเมื่อกด:
            </label>
            <input
              type="text"
              value={currentArea.action.text || ''}
              onChange={(e) =>
                onUpdateArea({
                  ...currentArea,
                  action: { ...currentArea.action, text: e.target.value }
                })
              }
              disabled={disabled}
              placeholder="เช่น สอบถามเรื่องระเบียบการลา, ขอเบอร์ติดต่อ"
              className="w-full h-9 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
            />
          </div>
        )}

        {currentArea.action.type === 'uri' && (
          <div>
            <label className="block text-[11px] font-semibold text-onSurface mb-1">
              URL เว็บไซต์ปลายทาง:
            </label>
            <input
              type="url"
              value={currentArea.action.uri || ''}
              onChange={(e) =>
                onUpdateArea({
                  ...currentArea,
                  action: { ...currentArea.action, uri: e.target.value }
                })
              }
              disabled={disabled}
              placeholder="https://fang.ac.th/..."
              className="w-full h-9 px-3 rounded-xl border border-outline bg-surface text-xs font-mono text-onSurface outline-none focus:border-primary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
