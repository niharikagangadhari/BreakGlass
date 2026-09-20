# 🔐 Break Glass

> **Emergency access to protected organizational documents — controlled, temporary, auditable, and offline-first.**

Break Glass is an offline-first emergency document access system designed for situations where authorized personnel need temporary access to sensitive organizational documents during critical incidents.

Instead of giving users permanent access to protected resources, the system follows a controlled **request → review → approval → temporary access → automatic expiration** workflow.

---

## 🚨 Problem Statement

During emergencies such as infrastructure failures, security incidents, network outages, or disaster recovery situations, authorized personnel may need access to sensitive documents that are normally restricted.

Traditional access-control systems can create two problems:

- Permanent access may expose sensitive information unnecessarily.
- Emergency access may be difficult to obtain quickly when normal processes are unavailable.

**Break Glass** addresses this by providing a controlled emergency access mechanism where access is granted only after administrative approval and automatically expires after a specified period.

---

## 💡 Solution

Break Glass provides a secure emergency-access workflow:

```text
User
  │
  ▼
Submit Emergency Request
  │
  │ Incident Name
  │ Incident Description
  │ Protected Document
  │ Justification
  │ Access Duration
  ▼
Admin Review
  │
  ├───────────────┐
  ▼               ▼
Approve          Reject
  │
  ▼
Temporary Access
  │
  ▼
Protected Document
  │
  ▼
Automatic Expiration
  │
  ▼
Access Locked
  │
  ▼
Audit Trail

Every emergency access request is reviewed by an administrator. Relevance analysis can provide supporting information, but it does not automatically reject requests.

✨ Key Features
👤 User Authentication
Offline authentication support
Role-based access
User and administrator accounts
Persistent local session
Logout functionality
Demo Accounts
Role	Email	Password
Administrator	admin@breakglass.internal	password123
Security Operator	operator@breakglass.internal	password123
User	user@breakglass.internal	password123

These credentials are for the local development/demo environment only.

🚨 Emergency Access Requests

Users can submit an emergency access request containing:

Incident Name
Incident Description
Protected Document
Justification
Requested Access Duration

Supported durations:

5 minutes
15 minutes
30 minutes
60 minutes
👨‍💼 Administrator Review

Administrators can review pending emergency requests and:

View incident details
View requesting user
View requested document
Review justification
Approve requests
Reject requests with a reason

Administrators do not use the normal user-facing emergency request workflow.

📄 Protected Documents

Administrators can manage protected resources and control whether a document is eligible for Break Glass access.

Documents can be:

Added
Updated
Enabled for emergency access
Disabled from emergency access
Deleted
Searched and managed from the administrative interface

Only documents enabled for Break Glass access are available to users when submitting an emergency request.

⏱️ Temporary Access

Approved emergency requests create a temporary access session.

The system records:

Approved At
Approved By
Expiration Time
Requested Duration

Access is automatically considered expired when the expiration time is reached.

The expiration timestamp is treated as the authoritative source rather than relying only on the frontend countdown.

🔒 Automatic Document Locking

When an emergency access session expires:

Active Session
      ↓
Expiration
      ↓
Document Locked
      ↓
Access Denied

The user can no longer open the protected document through the expired session.

📋 Audit Trail

Important security actions are recorded in the audit trail, including events such as:

Emergency access requested
Emergency access approved
Emergency access rejected
Protected document accessed
Emergency access revoked
Emergency access expired
System initialization

This provides traceability for emergency document access.

📴 Offline-First Architecture

One of the main goals of Break Glass is to keep the core workflow functional without an internet connection.

The current offline architecture uses local browser storage:

React Application
       │
       ▼
Service Layer
       │
       ▼
Offline Database
       │
       ▼
LocalStorage

The offline database contains:

Users
Resources
Emergency Requests
Notifications
Audit Logs

This allows the core prototype to operate without requiring an active Supabase connection.

🌐 Progressive Web App

Break Glass is designed with Progressive Web App (PWA) support in mind.

The PWA approach is intended to provide:

Installability
Standalone application experience
Offline application availability
Cached application resources
Desktop and mobile accessibility

PWA functionality and real document-file storage can be extended as later development phases.

🏗️ Technology Stack
Frontend
React
JavaScript
Vite
React Router
Lucide React
Authentication & Data
Offline local authentication
LocalStorage-based offline database
Supabase integration architecture
Planned / Extendable
IndexedDB for larger offline document storage
PWA service worker
Real document upload
Secure remote document storage
Production deployment
📁 Project Structure
src/
│
├── components/
│   ├── Sidebar.jsx
│   ├── SessionCard.jsx
│   └── ...
│
├── hooks/
│   ├── useAuth.js
│   ├── useEmergencyRequests.js
│   └── ...
│
├── pages/
│   ├── Dashboard.jsx
│   ├── EmergencyAccess.jsx
│   ├── ActiveSessions.jsx
│   ├── AdminDashboard.jsx
│   ├── ProtectedDocuments.jsx
│   └── ...
│
├── services/
│   ├── auth.js
│   ├── emergencyAccess.js
│   ├── mockData.js
│   └── supabase.js
│
├── utils/
│   ├── permissions.js
│   └── ...
│
└── App.jsx
🔐 Access Control Model

Break Glass uses role-based access control.

User

Can:

Submit emergency requests
View their requests
View their active emergency sessions
Access documents only through approved requests
View relevant audit information
Operator

Can:

Review emergency requests
Approve requests
Reject requests
Revoke emergency access
Manage protected resources where permitted
Administrator

Can:

Review emergency requests
Approve/reject requests
Manage protected documents
Manage users
View audit information
Manage administrative functions

Administrators do not submit normal emergency access requests.

🛡️ Security Workflow

A document cannot simply be opened because it exists in the local resource database.

The emergency-access workflow verifies:

Is the user authenticated?
        ↓
Does the request exist?
        ↓
Does the request belong to the user?
        ↓
Is the request approved?
        ↓
Has the request expired?
        ↓
Does the protected resource exist?
        ↓
       YES
        ↓
Grant document access

If any authorization requirement fails, document access is denied.

🧪 Testing the Offline Workflow

To test the complete system:

1. Start the development server
npm install
npm run dev
2. Login as a normal user
Email: user@breakglass.internal
Password: password123
3. Submit an emergency request

Provide:

Incident Name
Incident Description
Protected Document
Justification
Access Duration
4. Logout
5. Login as administrator
Email: admin@breakglass.internal
Password: password123
6. Open the Admin Console

Review the pending emergency request.

7. Approve the request
8. Login as the user again

Open:

Active Sessions
9. Open the authorized document
10. Wait for expiration

Verify that the document becomes locked after the session expires.

📴 Testing Without Internet

The core prototype can be tested without an active internet connection.

Recommended test:

1. Start the application
2. Confirm the offline application loads
3. Disconnect the internet
4. Login
5. Submit an emergency request
6. Login as administrator
7. Approve the request
8. Login as the user
9. Open the approved document
10. Verify expiration
11. Check the audit trail
⚙️ Environment Configuration

Supabase configuration can be supplied through environment variables when remote functionality is enabled.

Example:

VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

For the offline prototype, Supabase configuration is not required.

Never commit real secrets or private credentials to a public repository.

🚧 Current Development Status
Implemented
 Offline authentication
 Role-based access
 Emergency access requests
 Incident details
 Protected resource selection
 Administrative request review
 Request approval
 Request rejection
 Temporary access duration
 Access expiration
 Document access authorization
 Document expiration lock
 Audit logging
 Offline local database
 Protected document management
Planned
 Actual document file upload
 IndexedDB-based document storage
 PWA service worker
 Installable application
 Secure production document storage
 Production deployment
 Enhanced encryption and device security
🔮 Future Scope

Future versions of Break Glass can include:

Encrypted offline document storage
Hardware/device-based authentication
Multi-factor authentication
Digital signatures for approvals
Multi-level emergency authorization
Real organizational document repositories
Secure cloud synchronization
Detailed security analytics
Tamper-resistant audit logs
PWA installation and background synchronization
Enterprise identity-provider integration
🎯 Project Goals

Break Glass aims to provide a balance between:

Security
   +
Emergency Availability
   +
Accountability

The system ensures that sensitive documents remain restricted during normal operation while providing a controlled mechanism for authorized emergency access when required.

👩‍💻 Development

This project is currently being developed as an offline-first emergency access prototype.

The development strategy is:

Offline Core
     ↓
Security & Authorization
     ↓
Document File Storage
     ↓
PWA
     ↓
Production Backend
     ↓
Deployment