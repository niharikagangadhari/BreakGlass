/**
 * Standalone offline database simulation for Break Glass.
 * Phase 1 keeps the storage adapter simple; IndexedDB can replace this
 * adapter later without changing the application workflow.
 */

const STORAGE_KEY = 'breakglass_offline_db_v2';

const INITIAL_RESOURCES = [
  {
    id: 'doc-001',
    name: 'Database Recovery Procedure',
    description: 'Production database recovery, backup restoration, failover and rollback procedures.',
    category: 'Infrastructure',
    sensitivity_level: 'critical',
    emergency_only: true,
    keywords: ['database', 'recovery', 'backup', 'restore', 'failover', 'server', 'production'],
    document_content: 'CONFIDENTIAL\nDatabase Recovery Procedure\n\n1. Verify database service state.\n2. Identify the latest verified backup.\n3. Follow the approved restoration and failover procedure.\n4. Record all recovery actions in the incident log.',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'doc-002',
    name: 'Network Incident Response SOP',
    description: 'Procedures for network outages, routing failures, firewall incidents and connectivity restoration.',
    category: 'Security',
    sensitivity_level: 'high',
    emergency_only: true,
    keywords: ['network', 'incident', 'firewall', 'routing', 'connectivity', 'outage', 'security'],
    document_content: 'CONFIDENTIAL\nNetwork Incident Response SOP\n\nFollow the approved network isolation, diagnosis and restoration sequence.',
    created_at: new Date(Date.now() - 86400000 * 28).toISOString()
  },
  {
    id: 'doc-003',
    name: 'Disaster Recovery Plan',
    description: 'Business continuity and disaster recovery procedures for major service disruptions.',
    category: 'Continuity',
    sensitivity_level: 'critical',
    emergency_only: true,
    keywords: ['disaster', 'recovery', 'continuity', 'backup', 'outage', 'failover', 'critical'],
    document_content: 'CONFIDENTIAL\nDisaster Recovery Plan\n\nActivate the appropriate recovery tier and coordinate service restoration.',
    created_at: new Date(Date.now() - 86400000 * 25).toISOString()
  },
  {
    id: 'doc-004',
    name: 'Employee Holiday Calendar',
    description: 'Internal employee holiday and leave calendar. Not an incident-response document.',
    category: 'HR',
    sensitivity_level: 'high',
    emergency_only: true,
    keywords: ['employee', 'holiday', 'leave', 'hr', 'calendar'],
    document_content: 'CONFIDENTIAL\nEmployee Holiday Calendar\n\nInternal HR calendar.',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    id: 'doc-005',
    name: 'Emergency Contact Directory',
    description: 'Authorized emergency contacts for infrastructure, security and operations teams.',
    category: 'Operations',
    sensitivity_level: 'high',
    emergency_only: true,
    keywords: ['emergency', 'contact', 'security', 'operations', 'infrastructure', 'on-call'],
    document_content: 'CONFIDENTIAL\nEmergency Contact Directory\n\nUse only for authorized emergency escalation.',
    created_at: new Date(Date.now() - 86400000 * 18).toISOString()
  }
];

const INITIAL_USERS = [
  { id: 'usr-admin-01', email: 'admin@breakglass.internal', password: 'password123', full_name: 'Dr. Sarah Connor (Admin)', role: 'admin', created_at: new Date(Date.now() - 86400000 * 60).toISOString() },
  { id: 'usr-operator-01', email: 'operator@breakglass.internal', password: 'password123', full_name: 'Alex Vance (Security Operator)', role: 'operator', created_at: new Date(Date.now() - 86400000 * 45).toISOString() },
  { id: 'usr-user-01', email: 'user@breakglass.internal', password: 'password123', full_name: 'David Lightman (On-Call Engineer)', role: 'user', created_at: new Date(Date.now() - 86400000 * 20).toISOString() }
];

function createInitialDB() {
  return {
    users: INITIAL_USERS,
    resources: INITIAL_RESOURCES,
    requests: [],
    notifications: [],
    audit_logs: [{
      id: 'audit-init-01',
      user_id: 'usr-admin-01',
      action: 'SYSTEM_BOOTSTRAP',
      resource_id: null,
      emergency_request_id: null,
      details: { message: 'Offline security policies, protected documents and access matrix loaded.' },
      created_at: new Date(Date.now() - 86400000 * 5).toISOString()
    }]
  };
}

export function getOfflineDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const db = JSON.parse(raw);
      db.notifications ||= [];
      return db;
    } catch {
      // Recreate below.
    }
  }

  const initial = createInitialDB();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveOfflineDB(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetOfflineDB() {
  localStorage.removeItem(STORAGE_KEY);
  return getOfflineDB();
}
