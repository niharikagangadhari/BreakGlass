import { supabase, isConfigured } from './supabase.js';
import { getOfflineDB, saveOfflineDB } from './mockData.js';
import { authService } from './auth.js';
import { calculateRelevance } from './relevanceEngine.js';

const id = (prefix) => `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

function addAudit(db, { actor, action, request, details = {} }) {
  db.audit_logs.unshift({
    id: id('audit'),
    user_id: actor?.id || request?.user_id || null,
    user_email: actor?.email || request?.user_email || null,
    action,
    resource_id: request?.resource_id || null,
    resource_name: request?.resource_name || null,
    emergency_request_id: request?.id || null,
    details,
    created_at: new Date().toISOString()
  });
}

export const emergencyAccessService = {
  async getResources() {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('protected_resources')
        .select('*')
        .eq('break_glass_enabled', true)
        .order('sensitivity_level', { ascending: false });

      if (error) throw error;

      return data || [];
    }

    return getOfflineDB()
      .resources
      .filter(resource => resource.break_glass_enabled === true);
  },
  async getAllProtectedResources() {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('protected_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    }

    const currentUserSession = await authService.getCurrentUser();

    if (!['admin', 'operator'].includes(currentUserSession?.profile?.role)) {
      throw new Error(
        'Not authorized: Only administrators and operators can manage protected documents.'
      );
    }

    return getOfflineDB().resources;
  },

  async createProtectedResource(resource) {
    const currentUserSession = await authService.getCurrentUser();

    if (!['admin', 'operator'].includes(currentUserSession?.profile?.role)) {
      throw new Error(
        'Not authorized: Only administrators and operators can create protected documents.'
      );
    }

    if (!resource?.name?.trim()) {
      throw new Error('Document name is required.');
    }

    if (isConfigured) {
      const { data, error } = await supabase
        .from('protected_resources')
        .insert({
          name: resource.name.trim(),
          description: resource.description?.trim() || '',
          sensitivity_level: resource.sensitivity_level || 'high',
          break_glass_enabled: Boolean(resource.break_glass_enabled),
          storage_path: resource.storage_path?.trim() || null,
          document_type: resource.document_type || 'PDF'
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    }

    const db = getOfflineDB();

    const newResource = {
      id: id('resource'),
      name: resource.name.trim(),
      description: resource.description?.trim() || '',
      sensitivity_level: resource.sensitivity_level || 'high',
      break_glass_enabled: Boolean(resource.break_glass_enabled),
      storage_path: resource.storage_path?.trim() || '',
      document_type: resource.document_type || 'PDF',
      created_at: new Date().toISOString()
    };

    db.resources.unshift(newResource);

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'PROTECTED_RESOURCE_CREATED',
      request: newResource,
      details: {
        break_glass_enabled: newResource.break_glass_enabled
      }
    });

    saveOfflineDB(db);

    return newResource;
  },

  async updateProtectedResource(resourceId, updates) {
    const currentUserSession = await authService.getCurrentUser();

    if (!['admin', 'operator'].includes(currentUserSession?.profile?.role)) {
      throw new Error(
        'Not authorized: Only administrators and operators can update protected documents.'
      );
    }

    if (isConfigured) {
      const { data, error } = await supabase
        .from('protected_resources')
        .update({
          name: updates.name?.trim(),
          description: updates.description?.trim() || '',
          sensitivity_level: updates.sensitivity_level || 'high',
          break_glass_enabled: Boolean(updates.break_glass_enabled),
          storage_path: updates.storage_path?.trim() || null,
          document_type: updates.document_type || 'PDF'
        })
        .eq('id', resourceId)
        .select()
        .single();

      if (error) throw error;

      return data;
    }

    const db = getOfflineDB();

    const resource = db.resources.find(
      item => item.id === resourceId
    );

    if (!resource) {
      throw new Error('Protected document not found.');
    }

    Object.assign(resource, {
      name: updates.name?.trim() || resource.name,
      description: updates.description?.trim() || '',
      sensitivity_level:
        updates.sensitivity_level || resource.sensitivity_level,
      break_glass_enabled:
        Boolean(updates.break_glass_enabled),
      storage_path:
        updates.storage_path?.trim() || '',
      document_type:
        updates.document_type || resource.document_type
    });

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'PROTECTED_RESOURCE_UPDATED',
      request: resource,
      details: {
        break_glass_enabled: resource.break_glass_enabled
      }
    });

    saveOfflineDB(db);

    return resource;
  },

  async setBreakGlassEligibility(resourceId, enabled) {
    const currentUserSession = await authService.getCurrentUser();

    if (!['admin', 'operator'].includes(currentUserSession?.profile?.role)) {
      throw new Error(
        'Not authorized: Only administrators and operators can change document eligibility.'
      );
    }

    if (isConfigured) {
      const { data, error } = await supabase
        .from('protected_resources')
        .update({
          break_glass_enabled: Boolean(enabled)
        })
        .eq('id', resourceId)
        .select()
        .single();

      if (error) throw error;

      return data;
    }

    const db = getOfflineDB();

    const resource = db.resources.find(
      item => item.id === resourceId
    );

    if (!resource) {
      throw new Error('Protected document not found.');
    }

    resource.break_glass_enabled = Boolean(enabled);

    addAudit(db, {
      actor: currentUserSession.user,
      action: enabled
        ? 'BREAK_GLASS_RESOURCE_ENABLED'
        : 'BREAK_GLASS_RESOURCE_DISABLED',
      request: resource,
      details: {
        break_glass_enabled: Boolean(enabled)
      }
    });

    saveOfflineDB(db);

    return resource;
  },

  async deleteProtectedResource(resourceId) {
    const currentUserSession = await authService.getCurrentUser();

    if (!['admin', 'operator'].includes(currentUserSession?.profile?.role)) {
      throw new Error(
        'Not authorized: Only administrators and operators can delete protected documents.'
      );
    }

    if (isConfigured) {
      const { error } = await supabase
        .from('protected_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      return {
        success: true,
        resource_id: resourceId
      };
    }

    const db = getOfflineDB();

    const index = db.resources.findIndex(
      item => item.id === resourceId
    );

    if (index === -1) {
      throw new Error('Protected document not found.');
    }

    const [removed] = db.resources.splice(index, 1);

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'PROTECTED_RESOURCE_DELETED',
      request: removed,
      details: {}
    });

    saveOfflineDB(db);

    return {
      success: true,
      resource_id: resourceId
    };
  },


  /**
   * Create an emergency request. In offline mode the relevance check happens
   * locally before the request is queued for an operator/admin.
   */
  async requestEmergencyAccess({ resourceId, incidentName, incidentDescription, justification, durationMinutes }) {
    if (!resourceId) throw new Error('Protected document is required.');
    if (!incidentName || incidentName.trim().length < 3) throw new Error('Incident Name is required.');
    if (!incidentDescription || incidentDescription.trim().length < 10) {
      throw new Error('Incident description must be at least 10 characters long.');
    }
    if (!justification || justification.trim().length < 10) {
      throw new Error('Justification must be at least 10 characters long.');
    }
    if (![5, 15, 30, 60].includes(Number(durationMinutes))) {
      throw new Error('Requested duration must be 5, 15, 30, or 60 minutes.');
    }

    if (isConfigured) {
      // The Supabase RPC/schema will be upgraded in Phase 2. Keeping this
      // explicit prevents the new request shape from silently calling the old RPC.
      throw new Error('Online backend schema is not yet upgraded for incident-aware document authorization. Use offline mode for this build.');
    }

    const currentUserSession = await authService.getCurrentUser();
    if (!currentUserSession?.user) throw new Error('Authentication required.');

    const db = getOfflineDB();
    const resource = db.resources.find(r => r.id === resourceId);
    if (!resource) throw new Error('Invalid protected document.');

    const relevance = calculateRelevance({
      incidentDescription: incidentDescription.trim(),
      justification: justification.trim(),
      document: resource
    });

    const requestId = id('req');
    const now = new Date().toISOString();
    const autoRejected = false;

    const newRequest = {
      id: requestId,
      user_id: currentUserSession.user.id,
      user_email: currentUserSession.user.email,
      user_name: currentUserSession.user.full_name,
      resource_id: resourceId,
      resource_name: resource.name,
      sensitivity_level: resource.sensitivity_level,
      incident_name: incidentName.trim(),
      incident_description: incidentDescription.trim(),
      justification: justification.trim(),
      relevance_score: relevance.score,
      relevance_threshold: relevance.threshold,
      relevance_decision: relevance.decision,
      matched_keywords: relevance.matchedKeywords,
      requested_duration: Number(durationMinutes),
      status: 'pending',
      rejection_reason: null,
      requested_at: now,
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      expires_at: null,
      revoked_at: null,
      revoked_by: null
    };

    db.requests.unshift(newRequest);

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'EMERGENCY_ACCESS_REQUESTED',
      request: newRequest,
      details: {
        incident_name: newRequest.incident_name,
        relevance_score: relevance.score,
        matched_keywords: relevance.matchedKeywords,
        reason: newRequest.rejection_reason || 'Relevant request queued for administrative review.'
      }
    });

    if (!autoRejected) {
      // Offline notification queue: the admin/operator dashboard consumes this.
      db.notifications.unshift({
        id: id('notification'),
        recipient_roles: ['operator', 'admin'],
        request_id: requestId,
        type: 'EMERGENCY_REQUEST',
        title: 'New Emergency Access Request',
        message: `${currentUserSession.user.full_name} requested ${resource.name} for ${newRequest.incident_name}.`,
        is_read: false,
        created_at: now
      });
    }

    saveOfflineDB(db);
    return {
      requestId,
      status: newRequest.status,
      relevance
    };
  },

  async getRequests() {
    await this.expireEmergencyAccess();

    if (isConfigured) {
      const { data, error } = await supabase
        .from('emergency_requests')
        .select(`*, protected_resources (id, name, sensitivity_level, description), user_profile:profiles!emergency_requests_user_id_fkey (full_name)`)
        .order('requested_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        resource_name: r.protected_resources?.name || 'Unknown Document',
        sensitivity_level: r.protected_resources?.sensitivity_level || 'high',
        user_name: r.user_profile?.full_name || 'Authorized User'
      }));
    }

    const currentUserSession = await authService.getCurrentUser();
    const db = getOfflineDB();
    if (['operator', 'admin'].includes(currentUserSession?.profile?.role)) return db.requests;
    return db.requests.filter(r => r.user_id === currentUserSession?.user?.id);
  },

  async approveEmergencyAccess(requestId) {
    if (isConfigured) {
      const { data, error } = await supabase.rpc('approve_emergency_access', { p_request_id: requestId });
      if (error) throw error;
      return data;
    }

    const currentUserSession = await authService.getCurrentUser();
    if (!['operator', 'admin'].includes(currentUserSession?.profile?.role)) {
      throw new Error('Not authorized: Only operators and administrators can approve emergency requests.');
    }

    const db = getOfflineDB();
    const req = db.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Emergency request not found.');
    if (req.status !== 'pending') throw new Error(`Request cannot be approved because status is ${req.status}.`);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + req.requested_duration * 60000).toISOString();
    req.status = 'approved';
    req.approved_at = now.toISOString();
    req.approved_by = currentUserSession.user.id;
    req.expires_at = expiresAt;

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'EMERGENCY_ACCESS_APPROVED',
      request: req,
      details: { target_user_id: req.user_id, duration_minutes: req.requested_duration, expires_at: expiresAt }
    });

    saveOfflineDB(db);
    return { request_id: requestId, status: 'approved', expires_at: expiresAt };
  },

  async rejectEmergencyAccess(requestId, reason) {
    if (!reason || reason.trim().length < 3) throw new Error('A valid rejection reason is required.');

    if (isConfigured) {
      const { data, error } = await supabase.rpc('reject_emergency_access', { p_request_id: requestId, p_reason: reason.trim() });
      if (error) throw error;
      return data;
    }

    const currentUserSession = await authService.getCurrentUser();
    if (!['operator', 'admin'].includes(currentUserSession?.profile?.role)) {
      throw new Error('Not authorized: Only operators and administrators can reject emergency requests.');
    }

    const db = getOfflineDB();
    const req = db.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Emergency request not found.');
    if (req.status !== 'pending') throw new Error(`Request cannot be rejected because status is ${req.status}.`);

    const now = new Date();
    req.status = 'rejected';
    req.rejected_at = now.toISOString();
    req.rejected_by = currentUserSession.user.id;
    req.rejection_reason = reason.trim();

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'EMERGENCY_ACCESS_REJECTED',
      request: req,
      details: { target_user_id: req.user_id, reason: reason.trim() }
    });

    saveOfflineDB(db);
    return { request_id: requestId, status: 'rejected' };
  },

  async revokeEmergencyAccess(requestId) {
    if (isConfigured) {
      const { data, error } = await supabase.rpc('revoke_emergency_access', { p_request_id: requestId });
      if (error) throw error;
      return data;
    }

    const currentUserSession = await authService.getCurrentUser();
    if (!currentUserSession?.user) throw new Error('Authentication required.');

    const db = getOfflineDB();
    const req = db.requests.find(r => r.id === requestId);
    if (!req) throw new Error('Emergency request not found.');
    if (req.status !== 'approved') throw new Error(`Cannot revoke session with status ${req.status}.`);

    const isElevated = ['operator', 'admin'].includes(currentUserSession.profile?.role);
    const isOwner = req.user_id === currentUserSession.user.id;
    if (!isElevated && !isOwner) throw new Error('Not authorized: You can only revoke your own active session.');

    const now = new Date();
    req.status = 'revoked';
    req.revoked_at = now.toISOString();
    req.revoked_by = currentUserSession.user.id;

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'EMERGENCY_ACCESS_REVOKED',
      request: req,
      details: { target_user_id: req.user_id, revoked_by_role: currentUserSession.profile?.role }
    });

    saveOfflineDB(db);
    return { request_id: requestId, status: 'revoked' };
  },

  async expireEmergencyAccess() {
    if (isConfigured) {
      try {
        const { data, error } = await supabase.rpc('expire_emergency_access');
        if (error) console.warn('Supabase expire_emergency_access error:', error);
        return data || 0;
      } catch (err) {
        console.warn('Error running expire_emergency_access RPC:', err);
        return 0;
      }
    }

    const db = getOfflineDB();
    const now = new Date();
    let expiredCount = 0;
    db.requests.forEach(req => {
      if (req.status === 'approved' && req.expires_at && new Date(req.expires_at) <= now) {
        req.status = 'expired';
        expiredCount++;
        addAudit(db, {
          actor: { id: req.user_id, email: req.user_email },
          action: 'EMERGENCY_ACCESS_EXPIRED',
          request: req,
          details: { expired_at: now.toISOString(), duration_minutes: req.requested_duration }
        });
      }
    });
    if (expiredCount > 0) saveOfflineDB(db);
    return expiredCount;
  },

  async getActiveSessions() {
    const all = await this.getRequests();
    const now = Date.now();

    return all.filter(
      r =>
        r.status === 'approved' &&
        r.expires_at &&
        new Date(r.expires_at).getTime() > now
    );
  },

  async getAuthorizedDocument(requestId) {
    await this.expireEmergencyAccess();

    const currentUserSession = await authService.getCurrentUser();

    if (!currentUserSession?.user) {
      throw new Error('Authentication required.');
    }

    const db = getOfflineDB();

    const request = db.requests.find(
      r => r.id === requestId
    );

    if (!request) {
      throw new Error('Emergency request not found.');
    }

    // User can only access their own request
    if (request.user_id !== currentUserSession.user.id) {
      throw new Error(
        'Not authorized to access this document.'
      );
    }

    // Request must currently be approved
    if (request.status !== 'approved') {
      throw new Error(
        `Document access is not available. Request status: ${request.status}.`
      );
    }

    // Check expiration
    if (
      !request.expires_at ||
      new Date(request.expires_at) <= new Date()
    ) {
      throw new Error(
        'Emergency document access has expired.'
      );
    }

    // Find the actual protected document
    const resource = db.resources.find(
      r => r.id === request.resource_id
    );

    if (!resource) {
      throw new Error(
        'Protected document not found.'
      );
    }

    addAudit(db, {
      actor: currentUserSession.user,
      action: 'PROTECTED_DOCUMENT_ACCESSED',
      request,
      details: {
        document_name: resource.name,
        accessed_at: new Date().toISOString(),
        expires_at: request.expires_at
      }
    });

    saveOfflineDB(db);

    return {
      request,
      resource
    };
  },

  async getNotifications() {
    const current = await authService.getCurrentUser();
    if (!current) return [];
    const db = getOfflineDB();
    const role = current.profile?.role;
    return db.notifications.filter(n => n.recipient_roles?.includes(role));
  },

  async markNotificationRead(notificationId) {
    const db = getOfflineDB();
    const notification = db.notifications.find(n => n.id === notificationId);
    if (notification) notification.is_read = true;
    saveOfflineDB(db);
  }
};
