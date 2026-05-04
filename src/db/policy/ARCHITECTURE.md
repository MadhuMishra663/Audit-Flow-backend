# Policy Management Module - Architecture Documentation

## Overview
The Policy Management module is a complete GRC (Governance, Risk, and Compliance) system built with PostgreSQL. It supports policy lifecycle management, versioning, approval workflows, file attachments, and compliance control mapping.

---

## Directory Structure

```
src/
├── modules/
│   └── policy/
│       ├── routes.ts                    # All API route definitions
│       ├── README.md                    # API documentation
│       └── controllers/
│           ├── policyController.ts      # Policy CRUD operations
│           ├── versionController.ts     # Version management
│           ├── fileController.ts         # File upload/download
│           ├── approvalController.ts    # Approval workflow
│           ├── controlController.ts     # Control mapping
│           └── auditLogController.ts   # Audit logging
│
db/
├── policy/
│   ├── index.ts                        # Module exports
│   ├── setup.ts                       # Table initialization
│   ├── policies.ts                     # Policy DB operations
│   ├── policyVersions.ts               # Version DB operations
│   ├── policyFiles.ts                  # File DB operations
│   ├── policyApprovals.ts              # Approval DB operations
│   ├── policyControlMappings.ts       # Control mapping DB operations
│   ├── controls.ts                     # Control DB operations
│   └── policyAuditLogs.ts              # Audit log DB operations
```

---

## Database Tables

### 1. `policies`
**Purpose:** Stores high-level policy metadata

```typescript
interface Policy {
  id: string;
  title: string;
  description: string | null;
  category: 'SECURITY' | 'PRIVACY' | 'FINANCE' | 'HR' | 'OPERATIONS' | 'IT' | 'COMPLIANCE' | 'OTHER';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  owner_id: string | null;
  reviewer_id: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  last_review_date: Date | null;
  next_review_date: Date | null;
  review_frequency: string;
  is_deleted: boolean;
}
```

**File:** `src/db/policy/policies.ts`

---

### 2. `policy_versions`
**Purpose:** Tracks version history of each policy

```typescript
interface PolicyVersion {
  id: string;
  policy_id: string;  // FK → policies.id
  version_number: number;
  change_log: string | null;
  file_id: string | null;  // FK → policy_files.id
  created_by: string;
  created_at: Date;
  is_current: boolean;
}
```

**File:** `src/db/policy/policyVersions.ts`

**Relationship:** Each policy can have multiple versions, one version can have one file.


---

### 3. `policy_files`
**Purpose:** Stores uploaded policy documents

```typescript
interface PolicyFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  checksum: string | null;
  uploaded_by: string;
  uploaded_at: Date;
  is_active: boolean;
}
```

**File:** `src/db/policy/policyFiles.ts`


---

### 4. `policy_approvals`
**Purpose:** Supports multi-step approval workflows

```typescript
interface PolicyApproval {
  id: string;
  policy_id: string;  // FK → policies.id
  version_id: string | null;  // FK → policy_versions.id
  approver_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments: string | null;
  approved_at: Date | null;
  created_at: Date;
}
```

**File:** `src/db/policy/policyApprovals.ts`

---


### 5. `controls`
**Purpose:** Stores compliance controls

```typescript
interface Control {
  id: string;
  framework: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'NIST' | 'OTHER';
  control_code: string;
  description: string | null;
  created_at: Date;
}
```

**File:** `src/db/policy/controls.ts`


---

### 6. `policy_control_mappings`
**Purpose:** Many-to-many relationship between policies and controls

```typescript
interface PolicyControlMapping {
  id: string;
  policy_id: string;  // FK → policies.id
  control_id: string;  // FK → controls.id
  created_at: Date;
}
```

**File:** `src/db/policy/policyControlMappings.ts`


---


### 7. `policy_audit_logs`
**Purpose:** Tracks all actions on policies

```typescript
interface PolicyAuditLog {
  id: string;
  policy_id: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'UPLOAD' | 'VERSION';
  performed_by: string;
  old_data: any;  // JSONB
  new_data: any;  // JSONB
  created_at: Date;
}
```

**File:** `src/db/policy/policyAuditLogs.ts`

---


## Entity Relationships

```
┌─────────────────┐
│    policies      │
│                 │
│  1 policy        │
│  ─────────────── │
│  Many versions   │◄───────────────────┐
│  Many approvals │                    │
│  Many audit logs│                    │
│  Many controls  │                    │
└─────────────────┘                    │
           │                           │
           │ 1:N                      │ 1:N
           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│ policy_versions │         │ policy_approvals│
│                 │         │                 │
│  1 version      │         │  Many approvals │
│  ─────────────  │         └─────────────────┘
│  1 file         │
└────────┬────────┘                    │
         │ 1:1                               │
         ▼                                   │
┌─────────────────┐                          │
│ policy_files    │                          │
│                 │                          │
└─────────────────┘                          │
                                               │
┌─────────────────┐                          │
│    controls     │◄──────────────────────────┘
│                 │
│  Many controls  │
└─────────────────┘
         │
         │ M:N
         ▼
┌─────────────────────────┐
│ policy_control_mappings │
│                         │
└─────────────────────────┘
```

---

## How the Files Connect

### 1. Server Startup Flow
```
src/server.ts
    │
    ├── connectDB()              → src/config/db.ts
    │
    └── createPolicyTables()    → src/db/policy/setup.ts
                                    │
                                    └── Creates all 7 tables + indexes + triggers
```

### 2. API Request Flow
```
Client Request
    │
    ▼
src/routes.ts
    │
    ▼
src/modules/policy/routes.ts
    │
    ▼
┌────────────────────────────────────┐
│  Controllers                        │
│                                      │
│  policyController.ts  ◄─────────────┼──── User creates/updates/deletes policy
│  │                                   │
│  versionController.ts ◄────────────┼──── User creates new version
│  │                                   │
│  fileController.ts ◄──────────────┼──── User uploads file
│  │                                   │
│  approvalController.ts ◄───────────┼──── User submits for approval
│  │                                   │
│  controlController.ts ◄────────────┼──── User maps controls
│  │                                   │
│  auditLogController.ts ◄───────────┼──── Audit log entries
└────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────┐
│  Database Layer (src/db/policy/)    │
│                                      │
│  policies.ts              ◄─────────┼──── CRUD for policies table
│  policyVersions.ts       ◄─────────┼──── CRUD for policy_versions table
│  policyFiles.ts           ◄─────────┼──── CRUD for policy_files table
│  policyApprovals.ts       ◄─────────┼──── CRUD for policy_approvals table
│  controls.ts              ◄─────────┼──── CRUD for controls table
│  policyControlMappings.ts ◄─────────┼──── CRUD for policy_control_mappings table
│  policyAuditLogs.ts       ◄─────────┼──── CRUD for policy_audit_logs table
└────────────────────────────────────┘
    │
    ▼
src/config/db.ts  (PostgreSQL Pool)
```

---

## Controller to DB Mapping

| Controller | Uses DB File | Table |
|------------|-------------|-------|
| `policyController.ts` | `policies.ts` | `policies` |
| `policyController.ts` | `policyAuditLogs.ts` | `policy_audit_logs` |
| `versionController.ts` | `policyVersions.ts` | `policy_versions` |
| `versionController.ts` | `policyAuditLogs.ts` | `policy_audit_logs` |
| `fileController.ts` | `policyFiles.ts` | `policy_files` |
| `fileController.ts` | `policyAuditLogs.ts` | `policy_audit_logs` |
| `approvalController.ts` | `policyApprovals.ts` | `policy_approvals` |
| `approvalController.ts` | `policies.ts` | `policies` |
| `approvalController.ts` | `policyAuditLogs.ts` | `policy_audit_logs` |
| `controlController.ts` | `controls.ts` | `controls` |
| `controlController.ts` | `policyControlMappings.ts` | `policy_control_mappings` |

---


## Complete API Flow Example

### Example: Create and Approve a Policy

```
1. ADMIN creates a new policy
   POST /api/policies
   {
     "title": "Data Privacy Policy",
     "category": "PRIVACY"
   }
   
   Flow:
   policyController.ts::createPolicy()
       │
       ├── policies.ts::createPolicy()     → INSERT into policies
       │
       └── policyAuditLogs.ts::createAuditLog()  → INSERT into policy_audit_logs (action: CREATE)


2. AUDITOR creates a new version
   POST /api/policies/:id/versions
   {
     "change_log": "Initial draft"
   }
   
   Flow:
   versionController.ts::createVersion()
       │
       ├── policyVersions.ts::createVersion()
       │    └── INSERT into policy_versions (auto-sets is_current=TRUE)
       │
       └── policyAuditLogs.ts::createAuditLog()  → INSERT (action: VERSION)



3. USER uploads file for version
   POST /api/policies/:id/files (multipart/form-data with file)
   
   Flow:
   fileController.ts::uploadPolicyFile()
       │
       ├── policyFiles.ts::createPolicyFile()
       │    └── INSERT into policy_files
       │
       └── policyAuditLogs.ts::createAuditLog()  → INSERT (action: UPLOAD)


4. ADMIN submits for approval
   POST /api/policies/:id/approve
   {
     "approver_id": "admin-uuid"
   }
   
   Flow:
   approvalController.ts::submitForApproval()
       │
       ├── policyApprovals.ts::createApproval()
       │    └── INSERT into policy_approvals (status: PENDING)
       │
       └── policyAuditLogs.ts::createAuditLog()  → INSERT (action: UPDATE)



5. ADMIN approves the policy
   PATCH /api/policies/approvals/:approvalId/approve
   {
     "comments": "Approved!"
   }
   
   Flow:
   approvalController.ts::approvePolicy()
       │
       ├── policyApprovals.ts::approvePolicy()
       │    └── UPDATE policy_approvals (status: APPROVED)
       │
       ├── policies.ts::updatePolicy()
       │    └── UPDATE policies (status: ACTIVE)
       │
       └── policyAuditLogs.ts::createAuditLog()  → INSERT (action: APPROVE)
```


---

## Key Design Decisions

### 1. Soft Delete for Policies
- `is_deleted: boolean` flag instead of actual deletion
- Allows audit trail preservation
- Enables potential "undelete" functionality


### 2. Version Management
- New versions automatically set `is_current = FALSE` on previous versions
- Only one version can be current at a time
- Change log captures what changed between versions

### 3. File Handling
- Files stored in `uploads/` folder
- SHA-256 checksum for integrity verification
- Soft delete for files (`is_active` flag)


### 4. Approval Workflow
- One pending approval at a time per policy
- Status transitions: PENDING → APPROVED/REJECTED
- Policy auto-activates on approval

### 5. Control Mapping
- Many-to-many relationship
- Same control can map to multiple policies
- Same policy can have multiple controls

### 6. Audit Logging
- Captures `old_data` and `new_data` as JSONB
- Tracks all CRUD operations
- Used for compliance and accountability

---

## Setup Flow

```
Server Starts (src/server.ts)
    │
    ▼
connectDB()                    → Verifies PostgreSQL connection
    │
    ▼
createPolicyTables()         → src/db/policy/setup.ts
    │
    ├── CREATE policies table
    ├── CREATE policy_versions table
    ├── CREATE policy_files table
    ├── CREATE policy_approvals table
    ├── CREATE controls table
    ├── CREATE policy_control_mappings table
    ├── CREATE policy_audit_logs table
    ├── CREATE indexes
    └── CREATE update trigger
    │
    ▼
App starts listening on PORT
```

---

## Summary

| File | Purpose |
|------|---------|
| `setup.ts` | Creates all tables on server startup |
| `policies.ts` | Core policy CRUD operations |
| `policyVersions.ts` | Version management |
| `policyFiles.ts` | File storage and retrieval |
| `policyApprovals.ts` | Approval workflow logic |
| `controls.ts` | Compliance controls management |
| `policyControlMappings.ts` | Policy-Control mapping |
| `policyAuditLogs.ts` | Audit trail management |
| `index.ts` | Re-exports all DB functions |

All controllers use the DB layer, which directly interacts with PostgreSQL via the `pool` from `src/config/db.ts`.
