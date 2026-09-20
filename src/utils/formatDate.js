/**
 * Format ISO date string into human-readable enterprise audit format.
 * Example: 2026-09-19 12:45:00 UTC
 */
export function formatAuditDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return '—';
  }
}

/**
 * Format relative time (e.g., '10 minutes ago', 'just now')
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 30) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return '—';
  }
}

/**
 * Format duration minutes into readable label
 */
export function formatDuration(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${hours} hr${hours > 1 ? 's' : ''}`;
}

/**
 * Calculate remaining seconds until expires_at
 */
export function getRemainingSeconds(expiresAt) {
  if (!expiresAt) return 0;
  const now = new Date().getTime();
  const target = new Date(expiresAt).getTime();
  return Math.max(0, Math.floor((target - now) / 1000));
}

/**
 * Format countdown seconds as MM:SS or HH:MM:SS
 */
export function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
