# PR4Fang AI — Phase 1: Authentication & User Management
### ระบบจัดการองค์ความรู้ วิทยาลัยการอาชีพฝาง (Fang Industrial and Community Education College)

ระบบจัดการองค์ความรู้และการบริหารจัดการผู้ใช้งาน Phase 1 พัฒนาด้วย **Next.js 14, React 18, Tailwind CSS (Material Design 3), TypeScript และ SQLite (better-sqlite3)** พร้อมระบบเชื่อมต่อ **Google Sheets** และ **n8n AI Workflow** สำหรับการต่อยอดใน Phase 5-6

---

## 📌 คุณสมบัติเด่น (Key Features)

### 1. ระบบยืนยันตัวตนและความปลอดภัย (Authentication & Security)
- **Login / Logout**: เข้าระบบด้วยอีเมลและรหัสผ่าน พร้อมจำกัดความพยายามผิดพลาด 5 ครั้งก่อนล็อก 15 นาที
- **Bcrypt Hash**: เข้ารหัสผ่านด้วย bcrypt ที่มี work factor cost ≥ 12
- **Session Expiry**: Session หมดอายุอัตโนมัติเมื่อไม่มีการใช้งาน 2 ชั่วโมง
- **Forgot & Reset Password**: ระบบส่งโทเค็นรีเซ็ตรหัสผ่านอายุ 30 นาที และข้อความกลางป้องกัน Email Enumeration Attack
- **Audit Logs**: บันทึก Log การพยายามเข้าสู่ระบบทุกครั้ง (IP, วัน-เวลา, ผลการตรวจสอบ)

### 2. ระบบจัดการผู้ใช้งาน (User Management — Admin Only)
- **Role-based Access Control (RBAC)**: รองรับสิทธิ์ `Administrator` และ `Staff`
- **Organizational Structure**: โครงสร้าง 4 ฝ่ายหลัก 23 งาน ของวิทยาลัยการอาชีพฝาง พร้อม Dropdown 2 ระดับแบบ Dependent
- **User CRUD**: เพิ่ม/แก้ไข/ระงับบัญชี/ลบ/รีเซ็ตรหัสผ่าน พร้อมระบบสุ่มรหัสผ่านชั่วคราว
- **Responsive UI**: รองรับ Desktop (260px Fixed Sidebar), Tablet (72px Icon Sidebar), Mobile (Responsive Drawer & Card List)

### 3. การเชื่อมต่อ Google Sheets & n8n AI
- **Google Sheets**: ซิงค์ข้อมูล Master Users ไปยัง Google Sheet (`1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs` / GID: `547794364`)
- **n8n AI Workflow**: รองรับ REST API สำหรับตรวจสอบสิทธิ์ผู้ใช้จาก `line_user_id` และดึงขอบเขตฝ่ายเพื่อทำ RAG Scope ใน Phase 5
- **Template Workflow**: มีไฟล์ `n8n-workflow-pr4fang-ai.json` สำหรับ Import เข้า n8n ได้ทันที

---

## 🚀 บัญชีผู้ใช้งานเริ่มต้น (Seed Accounts)

| ชื่อ-นามสกุล | อีเมล | รหัสผ่าน | สิทธิ์ (Role) | ฝ่าย / งาน | สถานะ |
|---|---|---|---|---|---|
| ผู้ดูแลระบบ ศูนย์ดิจิทัลฯ | `admin@fang.ac.th` | `Admin@12345` | **Administrator** | ฝ่ายแผนงานฯ / ศูนย์ข้อมูลสารสนเทศและดิจิทัล | 🟢 เปิดใช้งาน |
| อรวรรณ พงษ์สวัสดิ์ | `orawan@fang.ac.th` | `Admin@12345` | **Administrator** | ฝ่ายแผนงานฯ / ศูนย์ข้อมูลสารสนเทศและดิจิทัล | 🟢 เปิดใช้งาน |
| สมชาย ใจดี | `somchai@fang.ac.th` | `Fang@2026` | **Staff** | ฝ่ายบริหารทรัพยากร / บริหารและพัฒนาบุคคล | 🟢 เปิดใช้งาน |
| วิชัย คำแสน | `wichai@fang.ac.th` | `Fang@2026` | **Staff** | ฝ่ายวิชาการ / งานทะเบียน | 🔴 **ระงับการใช้งาน** |
| สิริพร แก้วมณี | `siriporn@fang.ac.th` | `Fang@2026` | **Staff** | ฝ่ายพัฒนากิจการนักเรียนนักศึกษา / งานแนะแนว | 🟢 เปิดใช้งาน |

---

## 🛠️ วิธีการติดตั้งและรันระบบ

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. สร้างและ Seed ฐานข้อมูล SQLite
```bash
npm run seed
```

### 3. รัน Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ที่: `http://localhost:3000`

### 4. รันคำสั่งทดสอบระบบ (Test Suite)
```bash
npm run test:api
```

---

## 📡 REST API Reference สำหรับ n8n AI & Sheets

### 1. ตรวจสอบ LINE User ID สำหรับ AI Agent
```http
POST /api/v1/n8n/verify-line-user
Headers:
  X-API-Key: fang_ai_n8n_live_sec_key_2026
  Content-Type: application/json

Body:
{
  "line_user_id": "U1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6"
}
```

### 2. ส่งออกข้อมูลไปยัง Google Sheets (One-way Sync)
```http
POST /api/integrations/google-sheets/sync
Headers:
  X-API-Key: fang_ai_n8n_live_sec_key_2026
```

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```
PR4Fang_AI/
├── data/
│   └── pr4fang.db                     # SQLite Database File
├── scripts/
│   ├── seed.js                        # Database Seeding Script (4 ฝ่าย 23 งาน)
│   └── test-api.js                    # Automated Test Runner (15 tests)
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── api/                       # Backend REST API Endpoints
│   │   │   ├── auth/                  # login, logout, me, forgot, reset, change-pass
│   │   │   ├── users/                 # list, create, edit, delete, reset-pass
│   │   │   ├── departments/           # 2-level departments list
│   │   │   ├── audit-logs/            # login audit logs
│   │   │   ├── integrations/          # Google Sheets sync & export
│   │   │   └── v1/n8n/                # n8n AI LINE verification & user scoping
│   │   ├── login/                     # หน้า Login (C02, Wireframe 4.1)
│   │   ├── forgot-password/           # หน้า Forgot Password
│   │   ├── reset-password/            # หน้า Reset Password
│   │   ├── profile/                   # หน้า My Profile & Change Password
│   │   ├── users/                     # หน้ารายชื่อผู้ใช้, เพิ่ม, แก้ไข, ดูรายละเอียด
│   │   ├── audit-logs/                # หน้าดูบันทึก Audit Logs
│   │   ├── integrations/              # หน้าเชื่อมต่อ Google Sheets & n8n AI
│   │   └── dashboard/                 # หน้าแดชบอร์ดภาพรวม (Phase 2 Preview)
│   ├── components/                    # C01 - C20 Components (Material 3 Theme)
│   ├── lib/                           # db.ts, auth.ts, integrations.ts
│   └── types/                         # TypeScript Type Definitions
├── n8n-workflow-pr4fang-ai.json       # Template n8n Workflow พร้อม Import
├── tailwind.config.js                 # Material 3 Tonal Palette (#145C4B, #8B6F2E)
└── README.md
```
