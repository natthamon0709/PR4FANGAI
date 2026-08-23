/**
 * ==============================================================================
 * PR4Fang AI — Google Sheets Database Complete Architecture Initializer
 * วิทยาลัยการอาชีพฝาง (Fang Industrial and Community Education College)
 * Spreadsheet ID: 1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs
 * ==============================================================================
 * 
 * สถาปัตยกรรมฐานข้อมูล Google Sheet ครบ 8 ตาราง (ไม่มีการ Mock ข้อมูล):
 * 1. Master_Department  — โครงสร้างฝ่ายงานหลัก (RES, PLN, STD, ACD)
 * 2. Master_Section     — โครงสร้างงานและแผนกย่อย (23 งาน)
 * 3. Master_Users       — บัญชีผู้ใช้งานระบบและบุคลากร (Admin / Staff)
 * 4. Knowledge_Base     — ศูนย์รวมองค์ความรู้เอกภาพ (ข่าว, ประกาศ, คู่มือ, ระเบียบ, FAQ)
 * 5. Knowledge_Gaps     — รายการคำถามตกหล่นที่ AI ไม่พบคำตอบ (เพื่อให้เจ้าหน้าที่นำไปเพิ่มความรู้)
 * 6. AI_Query_Logs      — บันทึกประวัติการสนทนาและถามตอบของ AI
 * 7. LINE_Followers     — รายชื่อผู้ติดตาม LINE OA และสถานะการผูกบัญชีบุคลากร
 * 8. LINE_Broadcasts    — ประวัติการส่งข้อความประชาสัมพันธ์ Broadcast
 * ==============================================================================
 */

// Webhook สำหรับซิงค์ข้อมูลแบบ Real-time เข้าสู่ระบบ PR4Fang AI
const PR4FANG_WEBHOOK_URL = "http://localhost:3000/api/integrations/google-sheets/sync";
const PR4FANG_API_KEY = "fang_ai_n8n_live_sec_key_2026";

/**
 * สร้างเมนูด้านบนของ Google Sheet เมื่อเปิดไฟล์
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("⚙️ PR4Fang AI")
      .addItem("🚀 ตรวจสอบและสร้างชีทที่ยังขาด (ครบ 8 แท็บ)", "initAllDatabaseTabs")
      .addItem("🔄 ซิงค์ข้อมูลทั้งหมดเข้าสู่ PR4Fang AI", "syncAllDataToApp")
      .addToUi();
  } catch (e) {
    Logger.log("Running without UI context");
  }
}

/**
 * ฟังก์ชันหลัก: ตรวจสอบและสร้างเฉพาะชีทที่ยังไม่มี (รักษาข้อมูลเดิมไว้ 100%)
 */
function initAllDatabaseTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("⏳ กำลังตรวจสอบโครงสร้างฐานข้อมูล PR4Fang AI...");
  
  setupDepartmentsTab(ss);
  setupSubDepartmentsTab(ss);
  setupMasterUsersTab(ss);
  setupKnowledgeBaseTab(ss);
  setupKnowledgeGapsTab(ss);
  setupAiQueryLogsTab(ss);
  setupLineFollowersTab(ss);
  setupLineBroadcastsTab(ss);
  setupLineConfigsTab(ss);
  
  Logger.log("🎉 ฐานข้อมูล Google Sheet ครบถ้วนทั้ง 9 แท็บเรียบร้อยแล้ว!");
  
  try {
    SpreadsheetApp.getUi().alert("🎉 สำเร็จ! ตรวจสอบและสร้างชีทโครงสร้างฐานข้อมูลครบทั้ง 9 แท็บเรียบร้อยแล้ว (ข้อมูลเดิมในชีทได้รับการรักษาไว้ครบถ้วน 100%)");
  } catch (e) {
    Logger.log("Alert skipped (executed from editor)");
  }
}

/**
 * 1. Master_Department (ฝ่ายงานหลัก)
 */
function setupDepartmentsTab(ss) {
  let sheet = ss.getSheetByName("Master_Department") || ss.getSheetByName("Departments");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บฝ่ายงาน (" + sheet.getName() + ") อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("Master_Department");
  const headers = ["รหัสฝ่าย (Department ID)", "โค้ด (Code)", "ชื่อฝ่าย"];
  const depts = [
    ["dept-01-resource", "RES", "ฝ่ายบริหารทรัพยากร"],
    ["dept-02-planning", "PLN", "ฝ่ายแผนงานและความร่วมมือ"],
    ["dept-03-student", "STD", "ฝ่ายพัฒนากิจการนักเรียนนักศึกษา"],
    ["dept-04-academic", "ACD", "ฝ่ายวิชาการ"]
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#145C4B");
  sheet.getRange(2, 1, depts.length, headers.length).setValues(depts);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 2. Master_Section (งาน/แผนกย่อย)
 */
function setupSubDepartmentsTab(ss) {
  let sheet = ss.getSheetByName("Master_Section") || ss.getSheetByName("Sub_Departments");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บงานย่อย (" + sheet.getName() + ") อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("Master_Section");
  const headers = ["รหัสงานย่อย (Sub Dept ID)", "รหัสฝ่าย (Department ID)", "โค้ด (Code)", "ชื่องาน/แผนก"];
  const subs = [
    ["sub-01-01", "dept-01-resource", "RES-GEN", "งานบริหารงานทั่วไป"],
    ["sub-01-02", "dept-01-resource", "RES-HR", "งานบริหารและพัฒนาทรัพยากรบุคคล"],
    ["sub-01-03", "dept-01-resource", "RES-FIN", "งานการเงิน"],
    ["sub-01-04", "dept-01-resource", "RES-ACC", "งานการบัญชี"],
    ["sub-01-05", "dept-01-resource", "RES-SUP", "งานพัสดุ"],
    ["sub-01-06", "dept-01-resource", "RES-BLD", "งานอาคารสถานที่"],
    ["sub-01-07", "dept-01-resource", "RES-VEH", "งานยานพาหนะ"],
    ["sub-01-08", "dept-01-resource", "RES-PR", "งานประชาสัมพันธ์"],
    ["sub-02-01", "dept-02-planning", "PLN-BGT", "งานวางแผนและงบประมาณ"],
    ["sub-02-02", "dept-02-planning", "PLN-DIG", "งานศูนย์ข้อมูลสารสนเทศและดิจิทัล"],
    ["sub-02-03", "dept-02-planning", "PLN-COP", "งานความร่วมมือ"],
    ["sub-02-04", "dept-02-planning", "PLN-RND", "งานวิจัย พัฒนา นวัตกรรมและสิ่งประดิษฐ์"],
    ["sub-02-05", "dept-02-planning", "PLN-QA", "งานประกันคุณภาพและมาตรฐานการศึกษา"],
    ["sub-03-01", "dept-03-student", "STD-ACT", "งานกิจกรรมนักเรียนนักศึกษา"],
    ["sub-03-02", "dept-03-student", "STD-ADV", "งานครูที่ปรึกษา"],
    ["sub-03-03", "dept-03-student", "STD-DIS", "งานปกครองและสวัสดิการนักเรียนนักศึกษา"],
    ["sub-03-04", "dept-03-student", "STD-GUD", "งานแนะแนวอาชีพและการมีงานทำ"],
    ["sub-03-05", "dept-03-student", "STD-SPJ", "งานโครงการพิเศษและการบริการชุมชน"],
    ["sub-04-01", "dept-04-academic", "ACD-CUR", "งานพัฒนาหลักสูตรการเรียนการสอน"],
    ["sub-04-02", "dept-04-academic", "ACD-EVA", "งานวัดผลและประเมินผล"],
    ["sub-04-03", "dept-04-academic", "ACD-LIB", "งานวิทยบริการและห้องสมุด"],
    ["sub-04-04", "dept-04-academic", "ACD-DVE", "งานอาชีวศึกษาระบบทวิภาคี"],
    ["sub-04-05", "dept-04-academic", "ACD-REG", "งานทะเบียน"]
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#3F5FA0");
  sheet.getRange(2, 1, subs.length, headers.length).setValues(subs);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 3. Master_Users (บัญชีผู้ใช้งาน)
 */
function setupMasterUsersTab(ss) {
  let sheet = ss.getSheetByName("Master_Users") || ss.getSheetByName("Users");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บ Master_Users อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("Master_Users");
  const headers = [
    "User ID", "ชื่อ", "นามสกุล", "อีเมล", "เบอร์โทรศัพท์", 
    "รหัสผ่าน (Hashed)", "บทบาท (Role)", "รหัสฝ่าย (Department ID)", 
    "รหัสงานย่อย (Sub Dept ID)", "LINE User ID", "สถานะ (Status)"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#8A3B14");
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 4. Knowledge_Base (ศูนย์รวมองค์ความรู้เอกภาพ)
 */
function setupKnowledgeBaseTab(ss) {
  let sheet = ss.getSheetByName("Knowledge_Base") || ss.getSheetByName("Articles") || ss.getSheetByName("547794364");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บ Knowledge_Base อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("Knowledge_Base");
  const headers = [
    "รหัสองค์ความรู้ (Knowledge ID)", "ประเภทเนื้อหา (Content Type)", "หัวข้อ (Title)", 
    "สรุปย่อ (Summary)", "เนื้อหาฉบับเต็ม (Content)", "รหัสฝ่าย (Department ID)", 
    "รหัสงานย่อย (Sub Dept ID)", "แท็ก (Tags)", "สถานะ (Status)", 
    "จำนวนการเข้าชม (View Count)", "เปิดให้ AI ค้นคืน (AI Retrieval Enabled)", "วันที่อัปเดตล่าสุด (Updated At)"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#006874");
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 5. Knowledge_Gaps (รายการคำถามตกหล่นที่ AI ตอบไม่ได้)
 */
function setupKnowledgeGapsTab(ss) {
  let sheet = ss.getSheetByName("Knowledge_Gaps");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บ Knowledge_Gaps อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("Knowledge_Gaps");
  const headers = [
    "รหัสคำถามตกหล่น (Gap ID)", "คำถามที่ไม่พบข้อมูล (Question Text)", 
    "จำนวนครั้งที่ถาม (Ask Count)", "ฝ่ายงานที่คาดว่าเกี่ยวข้อง (Department Guess)", 
    "สถานะ (Status)", "ผู้รับผิดชอบแก้ไข (Resolved By)", 
    "ถามล่าสุดเมื่อ (Last Asked At)", "สร้างเมื่อ (Created At)"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#9C4146");
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 6. AI_Query_Logs (ประวัติการถาม-ตอบ AI)
 */
function setupAiQueryLogsTab(ss) {
  let sheet = ss.getSheetByName("AI_Query_Logs");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บ AI_Query_Logs อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("AI_Query_Logs");
  const headers = [
    "Log ID", "LINE User ID", "คำถาม (Question)", 
    "ความมั่นใจ (Confidence Score)", "คำตอบ AI (Answer)", 
    "เป็นข้อความตอบกลับสำรอง (Is Fallback)", "คะแนนประเมิน (Feedback)", 
    "เวลาประมวลผล (ms)", "วันที่เวลา (Created At)"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#4E5F7D");
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 7. LINE_Followers (ผู้ติดตาม LINE OA และเจ้าหน้าที่)
 */
function setupLineFollowersTab(ss) {
  let sheet = ss.getSheetByName("LINE_Followers");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บ LINE_Followers อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("LINE_Followers");
  const headers = [
    "Follower ID", "LINE User ID", "ชื่อโปรไฟล์ (Display Name)", 
    "รูปโปรไฟล์ (Avatar URL)", "ผูกกับผู้ใช้งาน (Linked User ID)", 
    "ติดตามเมื่อ (Followed At)", "บล็อก (Blocked)", "ใช้งานล่าสุดเมื่อ (Last Interaction At)"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#00B900");
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 8. LINE_Broadcasts (ประวัติการส่ง Broadcast)
 */
function setupLineBroadcastsTab(ss) {
  let sheet = ss.getSheetByName("LINE_Broadcasts");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บ LINE_Broadcasts อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("LINE_Broadcasts");
  const headers = [
    "Broadcast ID", "หัวข้อ (Title)", "ข้อความ (Message Text)", 
    "อ้างอิงองค์ความรู้ (Source Knowledge ID)", "กลุ่มเป้าหมาย (Target Type)", 
    "ฝ่ายงานเป้าหมาย (Department ID)", "สถานะ (Status)", 
    "จำนวนผู้รับ (Delivered Count)", "ผู้ส่ง (Created By)", 
    "เวลาส่ง (Sent At)", "สร้างเมื่อ (Created At)"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#7B5804");
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 9. LINE_Configs (การตั้งค่า LINE Official Account)
 */
function setupLineConfigsTab(ss) {
  let sheet = ss.getSheetByName("LINE_Configs") || ss.getSheetByName("System_Configs");
  if (sheet) {
    Logger.log("ℹ️ พบแท็บ LINE_Configs อยู่แล้ว");
    return;
  }
  sheet = ss.insertSheet("LINE_Configs");
  const headers = [
    "Config ID", "Channel ID", "Channel Secret (Encrypted)", 
    "Channel Access Token (Encrypted)", "Webhook URL", "Webhook Verified (0/1)", 
    "Bot Display Name", "Bot Basic ID", "Updated At"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow(sheet, headers.length, "#00838F");
  
  // Seed current config row if new
  const initialRow = [
    "line-cfg-001", "2006206866", "enc_sec_fang_line_oa_sec_live_2026",
    "enc_tok_fang_line_oa_access_token_live_2026", "http://localhost:3000/api/line-oa/webhook",
    "1", "botnut", "@748eucut", new Date().toISOString()
  ];
  sheet.getRange(2, 1, 1, headers.length).setValues([initialRow]);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * ฟังก์ชันช่วยจัดรูปแบบ Header Row
 */
function formatHeaderRow(sheet, colCount, hexColor) {
  const headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground(hexColor)
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontFamily("Sarabun")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
}

/**
 * ส่งคำสั่ง Webhook ซิงค์ข้อมูลทั้งหมดเข้าสู่ PR4Fang AI
 */
function syncAllDataToApp() {
  try {
    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PR4FANG_API_KEY
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(PR4FANG_WEBHOOK_URL, options);
    const result = JSON.parse(response.getContentText());
    SpreadsheetApp.getUi().alert("✅ ซิงค์ข้อมูลสำเร็จ!\n" + (result.message || "ซิงค์ข้อมูลกับฐานข้อมูล PR4Fang AI เรียบร้อย"));
  } catch (err) {
    SpreadsheetApp.getUi().alert("⚠️ ไม่สามารถซิงค์ได้: " + err.message);
  }
}

/**
 * ==============================================================================
 * Web App Endpoint (doPost): รองรับการรับข้อมูลอัปเดตจาก PR4Fang AI บันทึกลง Sheet
 * ==============================================================================
 */
function doPost(e) {
  try {
    const rawData = e.postData ? e.postData.contents : "{}";
    const data = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = data.sheetName || "LINE_Configs";
    const record = data.recordData || {};
    const action = data.action || "update";

    if (sheetName === "LINE_Configs") {
      let sheet = ss.getSheetByName("LINE_Configs");
      if (!sheet) {
        setupLineConfigsTab(ss);
        sheet = ss.getSheetByName("LINE_Configs");
      }

      const configId = record.config_id || "line-cfg-001";
      const channelId = record.channel_id || "";
      const channelSec = record.channel_secret_encrypted || "";
      const channelTok = record.channel_access_token_encrypted || "";
      const webhookUrl = record.webhook_url || "";
      const verified = record.webhook_verified ? "1" : "0";
      const botName = record.bot_display_name || "";
      const botBasicId = record.bot_basic_id || "";
      const updatedAt = new Date().toISOString();

      const lastRow = sheet.getLastRow();
      let updated = false;

      for (let r = 2; r <= lastRow; r++) {
        const idVal = sheet.getRange(r, 1).getValue().toString();
        if (idVal === configId || idVal === "line-cfg-001") {
          sheet.getRange(r, 1, 1, 9).setValues([[
            configId, channelId, channelSec, channelTok, webhookUrl, verified, botName, botBasicId, updatedAt
          ]]);
          updated = true;
          break;
        }
      }

      if (!updated) {
        sheet.appendRow([configId, channelId, channelSec, channelTok, webhookUrl, verified, botName, botBasicId, updatedAt]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "อัปเดต LINE_Configs ใน Google Sheet สำเร็จ",
        record
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "ดำเนินการสำเร็จ"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "PR4Fang AI Google Sheets Connector",
    spreadsheet_id: SpreadsheetApp.getActiveSpreadsheet().getId()
  })).setMimeType(ContentService.MimeType.JSON);
}
