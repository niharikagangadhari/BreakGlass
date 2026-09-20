/**
 * Permission checks and role definitions for Break Glass
 */

export const ROLES = {
  USER: 'user',
  OPERATOR: 'operator',
  ADMIN: 'admin',
};

export function isOperatorOrAdmin(role) {
  return role === ROLES.OPERATOR || role === ROLES.ADMIN;
}

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

export function canApproveRequests(role) {
  return isOperatorOrAdmin(role);
}

export function canRejectRequests(role) {
  return isOperatorOrAdmin(role);
}

export function canRevokeAnySession(role) {
  return isOperatorOrAdmin(role);
}

export function canViewAllAuditLogs(role) {
  return isOperatorOrAdmin(role);
}

export function getRoleDisplayName(role) {
  switch (role) {
    case ROLES.ADMIN:
      return 'System Administrator';
    case ROLES.OPERATOR:
      return 'Security Operator';
    case ROLES.USER:
    default:
      return 'Authorized User';
  }
}

export function getRoleBadgeColor(role) {
  switch (role) {
    case ROLES.ADMIN:
      return 'bg-purple-900/60 text-purple-200 border-purple-700/50';
    case ROLES.OPERATOR:
      return 'bg-blue-900/60 text-blue-200 border-blue-700/50';
    case ROLES.USER:
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}
