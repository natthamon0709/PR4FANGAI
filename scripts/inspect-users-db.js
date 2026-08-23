const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

const allUsers = db.prepare('SELECT user_id, first_name, last_name, email, role, status FROM master_users').all();
console.log(`🔍 Current master_users table in pr4fang.db (Total: ${allUsers.length}):`);
allUsers.forEach((u, i) => console.log(`  ${i + 1}. [${u.user_id}] ${u.first_name} ${u.last_name} (${u.email}) - Role: ${u.role}`));
