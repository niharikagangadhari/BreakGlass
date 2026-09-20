import { useState, useEffect, useCallback } from 'react';
import { emergencyAccessService } from '../services/emergencyAccess';

export function useEmergencyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setError(null);
      const data = await emergencyAccessService.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch emergency requests:', err);
      setError(err.message || 'Failed to load emergency requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    // Auto-poll and sync expired sessions every 10 seconds
    const interval = setInterval(() => {
      fetchRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchRequests]);

  const now = new Date().getTime();
  const activeSessions = requests.filter(
    (r) => r.status === 'approved' && r.expires_at && new Date(r.expires_at).getTime() > now
  );
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const pastRequests = requests.filter(
    (r) => r.status !== 'pending' && !(r.status === 'approved' && r.expires_at && new Date(r.expires_at).getTime() > now)
  );

  return {
    requests,
    activeSessions,
    pendingRequests,
    pastRequests,
    loading,
    error,
    refresh: fetchRequests,
  };
}
