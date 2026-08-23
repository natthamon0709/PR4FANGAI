const Database = require('better-sqlite3');
const db = new Database('./data/pr4fang.db');

const THAI_SYNONYMS = {
  'ก่อตั้ง': ['ประวัติ', 'ข้อมูลทั่วไป', 'จัดตั้ง', 'วันสถาปนา', 'ความเป็นมา'],
  'ประวัติ': ['ก่อตั้ง', 'ความเป็นมา', 'ข้อมูลทั่วไป'],
};

const items = db.prepare('SELECT knowledge_id, title FROM knowledge_items WHERE title LIKE "%ประวัติ%" OR content LIKE "%ก่อตั้ง%"').all();
console.log('Items matching ก่อตั้ง / ประวัติ:', items);
