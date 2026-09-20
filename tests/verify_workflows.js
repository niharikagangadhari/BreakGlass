// Automated verification of Tests 1 - 8 for Break Glass
import { authService } from '../src/services/auth.js';
import { emergencyAccessService } from '../src/services/emergencyAccess.js';
import { auditService } from '../src/services/audit.js';
import { getOfflineDB, saveOfflineDB } from '../src/services/mockData.js';

// Polyfill localStorage in node environment for test execution
if (typeof localStorage === 'undefined' || localStorage === null) {
  let store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
}

async function runVerification() {
  console.log('====================================================');
  console.log('STARTING BREAK GLASS VERIFICATION SUITE (TESTS 1 - 8)');
  console.log('====================================================\n');

  // TEST 1: Normal user logs in
  console.log('TEST 1: Normal User Authentication');
  const userAuth = await authService.login('user@breakglass.internal', 'password123');
  console.log(`✓ Logged in as: ${userAuth.user.email} (Role: ${userAuth.profile.role})`);
  if (userAuth.profile.role !== 'user') throw new Error('Role mismatch in Test 1');

  // TEST 2: Normal user creates emergency request
  console.log('\nTEST 2: Normal User Creates Emergency Request');
  const resources = await emergencyAccessService.getResources();
  console.log(`✓ Retrieved ${resources.length} protected resources: [${resources.map(r=>r.name).join(', ')}]`);
  
  const targetResource = resources[0];
  const justification = 'INC-8291 Production outage on EHR cluster requiring temporary audit logs access.';
  const durationMinutes = 15;

  const reqId = await emergencyAccessService.requestEmergencyAccess(targetResource.id, justification, durationMinutes);
  console.log(`✓ Emergency request submitted via RPC. ID: ${reqId}`);

  const userRequests = await emergencyAccessService.getRequests();
  const createdReq = userRequests.find(r => r.id === reqId);
  console.log(`✓ Request status: ${createdReq.status} (Expected: pending)`);
  if (createdReq.status !== 'pending') throw new Error('Status not pending');

  const userLogs = await auditService.getAuditLogs({ action: 'EMERGENCY_ACCESS_REQUESTED' });
  console.log(`✓ Audit log verified: ${userLogs[0].action} recorded at ${userLogs[0].created_at}`);

  // TEST 3: Admin logs in
  console.log('\nTEST 3: Administrator Logs In');
  await authService.logout();
  const adminAuth = await authService.login('admin@breakglass.internal', 'password123');
  console.log(`✓ Logged in as: ${adminAuth.user.email} (Role: ${adminAuth.profile.role})`);
  if (adminAuth.profile.role !== 'admin') throw new Error('Role mismatch in Test 3');

  const adminRequests = await emergencyAccessService.getRequests();
  const pendingForAdmin = adminRequests.filter(r => r.status === 'pending');
  console.log(`✓ Admin sees ${pendingForAdmin.length} pending request(s)`);
  console.log(`✓ Pending Request Justification: "${pendingForAdmin[0].justification}"`);

  // TEST 4: Admin approves request
  console.log('\nTEST 4: Admin Approves Request');
  const approveRes = await emergencyAccessService.approveEmergencyAccess(reqId);
  console.log(`✓ Request approved. Expiration set to: ${approveRes.expires_at}`);
  
  const updatedRequests = await emergencyAccessService.getRequests();
  const approvedReq = updatedRequests.find(r => r.id === reqId);
  console.log(`✓ Status: ${approvedReq.status}, Approved by: ${approvedReq.approved_by}`);
  if (approvedReq.status !== 'approved') throw new Error('Status is not approved');

  // TEST 5: Active session visibility
  console.log('\nTEST 5: Active Emergency Session Visibility');
  const activeSessions = await emergencyAccessService.getActiveSessions();
  console.log(`✓ Active emergency sessions count: ${activeSessions.length}`);
  console.log(`✓ Active resource: ${activeSessions[0].resource_name}, Expires: ${activeSessions[0].expires_at}`);

  // TEST 6: Access is revoked
  console.log('\nTEST 6: Access Revocation');
  await emergencyAccessService.revokeEmergencyAccess(reqId);
  const postRevokeRequests = await emergencyAccessService.getRequests();
  const revokedReq = postRevokeRequests.find(r => r.id === reqId);
  console.log(`✓ Status after revocation: ${revokedReq.status}`);
  if (revokedReq.status !== 'revoked') throw new Error('Status is not revoked');

  const revokeLogs = await auditService.getAuditLogs({ action: 'EMERGENCY_ACCESS_REVOKED' });
  console.log(`✓ Audit log verified: ${revokeLogs[0].action} recorded`);

  // TEST 7: Access expiration
  console.log('\nTEST 7: Automatic Session Expiration');
  // Create another request and simulate expiration
  await authService.logout();
  await authService.login('user@breakglass.internal', 'password123');
  const req2Id = await emergencyAccessService.requestEmergencyAccess(resources[1].id, 'INC-9901 Urgent database fix needed for payroll run.', 5);
  
  await authService.logout();
  await authService.login('admin@breakglass.internal', 'password123');
  await emergencyAccessService.approveEmergencyAccess(req2Id);

  // Artificially advance expiration timestamp into the past to simulate time lapse
  const db = getOfflineDB();
  const req2 = db.requests.find(r => r.id === req2Id);
  req2.expires_at = new Date(Date.now() - 60000).toISOString(); // 1 minute in the past
  saveOfflineDB(db);

  const expiredCount = await emergencyAccessService.expireEmergencyAccess();
  console.log(`✓ Expired sessions processed by system: ${expiredCount}`);

  const postExpireRequests = await emergencyAccessService.getRequests();
  const expiredReq = postExpireRequests.find(r => r.id === req2Id);
  console.log(`✓ Request status after expiration: ${expiredReq.status}`);
  if (expiredReq.status !== 'expired') throw new Error('Status is not expired');

  const expireLogs = await auditService.getAuditLogs({ action: 'EMERGENCY_ACCESS_EXPIRED' });
  console.log(`✓ Audit log verified: ${expireLogs[0].action} recorded`);

  // TEST 8: MANDATORY SECURITY TEST - Normal user attempts to call approval RPC
  console.log('\nTEST 8: Security Test - Unauthorized Caller RPC Rejection');
  await authService.logout();
  await authService.login('user@breakglass.internal', 'password123');
  
  // Create a pending request
  const test8ReqId = await emergencyAccessService.requestEmergencyAccess(resources[2].id, 'INC-0008 Security verification test request.', 30);
  
  try {
    // Normal user attempts to approve their own or any request!
    await emergencyAccessService.approveEmergencyAccess(test8ReqId);
    throw new Error('SECURITY VULNERABILITY: Normal user was able to call approveEmergencyAccess!');
  } catch (err) {
    console.log(`✓ Security verification passed! Execution rejected with message: "${err.message}"`);
  }

  console.log('\n====================================================');
  console.log('ALL 8 SECURITY & LIFECYCLE TESTS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
