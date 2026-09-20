import { supabase, isConfigured } from './supabase.js';
import { getOfflineDB } from './mockData.js';
import { authService } from './auth.js';

export const auditService = {
  /**
   * Fetch audit logs with filtering and role boundaries
   */
  async getAuditLogs(filters = {}) {
    if (isConfigured) {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          protected_resources (name, sensitivity_level),
          profiles:audit_logs_user_id_fkey (full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.resource_id) {
        query = query.eq('resource_id', filters.resource_id);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(log => ({
        ...log,
        resource_name: log.protected_resources?.name || '—',
        user_name: log.profiles?.full_name || 'System / Service'
      }));
    } else {
      const currentUserSession = await authService.getCurrentUser();
      const db = getOfflineDB();
      const isElevated = ['operator', 'admin'].includes(currentUserSession?.profile?.role);

      let logs = [...db.audit_logs];

      // RLS simulation: Regular users only see their own logs
      if (!isElevated) {
        logs = logs.filter(l => l.user_id === currentUserSession?.user?.id);
      }

      if (filters.action) {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.resource_id) {
        logs = logs.filter(l => l.resource_id === filters.resource_id);
      }
      if (filters.user_id) {
        logs = logs.filter(l => l.user_id === filters.user_id);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        logs = logs.filter(l => 
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.resource_name && l.resource_name.toLowerCase().includes(q)) ||
          (l.user_email && l.user_email.toLowerCase().includes(q)) ||
          (l.user_name && l.user_name.toLowerCase().includes(q))
        );
      }

      return logs;
    }
  }
};
