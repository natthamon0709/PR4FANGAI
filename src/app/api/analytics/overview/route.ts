import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { resolveDateRange, getAnalyticsOverview } from "@/lib/analytics-service";
import { DateRangePreset } from "@/types/analytics";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const preset = (searchParams.get("preset") as DateRangePreset) || "30d";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const deptId = searchParams.get("department_id") || session.department_id || undefined;
    const isAdmin = session.role === "administrator";

    const filter = resolveDateRange(preset, startDate, endDate);
    const data = getAnalyticsOverview(filter, isAdmin ? searchParams.get("department_id") || undefined : session.department_id, isAdmin);

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Overview API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
