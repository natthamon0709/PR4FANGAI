/**
 * Safe API Client for PR4Fang AI
 * Handles session expiry, non-JSON HTML error pages (e.g. Vercel 500/404),
 * and prevents "Unexpected token '<', '<!DOCTYPE...' is not valid JSON" errors.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  message?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);

    // 1. Handle Unauthenticated (401)
    if (res.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
      return {
        ok: false,
        status: 401,
        data: null,
        error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง'
      };
    }

    // 2. Handle Forbidden (403)
    if (res.status === 403) {
      return {
        ok: false,
        status: 403,
        data: null,
        error: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ หรือบัญชีถูกระงับ'
      };
    }

    // 3. Inspect Content-Type
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const json = await res.json();
        return {
          ok: res.ok,
          status: res.status,
          data: json,
          error: res.ok ? undefined : (json.error || json.message || `เกิดข้อผิดพลาด (${res.status})`),
          message: json.message
        };
      } catch (jsonErr) {
        return {
          ok: false,
          status: res.status,
          data: null,
          error: `เกิดข้อผิดพลาดในการประมวลผลข้อมูล (${res.status})`
        };
      }
    }

    // 4. Non-JSON response (e.g. HTML error page or plain text)
    let cleanMsg = `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (${res.status})`;
    if (res.status === 404) cleanMsg = 'ไม่พบข้อมูลที่ต้องการ (404 Not Found)';
    else if (res.status === 500) cleanMsg = 'เซิร์ฟเวอร์เกิดข้อผิดพลาดชั่วคราว (500 Internal Error)';
    else if (res.status === 503) cleanMsg = 'บริการไม่พร้อมใช้งานชั่วคราว (503 Service Unavailable)';

    return {
      ok: res.ok,
      status: res.status,
      data: null,
      error: cleanMsg
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: netErr?.message?.includes('Failed to fetch')
        ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบสัญญาณอินเทอร์เน็ต'
        : (netErr?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ')
    };
  }
}

/**
 * Helper to safely parse JSON from any Response object
 */
export async function parseResponseSafe<T = any>(res: Response): Promise<{ data: T | null; error?: string }> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { data, error: res.ok ? undefined : (data?.error || data?.message) };
    }
    return { data: null, error: `เกิดข้อผิดพลาด (${res.status})` };
  } catch (err: any) {
    return { data: null, error: 'ไม่สามารถอ่านข้อมูลผลลัพธ์ได้' };
  }
}
