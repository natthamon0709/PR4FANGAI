const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS drive_media_cache (
    media_id TEXT PRIMARY KEY,
    folder_id TEXT,
    file_id TEXT NOT NULL,
    title_or_person_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_type TEXT DEFAULT 'image/jpeg',
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

const personnelList = [
  // คณะผู้บริหาร
  { name: 'นายปัญญา ช่างงาน', dept: 'ผู้อำนวยการวิทยาลัยการอาชีพฝาง', folderId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li', fileId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li_01' },
  { name: 'นายวรพงศ์ วงค์อ้าย', dept: 'รองผู้อำนวยการฝ่ายบริหารทรัพยากร', folderId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li', fileId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li_02' },
  { name: 'นายชาลัน คุณหลวง', dept: 'รองผู้อำนวยการฝ่ายพัฒนากิจการนักเรียนนักศึกษา', folderId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li', fileId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li_03' },
  { name: 'นางสาวชวาลินี สิงห์คำ', dept: 'รองผู้อำนวยการฝ่ายแผนงานและความร่วมมือ', folderId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li', fileId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li_04' },
  { name: 'นางวิลาวัลย์ วัชโรทัย', dept: 'รองผู้อำนวยการฝ่ายวิชาการ', folderId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li', fileId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li_05' },
  { name: 'นางสายนที ดำดิบ', dept: 'ผู้ช่วยผู้อำนวยการ', folderId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li', fileId: '1XWK4Tw4oHwUXvt_LEuMFM-qXvHdCT6Li_06' },

  // เทคโนโลยีธุรกิจดิจิทัล
  { name: 'นายปัฐวิกรณ์ บุญต่าย', dept: 'หัวหน้าสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_01' },
  { name: 'นางสาวอัมรัตน์ ซ่อนกลิ่น', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_02' },
  { name: 'ว่าที่ร้อยตรี อภิสิทธิ์ ธิดา', dept: 'ครูประจำสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_03' },
  { name: 'ว่าที่ร้อยตรีภิสิทธิ์ ธิดา', dept: 'ครูประจำสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_03' },
  { name: 'นายนฤเบศ สอนง่าย', dept: 'ครูประจำสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_04' },
  { name: 'นายเกียรติพงษ์ เพชรสำลี', dept: 'ครูประจำสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_05' },
  { name: 'นางสาวพัชรา ตาวงค์', dept: 'ครูประจำสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_06' },
  { name: 'นายภัคพล บำรุงเกียรติ', dept: 'ครูประจำสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_07' },
  { name: 'นายกิตติพงษ์ เหล่ารุ่งเรืองกุล', dept: 'ครูประจำสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', folderId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU', fileId: '1r-HMY7WxwXLgEhn89PJI9LjbI_zOROmU_08' },

  // การตลาด
  { name: 'นางสาวสุรัสวดี เรือนน้อย', dept: 'หัวหน้าสาขาวิชาการตลาด', folderId: '1C4NPWj3TVPkpv5HABeP1Z_-WvtF_Qtjp', fileId: '1C4NPWj3TVPkpv5HABeP1Z_-WvtF_Qtjp_01' },
  { name: 'นางสาวมุกดา มณีวรรณ์', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาการตลาด', folderId: '1C4NPWj3TVPkpv5HABeP1Z_-WvtF_Qtjp', fileId: '1C4NPWj3TVPkpv5HABeP1Z_-WvtF_Qtjp_02' },

  // การโรงแรม
  { name: 'นางสาวดารุณี วรรณเรศ', dept: 'หัวหน้าสาขาวิชาการโรงแรม', folderId: '1u4TBYVXCBTjDwbFOVmWeFvOwAFt7kyIU', fileId: '1u4TBYVXCBTjDwbFOVmWeFvOwAFt7kyIU_01' },
  { name: 'นายเนติพงศ์ สีปาน', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาการโรงแรม', folderId: '1u4TBYVXCBTjDwbFOVmWeFvOwAFt7kyIU', fileId: '1u4TBYVXCBTjDwbFOVmWeFvOwAFt7kyIU_02' },

  // เครือข่ายคอมพิวเตอร์และความปลอดภัย
  { name: 'นายศุทธิชัย อายุมั่น', dept: 'หัวหน้าสาขาวิชาเครือข่ายคอมพิวเตอร์และความปลอดภัย', folderId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj', fileId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj_01' },
  { name: 'นายศุทิชัย อายุมั่น', dept: 'หัวหน้าสาขาวิชาเครือข่ายคอมพิวเตอร์และความปลอดภัย', folderId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj', fileId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj_01' },
  { name: 'นายธนุรเวท อายุมั่น', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาเครือข่ายคอมพิวเตอร์และความปลอดภัย', folderId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj', fileId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj_02' },
  { name: 'นายพรรณพัชณรงค์ รัมภารัตน์', dept: 'ครูประจำสาขาวิชาเครือข่ายคอมพิวเตอร์และความปลอดภัย', folderId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj', fileId: '1Y3r8m7D7LZKf7IMG2lPYicPl5tQ4aNLj_03' },

  // ช่างก่อสร้าง
  { name: 'ว่าที่ร้อยตรีหญิงนฤมล วงศ์ร้อย', dept: 'หัวหน้าสาขาวิชาช่างก่อสร้าง', folderId: '1mUWo1aN0rnj0noSJVHOhf0Et0lUHlaEt', fileId: '1mUWo1aN0rnj0noSJVHOhf0Et0lUHlaEt_01' },

  // ช่างเชื่อมโลหะ
  { name: 'นายดม ปิจจวงค์', dept: 'หัวหน้าสาขาวิชาช่างเชื่อมโลหะ', folderId: '1O7AMmbcghhGQsltjfOTrZU-hOdZ1GlSt', fileId: '1O7AMmbcghhGQsltjfOTrZU-hOdZ1GlSt_01' },
  { name: 'นายจักรภพ ไชยประดิษฐ', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาช่างเชื่อมโลหะ', folderId: '1O7AMmbcghhGQsltjfOTrZU-hOdZ1GlSt', fileId: '1O7AMmbcghhGQsltjfOTrZU-hOdZ1GlSt_02' },

  // ช่างซ่อมบำรุง
  { name: 'นายณัฐพล แก้วคำมูล', dept: 'หัวหน้าสาขาวิชาช่างซ่อมบำรุง', folderId: '1Ri7l_ANNq8gvQIQX5Cg7fLAVlGsOKzAL', fileId: '1Ri7l_ANNq8gvQIQX5Cg7fLAVlGsOKzAL_01' },

  // ช่างเทคนิคคอมพิวเตอร์
  { name: 'นายศุทธิชัย อายุมั่น', dept: 'หัวหน้าสาขาวิชาช่างเทคนิคคอมพิวเตอร์', folderId: '1D7Ve7AuRYYKgzmv7KplIxe2O_C18BrPt', fileId: '1D7Ve7AuRYYKgzmv7KplIxe2O_C18BrPt_01' },

  // ช่างไฟฟ้ากำลัง
  { name: 'นายอดิศร ฐิติธรรมรัตน์', dept: 'หัวหน้าสาขาวิชาช่างไฟฟ้ากำลัง', folderId: '1x59EXDB5ee66fyhTghEwSJOx3jkc3cB-', fileId: '1x59EXDB5ee66fyhTghEwSJOx3jkc3cB-_01' },
  { name: 'นายเอกพันธ์ หม่อมมวล', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาช่างไฟฟ้ากำลัง', folderId: '1x59EXDB5ee66fyhTghEwSJOx3jkc3cB-', fileId: '1x59EXDB5ee66fyhTghEwSJOx3jkc3cB-_02' },

  // เทคนิคเครื่องกล / ช่างยนต์
  { name: 'นายพิเชษฐ์ แสงดาว', dept: 'หัวหน้าสาขาวิชาเทคนิคเครื่องกล', folderId: '12WlWo4Xw0YK4h1EInHpUpIPMDn_xdD1F', fileId: '12WlWo4Xw0YK4h1EInHpUpIPMDn_xdD1F_01' },
  { name: 'นายอนุสรณ์ ไสยรัตน์', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาเทคนิคเครื่องกล', folderId: '12WlWo4Xw0YK4h1EInHpUpIPMDn_xdD1F', fileId: '12WlWo4Xw0YK4h1EInHpUpIPMDn_xdD1F_02' },
  { name: 'นายรุ่ง ชมภูมิ่ง', dept: 'ครูประจำสาขาวิชาเทคนิคเครื่องกล', folderId: '12WlWo4Xw0YK4h1EInHpUpIPMDn_xdD1F', fileId: '12WlWo4Xw0YK4h1EInHpUpIPMDn_xdD1F_03' },

  // ตัวถังและสีรถยนต์
  { name: 'นายรุ่ง ชมภูมิ่ง', dept: 'หัวหน้าสาขาวิชาเทคโนโลยีอุตสาหกรรมตัวถังและสีรถยนต์', folderId: '1oLZnvj7u3gZSRPS5UyzZW8lWiyJPO5Oy', fileId: '1oLZnvj7u3gZSRPS5UyzZW8lWiyJPO5Oy_01' },

  // การบัญชี
  { name: 'นางสาวศศิชา ปิ่นใจ', dept: 'หัวหน้าสาขาวิชาการบัญชี', folderId: '1O7-dRnbJ0-70tLuJg_lSjlyInthq2nM-', fileId: '1O7-dRnbJ0-70tLuJg_lSjlyInthq2nM-_01' },

  // ปิโตรเลียม
  { name: 'นายปัณณทัต คำหอม', dept: 'หัวหน้าสาขาวิชาเทคโนโลยีเครื่องมือวัดและควบคุมปิโตรเลียม', folderId: '1lm4vF9qqoBfi9mlnOvB9D_o75qM__tAp', fileId: '1lm4vF9qqoBfi9mlnOvB9D_o75qM__tAp_01' },
  { name: 'นายสราวุธ ปันทะนะ', dept: 'ผู้ช่วยหัวหน้าสาขาวิชาปิโตรเลียม', folderId: '1lm4vF9qqoBfi9mlnOvB9D_o75qM__tAp', fileId: '1lm4vF9qqoBfi9mlnOvB9D_o75qM__tAp_02' },

  // สามัญสัมพันธ์
  { name: 'นางสาวอัจฉรา ทองปัน', dept: 'หัวหน้าสาขาวิชาสามัญสัมพันธ์', folderId: '1HkHJcJ2xLRroXX49saGAGyrrCMJWKKln', fileId: '1HkHJcJ2xLRroXX49saGAGyrrCMJWKKln_01' }
];

const insertMedia = db.prepare(`
  INSERT INTO drive_media_cache (media_id, folder_id, file_id, title_or_person_name, image_url, thumbnail_url, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
  ON CONFLICT(media_id) DO UPDATE SET
    title_or_person_name = excluded.title_or_person_name,
    image_url = excluded.image_url,
    thumbnail_url = excluded.thumbnail_url,
    updated_at = excluded.updated_at
`);

for (const p of personnelList) {
  const url = `https://lh3.googleusercontent.com/d/${p.fileId}`;
  insertMedia.run(`med-${p.fileId}`, p.folderId, p.fileId, `${p.name} (${p.dept})`, url, url);
}

console.log('Total seeded media in database:', db.prepare('SELECT COUNT(*) as c FROM drive_media_cache').get().c);
