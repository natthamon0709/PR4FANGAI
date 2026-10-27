import crypto from 'crypto';
import getDb from '../lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { SessionUser } from '../types';
import { 
  ContentType, 
  KnowledgeStatus, 
  KnowledgeItem, 
  KnowledgeAttachment,
  KnowledgeListResponse 
} from '../types/knowledge';

export interface KnowledgeFilterParams {
  search?: string;
  contentType?: string;
  departmentId?: string;
  subDepartmentId?: string;
  status?: string;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateKnowledgeData {
  content_type: ContentType;
  title: string;
  summary: string;
  content: string;
  department_id?: string;
  sub_department_id?: string;
  tags?: string[] | string;
  status?: KnowledgeStatus;
  effective_date?: string | null;
  expiry_date?: string | null;
  ai_retrieval_enabled?: boolean;
  attachments?: Partial<KnowledgeAttachment>[];
}

export class KnowledgeModel {
  /**
   * Find paginated knowledge items with RBAC departmental boundaries
   */
  static async findKnowledgeItems(
    filters: KnowledgeFilterParams,
    session: SessionUser
  ): Promise<KnowledgeListResponse> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const offset = (page - 1) * limit;
    const search = filters.search?.trim() || '';
    const contentType = filters.contentType || 'all';
    const departmentId = filters.departmentId || '';
    const subDepartmentId = filters.subDepartmentId || '';
    const status = filters.status || 'all';
    const isAdmin = session.role === 'administrator';

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        let sbQuery = supabaseAdmin
          .from('knowledge_items')
          .select(`
            *,
            departments (name),
            sub_departments (name)
          `, { count: 'exact' });

        if (!isAdmin) {
          sbQuery = sbQuery.or(`department_id.eq.${session.department_id},status.eq.published`);
        }
        if (contentType !== 'all') {
          sbQuery = sbQuery.eq('content_type', contentType);
        }
        if (departmentId && departmentId !== 'all') {
          sbQuery = sbQuery.eq('department_id', departmentId);
        }
        if (subDepartmentId && subDepartmentId !== 'all') {
          sbQuery = sbQuery.eq('sub_department_id', subDepartmentId);
        }
        if (status !== 'all') {
          sbQuery = sbQuery.eq('status', status);
        } else if (!filters.includeArchived) {
          sbQuery = sbQuery.neq('status', 'archived');
        }
        if (search) {
          sbQuery = sbQuery.or(`title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`);
        }

        const { data: sbItems, count: sbTotal, error: sbErr } = await sbQuery
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!sbErr && sbItems) {
          const { data: allItemsForCounts } = await supabaseAdmin
            .from('knowledge_items')
            .select('content_type');

          const typeCounts: Record<ContentType | 'all', number> = {
            all: 0, news: 0, announcement: 0, faq: 0, document: 0,
            manual: 0, regulation: 0, form: 0, service_process: 0
          };

          if (allItemsForCounts) {
            allItemsForCounts.forEach((r: any) => {
              if (typeCounts[r.content_type as ContentType] !== undefined) {
                typeCounts[r.content_type as ContentType]++;
                typeCounts.all++;
              }
            });
          }

          const formatted = sbItems.map((item: any) => {
            let parsedTags: string[] = [];
            try {
              parsedTags = JSON.parse(item.tags || '[]');
            } catch {
              parsedTags = item.tags ? [item.tags] : [];
            }
            return {
              ...item,
              department_name: item.departments?.name || '',
              sub_department_name: item.sub_departments?.name || '',
              tags: parsedTags,
              ai_retrieval_enabled: Boolean(item.ai_retrieval_enabled)
            };
          });

          return {
            items: formatted,
            total: sbTotal || 0,
            page,
            limit,
            totalPages: Math.ceil((sbTotal || 0) / limit) || 1,
            typeCounts
          };
        }
      } catch (err) {
        console.error('Supabase findKnowledgeItems exception:', err);
      }
    }

    // 2. Fallback to SQLite (using secondary indexes)
    const db = getDb();
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (!isAdmin) {
      whereClauses.push(`(k.department_id = ? OR k.status = 'published')`);
      params.push(session.department_id);
    }

    if (contentType !== 'all') {
      whereClauses.push(`k.content_type = ?`);
      params.push(contentType);
    }

    if (departmentId && departmentId !== 'all') {
      whereClauses.push(`k.department_id = ?`);
      params.push(departmentId);
    }

    if (subDepartmentId && subDepartmentId !== 'all') {
      whereClauses.push(`k.sub_department_id = ?`);
      params.push(subDepartmentId);
    }

    if (status !== 'all') {
      whereClauses.push(`k.status = ?`);
      params.push(status);
    } else if (!filters.includeArchived) {
      whereClauses.push(`k.status != 'archived'`);
    }

    if (search) {
      whereClauses.push(`(k.title LIKE ? OR k.summary LIKE ? OR k.content LIKE ? OR k.tags LIKE ?)`);
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalRow = db.prepare(`
      SELECT COUNT(*) as total 
      FROM knowledge_items k 
      ${whereSQL}
    `).get(...params) as { total: number };

    const total = totalRow ? totalRow.total : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const items = db.prepare(`
      SELECT 
        k.*,
        (SELECT COUNT(*) FROM ai_retrieved_sources s JOIN ai_query_logs q ON s.log_id = q.log_id WHERE s.knowledge_id = k.knowledge_id AND q.is_fallback = 0) as ai_reference_count,
        d.name as department_name,
        s.name as sub_department_name,
        (u.first_name || ' ' || u.last_name) as creator_name,
        (u2.first_name || ' ' || u2.last_name) as updater_name,
        (SELECT COUNT(*) FROM knowledge_version_history v WHERE v.knowledge_id = k.knowledge_id) as version_count
      FROM knowledge_items k
      LEFT JOIN departments d ON k.department_id = d.department_id
      LEFT JOIN sub_departments s ON k.sub_department_id = s.sub_department_id
      LEFT JOIN master_users u ON k.created_by = u.user_id
      LEFT JOIN master_users u2 ON k.updated_by = u2.user_id
      ${whereSQL}
      ORDER BY k.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    // Calculate content type counts
    const typeCountRows = db.prepare(`
      SELECT 
        k.content_type, 
        COUNT(*) as cnt 
      FROM knowledge_items k
      ${!isAdmin ? `WHERE (k.department_id = '${session.department_id}' OR k.status = 'published')` : ''}
      GROUP BY k.content_type
    `).all() as { content_type: string; cnt: number }[];

    const typeCounts: Record<ContentType | 'all', number> = {
      all: 0, news: 0, announcement: 0, faq: 0, document: 0,
      manual: 0, regulation: 0, form: 0, service_process: 0,
    };

    let allSum = 0;
    typeCountRows.forEach(r => {
      if (typeCounts[r.content_type as ContentType] !== undefined) {
        typeCounts[r.content_type as ContentType] = r.cnt;
        allSum += r.cnt;
      }
    });
    typeCounts.all = allSum;

    const formattedItems = items.map((item: any) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(item.tags || '[]');
      } catch (e) {
        parsedTags = item.tags ? [item.tags] : [];
      }
      return {
        ...item,
        tags: parsedTags,
        ai_retrieval_enabled: Boolean(item.ai_retrieval_enabled)
      };
    });

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages,
      typeCounts
    };
  }

  /**
   * Find single knowledge item by ID with view count increment & departmental security check
   */
  static async findKnowledgeById(knowledgeId: string, session: SessionUser): Promise<KnowledgeItem> {
    const isAdmin = session.role === 'administrator';

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: sbItem, error: sbErr } = await supabaseAdmin
          .from('knowledge_items')
          .select(`
            *,
            departments (name),
            sub_departments (name)
          `)
          .eq('knowledge_id', knowledgeId)
          .maybeSingle();

        if (!sbErr && sbItem) {
          if (!isAdmin && sbItem.department_id !== session.department_id && sbItem.status !== 'published') {
            throw new Error('FORBIDDEN_DEPARTMENT');
          }

          // Asynchronously update view count
          supabaseAdmin
            .from('knowledge_items')
            .update({ view_count: (sbItem.view_count || 0) + 1 })
            .eq('knowledge_id', knowledgeId)
            .then();

          const { data: sbAttachments } = await supabaseAdmin
            .from('knowledge_attachments')
            .select('*')
            .eq('knowledge_id', knowledgeId)
            .order('uploaded_at', { ascending: false });

          let parsedTags: string[] = [];
          try {
            parsedTags = JSON.parse(sbItem.tags || '[]');
          } catch {
            parsedTags = sbItem.tags ? [sbItem.tags] : [];
          }

          return {
            ...sbItem,
            department_name: (sbItem.departments as any)?.name || '',
            sub_department_name: (sbItem.sub_departments as any)?.name || '',
            tags: parsedTags,
            ai_retrieval_enabled: Boolean(sbItem.ai_retrieval_enabled),
            attachments: sbAttachments || []
          };
        }
      } catch (err: any) {
        if (err.message === 'FORBIDDEN_DEPARTMENT') throw err;
      }
    }

    // 2. Fallback to SQLite
    const db = getDb();
    const item = db.prepare(`
      SELECT 
        k.*,
        (SELECT COUNT(*) FROM ai_retrieved_sources s JOIN ai_query_logs q ON s.log_id = q.log_id WHERE s.knowledge_id = k.knowledge_id AND q.is_fallback = 0) as ai_reference_count,
        d.name as department_name,
        s.name as sub_department_name,
        (u.first_name || ' ' || u.last_name) as creator_name,
        (u2.first_name || ' ' || u2.last_name) as updater_name,
        (SELECT COUNT(*) FROM knowledge_version_history v WHERE v.knowledge_id = k.knowledge_id) as version_count
      FROM knowledge_items k
      LEFT JOIN departments d ON k.department_id = d.department_id
      LEFT JOIN sub_departments s ON k.sub_department_id = s.sub_department_id
      LEFT JOIN master_users u ON k.created_by = u.user_id
      LEFT JOIN master_users u2 ON k.updated_by = u2.user_id
      WHERE k.knowledge_id = ?
    `).get(knowledgeId) as any;

    if (!item) {
      throw new Error('NOT_FOUND');
    }

    if (!isAdmin && item.department_id !== session.department_id && item.status !== 'published') {
      throw new Error('FORBIDDEN_DEPARTMENT');
    }

    db.prepare('UPDATE knowledge_items SET view_count = view_count + 1 WHERE knowledge_id = ?').run(knowledgeId);

    const attachments = db.prepare(`
      SELECT * FROM knowledge_attachments WHERE knowledge_id = ? ORDER BY uploaded_at DESC
    `).all(knowledgeId) as KnowledgeAttachment[];

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(item.tags || '[]');
    } catch {
      parsedTags = item.tags ? [item.tags] : [];
    }

    return {
      ...item,
      tags: parsedTags,
      ai_retrieval_enabled: Boolean(item.ai_retrieval_enabled),
      attachments
    };
  }

  /**
   * Create knowledge item
   */
  static async createKnowledgeItem(
    data: CreateKnowledgeData,
    session: SessionUser
  ): Promise<string> {
    const targetDeptId = session.role === 'administrator' 
      ? (data.department_id || session.department_id) 
      : session.department_id;
    const targetSubDeptId = data.sub_department_id || session.sub_department_id;

    const todayNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const knowledgeId = `KB-${todayNum}-${randNum}`;
    const now = new Date().toISOString();
    const tagArray = Array.isArray(data.tags) ? data.tags : [data.tags].filter(Boolean);
    const status = data.status || 'published';

    // 1. Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from('knowledge_items').insert({
          knowledge_id: knowledgeId,
          content_type: data.content_type,
          title: data.title.trim(),
          summary: data.summary.trim(),
          content: data.content.trim(),
          department_id: targetDeptId,
          sub_department_id: targetSubDeptId,
          tags: JSON.stringify(tagArray),
          status,
          effective_date: data.effective_date || null,
          expiry_date: data.expiry_date || null,
          ai_retrieval_enabled: data.ai_retrieval_enabled ? 1 : 0,
          view_count: 0,
          ai_reference_count: 0,
          sync_status: 'synced',
          created_by: session.user_id,
          updated_by: session.user_id,
          created_at: now,
          updated_at: now,
          published_at: status === 'published' ? now : null
        });

        await supabaseAdmin.from('knowledge_version_history').insert({
          version_id: 'ver-' + crypto.randomUUID(),
          knowledge_id: knowledgeId,
          version_no: 1,
          title_snapshot: data.title.trim(),
          summary_snapshot: data.summary.trim(),
          content_snapshot: data.content.trim(),
          tags_snapshot: JSON.stringify(tagArray),
          edited_by: session.user_id,
          edited_at: now
        });

        if (Array.isArray(data.attachments) && data.attachments.length > 0) {
          for (const att of data.attachments) {
            await supabaseAdmin.from('knowledge_attachments').insert({
              attachment_id: 'att-' + crypto.randomUUID(),
              knowledge_id: knowledgeId,
              file_name: att.file_name || 'attachment.pdf',
              file_url: att.file_url || '',
              file_type: att.file_type || 'pdf',
              file_size_kb: att.file_size_kb || 100,
              uploaded_at: now
            });
          }
        }

        await supabaseAdmin.from('activity_feed').insert({
          activity_id: 'act-' + crypto.randomUUID(),
          actor_user_id: session.user_id,
          action_type: 'create',
          target_type: 'knowledge',
          target_id: knowledgeId,
          department_id: targetDeptId,
          title_snapshot: data.title.trim(),
          created_at: now
        });
      } catch (sbErr) {
        console.warn('Supabase knowledge insert warning:', sbErr);
      }
    }

    // 2. SQLite
    const db = getDb();
    db.prepare(`
      INSERT INTO knowledge_items (
        knowledge_id, content_type, title, summary, content, department_id, sub_department_id,
        tags, status, effective_date, expiry_date, ai_retrieval_enabled, view_count, ai_reference_count,
        sync_status, created_by, updated_by, created_at, updated_at, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'synced', ?, ?, ?, ?, ?)
    `).run(
      knowledgeId,
      data.content_type,
      data.title.trim(),
      data.summary.trim(),
      data.content.trim(),
      targetDeptId,
      targetSubDeptId,
      JSON.stringify(tagArray),
      status,
      data.effective_date || null,
      data.expiry_date || null,
      data.ai_retrieval_enabled ? 1 : 0,
      session.user_id,
      session.user_id,
      now,
      now,
      status === 'published' ? now : null
    );

    db.prepare(`
      INSERT INTO knowledge_version_history (
        version_id, knowledge_id, version_no, title_snapshot, summary_snapshot,
        content_snapshot, tags_snapshot, edited_by, edited_at
      ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
    `).run(
      'ver-' + crypto.randomUUID(),
      knowledgeId,
      data.title.trim(),
      data.summary.trim(),
      data.content.trim(),
      JSON.stringify(tagArray),
      session.user_id,
      now
    );

    if (Array.isArray(data.attachments) && data.attachments.length > 0) {
      for (const att of data.attachments) {
        db.prepare(`
          INSERT INTO knowledge_attachments (
            attachment_id, knowledge_id, file_name, file_url, file_type, file_size_kb, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          'att-' + crypto.randomUUID(),
          knowledgeId,
          att.file_name || 'attachment.pdf',
          att.file_url || '',
          att.file_type || 'pdf',
          att.file_size_kb || 100,
          now
        );
      }
    }

    db.prepare(`
      INSERT INTO activity_feed (
        activity_id, actor_user_id, action_type, target_type, target_id, department_id, title_snapshot, created_at
      ) VALUES (?, ?, 'create', 'knowledge', ?, ?, ?, ?)
    `).run(
      'act-' + crypto.randomUUID(),
      session.user_id,
      knowledgeId,
      targetDeptId,
      data.title.trim(),
      now
    );

    db.prepare('DELETE FROM dashboard_summary_cache').run();

    return knowledgeId;
  }

  /**
   * Update knowledge item with strict IDOR / departmental boundary checks
   */
  static async updateKnowledgeItem(
    knowledgeId: string,
    data: Partial<CreateKnowledgeData>,
    session: SessionUser
  ): Promise<boolean> {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;

    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    // Security Check: Staff can only edit knowledge belonging to their own department
    const isAdmin = session.role === 'administrator';
    if (!isAdmin && existing.department_id !== session.department_id) {
      throw new Error('FORBIDDEN_DEPARTMENT');
    }

    const now = new Date().toISOString();
    const tagArray = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : JSON.parse(existing.tags || '[]'));
    const targetDeptId = isAdmin && data.department_id ? data.department_id : existing.department_id;
    const targetSubDeptId = data.sub_department_id || existing.sub_department_id;
    const updatedTitle = data.title ? data.title.trim() : existing.title;
    const updatedSummary = data.summary ? data.summary.trim() : existing.summary;
    const updatedContent = data.content ? data.content.trim() : existing.content;
    const updatedType = data.content_type || existing.content_type;
    const updatedStatus = data.status || existing.status;
    const updatedAi = data.ai_retrieval_enabled !== undefined ? (data.ai_retrieval_enabled ? 1 : 0) : existing.ai_retrieval_enabled;

    // 1. Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from('knowledge_items').update({
          content_type: updatedType,
          title: updatedTitle,
          summary: updatedSummary,
          content: updatedContent,
          department_id: targetDeptId,
          sub_department_id: targetSubDeptId,
          tags: JSON.stringify(tagArray),
          status: updatedStatus,
          effective_date: data.effective_date !== undefined ? data.effective_date : existing.effective_date,
          expiry_date: data.expiry_date !== undefined ? data.expiry_date : existing.expiry_date,
          ai_retrieval_enabled: updatedAi,
          updated_by: session.user_id,
          updated_at: now
        }).eq('knowledge_id', knowledgeId);

        await supabaseAdmin.from('knowledge_version_history').insert({
          version_id: 'ver-' + crypto.randomUUID(),
          knowledge_id: knowledgeId,
          version_no: Date.now(),
          title_snapshot: updatedTitle,
          summary_snapshot: updatedSummary,
          content_snapshot: updatedContent,
          tags_snapshot: JSON.stringify(tagArray),
          edited_by: session.user_id,
          edited_at: now
        });

        if (Array.isArray(data.attachments) && data.attachments.length > 0) {
          await supabaseAdmin.from('knowledge_attachments').delete().eq('knowledge_id', knowledgeId);
          for (const att of data.attachments) {
            await supabaseAdmin.from('knowledge_attachments').insert({
              attachment_id: 'att-' + crypto.randomUUID(),
              knowledge_id: knowledgeId,
              file_name: att.file_name || 'attachment.pdf',
              file_url: att.file_url || '',
              file_type: att.file_type || 'pdf',
              file_size_kb: att.file_size_kb || 100,
              uploaded_at: now
            });
          }
        }
      } catch (sbErr) {
        console.warn('Supabase knowledge update error:', sbErr);
      }
    }

    // 2. SQLite
    db.prepare(`
      UPDATE knowledge_items SET
        content_type = ?,
        title = ?,
        summary = ?,
        content = ?,
        department_id = ?,
        sub_department_id = ?,
        tags = ?,
        status = ?,
        effective_date = ?,
        expiry_date = ?,
        ai_retrieval_enabled = ?,
        updated_by = ?,
        updated_at = ?
      WHERE knowledge_id = ?
    `).run(
      updatedType,
      updatedTitle,
      updatedSummary,
      updatedContent,
      targetDeptId,
      targetSubDeptId,
      JSON.stringify(tagArray),
      updatedStatus,
      data.effective_date !== undefined ? data.effective_date : existing.effective_date,
      data.expiry_date !== undefined ? data.expiry_date : existing.expiry_date,
      updatedAi,
      session.user_id,
      now,
      knowledgeId
    );

    // Record version history snapshot
    const currentVersionCount = (db.prepare('SELECT COUNT(*) as c FROM knowledge_version_history WHERE knowledge_id = ?').get(knowledgeId) as any)?.c || 1;
    db.prepare(`
      INSERT INTO knowledge_version_history (
        version_id, knowledge_id, version_no, title_snapshot, summary_snapshot,
        content_snapshot, tags_snapshot, edited_by, edited_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ver-' + crypto.randomUUID(),
      knowledgeId,
      currentVersionCount + 1,
      updatedTitle,
      updatedSummary,
      updatedContent,
      JSON.stringify(tagArray),
      session.user_id,
      now
    );

    if (Array.isArray(data.attachments) && data.attachments.length > 0) {
      db.prepare('DELETE FROM knowledge_attachments WHERE knowledge_id = ?').run(knowledgeId);
      for (const att of data.attachments) {
        db.prepare(`
          INSERT INTO knowledge_attachments (
            attachment_id, knowledge_id, file_name, file_url, file_type, file_size_kb, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          'att-' + crypto.randomUUID(),
          knowledgeId,
          att.file_name || 'attachment.pdf',
          att.file_url || '',
          att.file_type || 'pdf',
          att.file_size_kb || 100,
          now
        );
      }
    }

    db.prepare('DELETE FROM dashboard_summary_cache').run();

    return true;
  }

  /**
   * Delete or archive knowledge item with strict IDOR / departmental boundary checks
   */
  static async deleteOrArchiveKnowledgeItem(
    knowledgeId: string,
    session: SessionUser
  ): Promise<{ action: 'deleted' | 'archived' }> {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;

    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    const isAdmin = session.role === 'administrator';

    // Security Check: Staff can only archive knowledge belonging to their own department
    if (!isAdmin && existing.department_id !== session.department_id) {
      throw new Error('FORBIDDEN_DEPARTMENT');
    }

    if (isAdmin) {
      // Admin performs Hard Delete
      if (isSupabaseConfigured()) {
        try {
          await supabaseAdmin.from('knowledge_attachments').delete().eq('knowledge_id', knowledgeId);
          await supabaseAdmin.from('knowledge_version_history').delete().eq('knowledge_id', knowledgeId);
          await supabaseAdmin.from('knowledge_items').delete().eq('knowledge_id', knowledgeId);
        } catch {}
      }

      db.prepare('DELETE FROM knowledge_attachments WHERE knowledge_id = ?').run(knowledgeId);
      db.prepare('DELETE FROM knowledge_version_history WHERE knowledge_id = ?').run(knowledgeId);
      db.prepare('DELETE FROM knowledge_items WHERE knowledge_id = ?').run(knowledgeId);
      db.prepare('DELETE FROM dashboard_summary_cache').run();

      return { action: 'deleted' };
    } else {
      // Staff performs Soft Delete (Archive)
      const now = new Date().toISOString();
      if (isSupabaseConfigured()) {
        try {
          await supabaseAdmin.from('knowledge_items').update({
            status: 'archived',
            updated_at: now
          }).eq('knowledge_id', knowledgeId);
        } catch {}
      }

      db.prepare("UPDATE knowledge_items SET status = 'archived', updated_at = datetime('now', 'localtime') WHERE knowledge_id = ?").run(knowledgeId);
      db.prepare('DELETE FROM dashboard_summary_cache').run();

      return { action: 'archived' };
    }
  }
}
