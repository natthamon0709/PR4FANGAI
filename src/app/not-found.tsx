import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4 text-center">
      <h2 className="text-3xl font-heading font-bold text-onSurface mb-2">404 - ไม่พบหน้าที่ต้องการ</h2>
      <p className="text-sm text-onSurface-muted mb-6">หน้าที่คุณกำลังค้นหาไม่มีอยู่ในระบบ หรืออาจถูกย้ายไปแล้ว</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-primary text-onPrimary text-sm font-semibold rounded-xl hover:bg-primary-hover transition-all"
      >
        กลับหน้าแดชบอร์ด
      </Link>
    </div>
  );
}
