/**
 * Standard Thai Date Formatter (Pure Client & Server Safe Utility)
 */
export function formatThaiDate(dateStr: string, format: "short" | "medium" | "full" = "medium"): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const thaiMonthsShort = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const thaiMonthsFull = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const day = d.getDate();
    const monthIdx = d.getMonth();
    const yearBE = d.getFullYear() + 543;

    if (format === "short") return `${day} ${thaiMonthsShort[monthIdx]}`;
    if (format === "full") return `${day} ${thaiMonthsFull[monthIdx]} พ.ศ. ${yearBE}`;
    return `${day} ${thaiMonthsShort[monthIdx]} ${yearBE}`;
  } catch {
    return dateStr;
  }
}
