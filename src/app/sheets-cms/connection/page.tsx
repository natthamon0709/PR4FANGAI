'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import GoogleOAuthConnectButton from '@/components/sheets/GoogleOAuthConnectButton';
import FieldMappingTable from '@/components/sheets/FieldMappingTable';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { SheetSyncConfig } from '@/types/sheets';
import { ArrowLeft, Key, CheckCircle2, RefreshCw, Layers, ShieldCheck, Loader2 } from 'lucide-react';

export default function SheetsConnectionPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [configs, setConfigs] = useState<SheetSyncConfig[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('knowledge');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const APPS_SCRIPT_TEMPLATE = `/**
 * =======================================================================
 * PR4Fang AI — 2-Way Google Sheets Webhook Receiver (Exact 29-Column Match)
 * วิทยาลัยการอาชีพฝาง — ระบบซิงค์ข้อมูล 2 ทิศทางอัตโนมัติ
 * =======================================================================
 */

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    
    var sheetName = data.sheetName || 'Knowledge_Base';
    var record = data.recordData || {};
    var timestamp = data.timestamp || new Date().toISOString();
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      initSheetHeaders(sheet, sheetName);
    }
    
    // สำหรับแท็บ Knowledge_Base: กำหนดตรงตามโครงสร้าง 29 คอลัมน์ (A ถึง AC) เป๊ะ 100%
    if (sheetName === 'Knowledge_Base' || sheetName === 'knowledge_items') {
      var row29 = [
        record.knowledge_id || ('KB-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd') + '-' + Math.floor(100 + Math.random() * 900)), // Col A (1): Knowledge_ID
        record.created_at || Utilities.formatDate(new Date(), 'GMT+7', 'M/d/yyyy H:m'),                                                    // Col B (2): Created_At
        record.updated_at || Utilities.formatDate(new Date(), 'GMT+7', 'M/d/yyyy H:m'),                                                    // Col C (3): Updated_At
        record.form_response_id || 'WEB-APP',                                                                                              // Col D (4): Form_Response_ID
        record.email || '',                                                                                                                // Col E (5): Email
        record.full_name || '',                                                                                                            // Col F (6): Full_Name
        record.class_room || '-',                                                                                                          // Col G (7): Class_Room
        record.record_date || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),                                                    // Col H (8): Record_Date
        record.department || '',                                                                                                           // Col I (9): Department
        record.section || '',                                                                                                              // Col J (10): Section
        record.content_type || 'ข้อมูล,เอกสาร',                                                                                            // Col K (11): Content_Type
        record.title || '',                                                                                                                // Col L (12): Title
        record.description || record.content || '',                                                                                        // Col M (13): Description
        record.status || 'Published',                                                                                                      // Col N (14): Status
        record.target_group || 'ปวช. , ปวส. , ผู้ปกครอง',                                                                                 // Col O (15): Target_Group
        record.publish_start || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),                                                  // Col P (16): Publish_Start
        record.publish_end || '-',                                                                                                         // Col Q (17): Publish_End
        record.keywords || record.keyword || '',                                                                                           // Col R (18): Keyword
        record.faq || (record.content_type === 'FAQ' ? ('Q: ' + record.title) : '-'),                                                     // Col S (19): FAQ
        record.faq_answer || (record.content_type === 'FAQ' ? ('A: ' + (record.description || record.content)) : '-'),                   // Col T (20): FAQ_Answer
        record.drive_url || '-',                                                                                                           // Col U (21): Drive_URL
        record.website_url || '-',                                                                                                         // Col V (22): Website_URL
        record.source || 'วิทยาลัยการอาชีพฝาง',                                                                                            // Col W (23): Source
        record.officer || record.full_name || '',                                                                                         // Col X (24): Officer
        record.officer_email || record.email || '',                                                                                        // Col Y (25): Officer_Email
        record.officer_tel || '053-451234',                                                                                                // Col Z (26): Officer_Tel
        record.sync_status || 'Synced',                                                                                                    // Col AA (27): Sync_Status
        record.external_id || '-',                                                                                                         // Col AB (28): External_ID
        record.note || record.notes || '-'                                                                                                 // Col AC (29): Notes
      ];
      sheet.appendRow(row29);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: 'success', 
        message: 'บันทึก Knowledge_Base ครบ 29 คอลัมน์ (A ถึง AC) เรียบร้อยแล้ว' 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // สำหรับแท็บ Master_Users: จัดการเพิ่ม/แก้ไข/ลบ ข้อมูลผู้ใช้งานตรงตาม 12 คอลัมน์
    if (sheetName === 'Master_Users' || sheetName === 'master_users') {
      var userId = record.user_id || ('usr-staff-' + Math.floor(100 + Math.random() * 900));
      var email = record.email || '';
      var lastRow = sheet.getLastRow();
      var foundRow = -1;

      for (var r = 2; r <= lastRow; r++) {
        var idVal = sheet.getRange(r, 1).getValue().toString().trim();
        var emailVal = sheet.getRange(r, 4).getValue().toString().trim().toLowerCase();
        if ((userId && idVal === userId) || (email && emailVal === email.toLowerCase())) {
          foundRow = r;
          break;
        }
      }

      if (data.action === 'delete') {
        if (foundRow > 1) {
          sheet.deleteRow(foundRow);
        }
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'ลบผู้ใช้ ' + userId + ' ออกจาก Google Sheet สำเร็จ'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var userRow = [
        userId,
        record.first_name || '',
        record.last_name || '',
        email,
        record.phone || '',
        record.department_code || record.department_name || 'RES',
        record.sub_department_name || '',
        record.role || 'staff',
        record.status || 'active',
        record.line_user_id || '',
        record.last_login_at || Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss'),
        Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss')
      ];

      if (foundRow > 1) {
        sheet.getRange(foundRow, 1, 1, userRow.length).setValues([userRow]);
      } else {
        sheet.appendRow(userRow);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'บันทึก/อัปเดต Master_Users ใน Google Sheet สำเร็จ'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // สำหรับแท็บระบบอื่นๆ
    if (sheetName === 'AI_Query_Logs') {
      sheet.appendRow([
        timestamp,
        record.log_id || '',
        record.line_user_id || '',
        record.question || record.question_text || '',
        record.confidence || record.confidence_score || '',
        record.answer || record.answer_text || '',
        record.is_fallback ? 'Fallback' : 'Answered',
        record.response_time_ms || ''
      ]);
    } else if (sheetName === 'Knowledge_Gaps') {
      sheet.appendRow([
        timestamp,
        record.gap_id || '',
        record.question_text || record.question || '',
        record.ask_count || 1,
        record.department_guess || '',
        record.status || 'open'
      ]);
    } else if (sheetName === 'LINE_Followers') {
      sheet.appendRow([
        timestamp,
        record.follower_id || '',
        record.line_user_id || '',
        record.display_name || '',
        record.avatar_url || ''
      ]);
    } else if (sheetName === 'LINE_Broadcasts') {
      sheet.appendRow([
        timestamp,
        record.broadcast_id || '',
        record.title || '',
        record.message_text || '',
        record.target_type || 'all_followers',
        record.status || 'sent',
        record.delivered_count || 0
      ]);
    } else {
      var row = [timestamp];
      for (var k in record) {
        row.push(record[k]);
      }
      sheet.appendRow(row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว' 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'status';
  
  if (action === 'get_folder_images') {
    var folderId = e.parameter.folderId;
    try {
      var folder = DriveApp.getFolderById(folderId);
      var files = folder.getFiles();
      var list = [];
      while (files.hasNext()) {
        var f = files.next();
        var mime = f.getMimeType();
        if (mime.indexOf('image/') !== -1 || f.getName().match(/\.(jpg|jpeg|png|webp)$/i)) {
          list.push({
            id: f.getId(),
            name: f.getName().replace(/\.[^/.]+$/, ''),
            url: 'https://lh3.googleusercontent.com/d/' + f.getId(),
            thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w1000'
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', files: list }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'scan_drive_media') {
    var count = scanAndIndexAllDriveFolders();
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: 'สแกนรูปภาพจาก Google Drive สำเร็จ (' + count + ' รายการ)' 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'ready', 
    message: 'PR4Fang AI Webhook Active (29 Columns & Drive Media Intelligence Enabled)' 
  })).setMimeType(ContentService.MimeType.JSON);
}

function onOpen(e) {
  try {
    var ui = SpreadsheetApp.getUi();
    if (ui) {
      ui.createMenu('PR4Fang AI')
        .addItem('📸 สแกนดึงรูปภาพทั้งหมดจาก Drive', 'scanAndIndexAllDriveFolders')
        .addToUi();
    }
  } catch (err) {
    // getUi() is only accessible when running inside Google Sheets UI container
  }
}

function scanAndIndexAllDriveFolders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var kbSheet = ss.getSheetByName('Knowledge_Base') || ss.getSheetByName('knowledge_items');
  if (!kbSheet) return 0;
  
  var mediaSheet = ss.getSheetByName('Drive_Media');
  if (!mediaSheet) {
    mediaSheet = ss.insertSheet('Drive_Media');
    mediaSheet.appendRow(['Folder_ID', 'File_ID', 'Person_Or_File_Name', 'Image_Direct_URL', 'Department_Title', 'Updated_At']);
  }
  
  var lastRow = mediaSheet.getLastRow();
  if (lastRow > 1) {
    mediaSheet.getRange(2, 1, lastRow - 1, 6).clearContent();
  }
  
  var data = kbSheet.getDataRange().getValues();
  var rowsToInsert = [];
  var seenFileIds = {};
  
  for (var i = 1; i < data.length; i++) {
    var title = data[i][11] || '';
    var driveUrl = data[i][20] || '';
    if (!driveUrl) continue;
    
    var folderMatch = driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
    var fileMatch = driveUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
    
    if (folderMatch) {
      var folderId = folderMatch[1];
      try {
        var folder = DriveApp.getFolderById(folderId);
        var files = folder.getFiles();
        while (files.hasNext()) {
          var f = files.next();
          var fId = f.getId();
          if (seenFileIds[fId]) continue;
          seenFileIds[fId] = true;
          
          var fName = f.getName().replace(/\.[^/.]+$/, '').trim();
          var directUrl = 'https://lh3.googleusercontent.com/d/' + fId;
          rowsToInsert.push([folderId, fId, fName, directUrl, title, Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss')]);
        }
      } catch (err) {}
    } else if (fileMatch) {
      var fileId = fileMatch[1];
      if (!seenFileIds[fileId]) {
        seenFileIds[fileId] = true;
        var directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
        rowsToInsert.push(['-', fileId, title, directUrl, title, Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss')]);
      }
    }
  }
  
  if (rowsToInsert.length > 0) {
    mediaSheet.getRange(2, 1, rowsToInsert.length, 6).setValues(rowsToInsert);
  }
  return rowsToInsert.length;
}

function initSheetHeaders(sheet, name) {
  if (name === 'Knowledge_Base' || name === 'knowledge_items') {
    sheet.appendRow([
      'Knowledge_ID', 'Created_At', 'Updated_At', 'Form_Response_ID', 'Email', 'Full_Name',
      'Class_Room', 'Record_Date', 'Department', 'Section', 'Content_Type', 'Title',
      'Description', 'Status', 'Target_Group', 'Publish_Start', 'Publish_End', 'Keyword',
      'FAQ', 'FAQ_Answer', 'Drive_URL', 'Website_URL', 'Source', 'Officer',
      'Officer_Email', 'Officer_Tel', 'Sync_Status', 'External_ID', 'Notes'
    ]);
  } else if (name === 'Drive_Media') {
    sheet.appendRow(['Folder_ID', 'File_ID', 'Person_Or_File_Name', 'Image_Direct_URL', 'Department_Title', 'Updated_At']);
  } else if (name === 'Master_Users' || name === 'master_users') {
    sheet.appendRow(['User ID', 'ชื่อ', 'นามสกุล', 'อีเมล', 'เบอร์โทรศัพท์', 'รหัสฝ่าย (Department Code)', 'ชื่องาน/แผนกย่อย', 'บทบาท (Role)', 'สถานะ (Status)', 'LINE User ID', 'เข้าสู่ระบบล่าสุด', 'อัปเดตล่าสุด']);
  } else if (name === 'AI_Query_Logs') {
    sheet.appendRow(['Timestamp', 'Log_ID', 'LINE_User_ID', 'Question', 'Confidence', 'AI_Answer', 'Status', 'Response_Time_ms']);
  } else if (name === 'Knowledge_Gaps') {
    sheet.appendRow(['Timestamp', 'Gap_ID', 'Question_Text', 'Ask_Count', 'Department_Guess', 'Status']);
  } else if (name === 'LINE_Followers') {
    sheet.appendRow(['Timestamp', 'Follower_ID', 'LINE_User_ID', 'Display_Name', 'Avatar_URL']);
  } else if (name === 'LINE_Broadcasts') {
    sheet.appendRow(['Timestamp', 'Broadcast_ID', 'Title', 'Message_Text', 'Target_Type', 'Status', 'Delivered_Count']);
  }
}`;

  useEffect(() => {
    async function loadMeta() {
      try {
        const [authRes, statusRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/sheets-cms/status'),
        ]);

        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        if (authData.user.role !== 'administrator') {
          router.push('/sheets-cms');
          return;
        }
        setCurrentUser(authData.user);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setConfigs(statusData.configs || []);
          if (statusData.google_apps_script_url) {
            setAppsScriptUrl(statusData.google_apps_script_url);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, [router]);

  async function handleSaveAppsScriptUrl() {
    setSavingUrl(true);
    setAlertMsg(null);
    try {
      const res = await fetch('/api/sheets-cms/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_apps_script_url: appsScriptUrl })
      });
      if (res.ok) {
        setAlertMsg({ type: 'success', text: '✅ บันทึก Google Apps Script Webhook URL เรียบร้อยแล้ว ระบบจะส่งข้อมูลไปบันทึกลงชีตอัตโนมัติ' });
      } else {
        const data = await res.json();
        setAlertMsg({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setSavingUrl(false);
    }
  }

  const [pushingAllUsers, setPushingAllUsers] = useState(false);

  async function handlePushAllUsers() {
    setPushingAllUsers(true);
    setAlertMsg(null);
    try {
      const res = await fetch('/api/integrations/google-sheets/export', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertMsg({ type: 'success', text: `✅ ${data.message}` });
      } else {
        setAlertMsg({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล' });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setPushingAllUsers(false);
    }
  }

  function handleCopyScriptCode() {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  }

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentConfig = configs.find((c) => c.sheet_name === selectedSheet) || configs[0];

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'Google Sheets CMS', href: '/sheets-cms' },
        { label: 'ตั้งค่าการเชื่อมต่อ & Field Mapping' },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
        <div>
          <Link
            href="/sheets-cms"
            className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้าภาพรวม Google Sheets CMS</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface">
            ตั้งค่าการเชื่อมต่อ Google Service Account & Field Mapping
          </h1>
          <p className="text-xs text-onSurface-muted mt-0.5">
            กำหนดการจับคู่ฟิลด์ระหว่างคอลัมน์ใน Google Sheets และโครงสร้างฐานข้อมูลหลักของ PR4Fang AI
          </p>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* 1. Google OAuth / Service Account Card */}
        <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E5F4EA] text-[#0F9D58] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-onSurface">
                บัญชี Google Service Account สำหรับสิทธิ์ระดับองค์กร
              </h3>
              <p className="text-xs text-onSurface-muted">
                ใช้เข้าถึงและแก้ไข Spreadsheet ID: <strong className="font-mono text-onSurface">1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs</strong>
              </p>
            </div>
          </div>

          <div className="pt-2">
            <GoogleOAuthConnectButton connected={true} />
          </div>
        </div>

        {/* 2. Google Apps Script 2-Way Webhook Card (PUSH Sync to Sheet) */}
        <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-onSurface">
                Google Apps Script Webhook URL (สำหรับ 2-Way Live PUSH ไปยัง Google Sheets)
              </h3>
              <p className="text-xs text-onSurface-muted mt-0.5">
                เมื่อมีข้อมูลใหม่ เช่น แชท LINE (AI_Query_Logs), คำถามที่ตอบไม่ได้ (Knowledge_Gaps), ผู้ติดตามใหม่ (LINE_Followers) ระบบจะส่งไปบันทึกลง Google Sheet อัตโนมัติ
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                className="flex-1 h-11 px-4 rounded-xl border border-outline bg-surface text-xs font-mono text-onSurface outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={handleSaveAppsScriptUrl}
                disabled={savingUrl}
                className="h-11 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {savingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>บันทึก URL</span>
              </button>

              <button
                type="button"
                onClick={handlePushAllUsers}
                disabled={pushingAllUsers}
                className="h-11 px-5 rounded-xl bg-secondary text-secondary-dark hover:bg-secondary/80 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                title="ส่งข้อมูลผู้ใช้งานทั้งหมดในระบบขึ้น Google Sheet ทันที"
              >
                {pushingAllUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>ส่งออกผู้ใช้ทั้งหมดขึ้น Sheet ทันที</span>
              </button>
            </div>

            {/* Guide Accordion / Code Template Box */}
            <div className="p-4 rounded-xl bg-surface border border-outline/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-onSurface">📋 โค้ด Google Apps Script สำหรับวางใน Google Sheet</span>
                <button
                  type="button"
                  onClick={handleCopyScriptCode}
                  className="px-3 py-1 rounded-lg bg-surface-variant hover:bg-outline/20 text-onSurface text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : null}
                  <span>{copiedCode ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-onSurface-muted leading-relaxed">
                <li>เปิด Google Sheet ของท่าน ไปที่เมนู <strong className="text-onSurface font-semibold">ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
                <li>ลบโค้ดเดิมออกทั้งหมด แล้วนำโค้ดด้านล่างไปวางแทนที่</li>
                <li>กดปุ่ม <strong className="text-onSurface font-semibold">การทำให้ใช้งานได้ (Deploy) &gt; การทำให้ใช้งานได้ใหม่ (New deployment)</strong></li>
                <li>เลือกประเภทเป็น <strong className="text-onSurface font-semibold">เว็บแอป (Web app)</strong> โดยตั้งค่า:
                  <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5">
                    <li>เรียกใช้ในฐานะ (Execute as): <span className="font-mono text-onSurface">ฉัน (Me)</span></li>
                    <li>ผู้มีสิทธิ์เข้าถึง (Who has access): <span className="font-mono text-primary font-bold">ทุกคน (Anyone)</span></li>
                  </ul>
                </li>
                <li>กด Deploy แล้วคัดลอก <strong className="text-onSurface font-semibold">URL เว็บแอป (Web App URL)</strong> มาวางในช่องด้านบนแล้วกดบันทึก</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 3. Field Mapping Selection & Table (C54) */}
        <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline/20">
            <div>
              <h3 className="text-sm font-heading font-bold text-onSurface flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>การจับคู่ฟิลด์มาตรฐาน (Field Mapping)</span>
              </h3>
              <p className="text-xs text-onSurface-muted mt-0.5">
                เลือกแท็บชีทที่ต้องการตรวจสอบและกำหนดค่า Mapping
              </p>
            </div>

            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface font-medium outline-none cursor-pointer"
            >
              {configs.map((c) => (
                <option key={c.sheet_name} value={c.sheet_name}>
                  {c.sheet_title_th} ({c.sheet_name})
                </option>
              ))}
            </select>
          </div>

          {currentConfig && (
            <FieldMappingTable
              mapping={currentConfig.field_mapping || {}}
              sheetName={currentConfig.sheet_name}
            />
          )}

          <p className="text-[11px] text-onSurface-muted leading-relaxed">
            💡 ฟิลด์ Mapping ข้างต้นจะถูกนำไปใช้โดยอัตโนมัติเมื่อมีการส่ง Webhook จาก Google Apps Script หรือสั่งซิงค์ข้อมูล
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
