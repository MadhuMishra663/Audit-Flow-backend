# Policy Management System - Technical Design Document

## 📐 System Overview

This document provides a comprehensive technical design of the Policy Management module, including entity relationships, data models, API contracts, and system flows.

---

## 1. Entity Relationship Diagram (ERD)


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              POLICY MANAGEMENT SYSTEM                              │
│                                                                                  │
│  ┌───────────────────────┐         ┌───────────────────────┐                     │
│  │       USERS           │         │     POLICIES           │                     │
│  │───────────────────────│         │───────────────────────│                     │
│  │ ● id (PK)             │         │ ● id (PK)             │                     │
│  │ ● name                │         │ ● title                │                     │
│  │ ● email               │         │ ● description          │                     │
│  │ ● role                │         │ ● category             │                     │
│  │ ● company_id (FK)     │         │ ● status               │                     │
│  └───────────┬───────────┘         │ ● owner_id (FK)───────┼─────┐               │
│              │                     │ ● reviewer_id (FK)────┼──┐  │               │
│              │                     │ ● created_by (FK)─────┼──┼──┘               │
│              │                     │ ● created_at           │  │                 │
│              │                     │ ● updated_at           │  │                 │
│              │                     │ ● review_frequency     │  │                 │
│              │                     │ ● is_deleted           │  │                 │
│              │                     └───────────┬───────────┘  │                 │
│              │                             │ │ │             │                 │
│              │                             │ │ │ 1:N          │                 │
│              │                             │ │ └─────────────┘                 │
│              │                             │ │                                 │
│              │                    ┌────────┴─┴─┴────────┐                        │
│              │                    │  POLICY_VERSIONS  │                        │
│              │                    │────────────────────│                        │
│              │                    │ ● id (PK)          │                        │
│              │                    │ ● policy_id (FK)───┼───────────────────────┘
│              │                    │ ● version_number   │
│              │                    │ ● change_log       │
│              │                    │ ● file_id (FK)─────┼───────────────┐
│              │                    │ ● created_by (FK)  │               │
│              │                    │ ● is_current        │               │
│              │                    └────────┬───────────┘               │
│              │                             │                           │
│              │                    ┌────────┴───────────┐               │
│              │                    │   POLICY_FILES     │               │
│              │                    │─────────────────────│               │
│              │                    │ ● id (PK)           │◄──────────────┘
│              │                    │ ● file_name         │
│              │                    │ ● file_path         │
│              │                    │ ● file_size         │
│              │                    │ ● mime_type         │
│              │                    │ ● checksum          │
│              │                    │ ● uploaded_by (FK)──┼───────────────┐
│              │                    └─────────────────────┘               │
│              │                                                         │
│              │         ┌───────────────────────────────────────┐       │
│              │         │         POLICY_APPROVALS              │       │
│              │         │───────────────────────────────────────│       │
│              │         │ ● id (PK)                              │       │
│              │         │ ● policy_id (FK)───────────────────────┼───────┘
│              │         │ ● version_id (FK)                      │
│              │         │ ● approver_id (FK)────────────────────┼───────────────┐
│              │         │ ● status                               │             │
│              │         │ ● comments                             │             │
│              │         │ ● approved_at                          │             │
│              │         └───────────────────────────────────────┘             │
│              │                                                               │
│              │         ┌───────────────────────────────────────┐           │
│              │         │        POLICY_AUDIT_LOGS              │           │
│              │         │───────────────────────────────────────│           │
│              │         │ ● id (PK)                              │           │
│              │         │ ● policy_id (FK)───────────────────────┼───────────┘
│              │         │ ● action                               │
│              │         │ ● performed_by (FK)────────────────────┤
│              │         │ ● old_data (JSONB)                     │
│              │         │ ● new_data (JSONB)                     │
│              │         └───────────────────────────────────────┘
│              │
│              │
│              │         ┌───────────────────────────────────────┐
│              │         │           CONTROLS                     │
│              │         │───────────────────────────────────────│
│              │         │ ● id (PK)                              │
│              │         │ ● framework                            │
│              │         │ ● control_code                         │
│              │         │ ● description                          │
│              │         └───────────────┬───────────────────────┘
│              │                         │
│              │                         │ N:M
│              │         ┌─────────────┴─────────────┐
│              │         │ POLICY_CONTROL_MAPPINGS │
│              │         │────────────────────────────│
│              │         │ ● id (PK)                  │
│              │         │ ● policy_id (FK)───────────┼───────────────────────┐
│              │         │ ● control_id (FK)──────────┼───────────────────────┘
│              │         │ ● created_at               │
│              │         └─────────────────────────────┘
│              │
└──────────────┼──────────────────────────────────────────────────────────────┘
               │
               │ 1:N
               ▼
┌───────────────────────┐
│     DEPARTMENTS       │
│───────────────────────│
│ ● id (PK)             │
│ ● name                │
│ ● company_id (FK)     │
└───────────────────────┘
```

---


## 2. Data Models Specification

### 2.1 Policy Model

```typescript
// src/db/policy/policies.ts


interface Policy {
  // Primary Key
  id: string;                    // UUID v4

  // Core Fields
  title: string;                 // Required, Max 255 chars
  description: string | null;    // Optional, TEXT

  category: Category;             // ENUM
  status: Status;                 // ENUM, Default: DRAFT


  // Relationships
  owner_id: string | null;       // FK → users.id (Policy Owner)
  reviewer_id: string | null;    // FK → users.id (Reviewer)
  created_by: string;            // FK → users.id (Creator)

  // Audit Fields
  created_at: Date;               // Auto-generated
  updated_at: Date;              // Auto-updated via trigger

  // Review Management
  last_review_date: Date | null;  // DATE
  next_review_date: Date | null; // DATE
  review_frequency: string;      // Default: 'ANNUALLY'


  // Soft Delete
  is_deleted: boolean;          // Default: FALSE
}

// ENUMS
type Category = 'SECURITY' | 'PRIVACY' | 'FINANCE' | 'HR' | 'OPERATIONS' | 'IT' | 'COMPLIANCE' | 'OTHER';
type Status = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
```

### 2.2 PolicyVersion Model

```typescript
interface PolicyVersion {
  id: string;                    // UUID v4
  policy_id: string;             // FK → policies.id (CASCADE DELETE)
  version_number: number;        // Auto-increment per policy
  change_log: string | null;      // TEXT - What changed
  file_id: string | null;         // FK → policy_files.id (SET NULL)
  created_by: string;            // FK → users.id
  created_at: Date;
  is_current: boolean;           // Only one TRUE per policy
}
// UNIQUE: (policy_id, version_number)
```


### 2.3 PolicyFile Model

```typescript
interface PolicyFile {
  id: string;                    // UUID v4
  file_name: string;             // Required
  file_path: string;             // Required (URL path)
  file_size: number | null;      // BIGINT (bytes)
  mime_type: string | null;      // e.g., 'application/pdf'
  checksum: string | null;       // SHA-256 hash
  uploaded_by: string;           // FK → users.id
  uploaded_at: Date;
  is_active: boolean;            // Soft delete flag
}
```

### 2.4 PolicyApproval Model

```typescript
interface PolicyApproval {
  id: string;                    // UUID v4
  policy_id: string;             // FK → policies.id (CASCADE DELETE)
  version_id: string | null;     // FK → policy_versions.id (CASCADE DELETE)
  approver_id: string;           // FK → users.id
  status: ApprovalStatus;        // ENUM
  comments: string | null;      // TEXT
  approved_at: Date | null;      // Set when status changes
  created_at: Date;
}

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
```


### 2.5 Control Model

```typescript
interface Control {
  id: string;                    // UUID v4
  framework: Framework;           // ENUM
  control_code: string;          // e.g., 'GDPR-ARTICLE-25'
  description: string | null;
  created_at: Date;
}

type Framework = 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'NIST' | 'OTHER';
// UNIQUE: (framework, control_code)
```

### 2.6 PolicyControlMapping Model

```typescript
interface PolicyControlMapping {
  id: string;                    // UUID v4
  policy_id: string;             // FK → policies.id (CASCADE DELETE)
  control_id: string;           // FK → controls.id (CASCADE DELETE)
  created_at: Date;
}
// UNIQUE: (policy_id, control_id)
```


### 2.7 PolicyAuditLog Model

```typescript
interface PolicyAuditLog {
  id: string;                    // UUID v4
  policy_id: string | null;       // FK → policies.id (SET NULL)
  action: AuditAction;           // ENUM
  performed_by: string;          // FK → users.id
  old_data: any;                 // JSONB (before state)
  new_data: any;                 // JSONB (after state)
  created_at: Date;
}

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'UPLOAD' | 'VERSION';
```


---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│                         (Frontend/App)                                       │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ HTTP/HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  /auth/*    │  │ /policies/* │  │  /risks/*    │  │  /admin/*   │        │
│  └─────────────┘  └──────┬──────┘  └─────────────┘  └─────────────┘        │
└──────────────────────────┼──────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER LAYER                                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  src/modules/policy/                                                    │ │
│  │                                                                           │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │ │
│  │  │  policyController   │  │  versionController  │  │  fileController  │ │ │
│  │  │  ─────────────────   │  │  ─────────────────   │  │  ──────────────  │ │ │
│  │  │  • createPolicy      │  │  • createVersion     │  │  • uploadFile     │ │ │
│  │  │  • getAllPolicies    │  │  • getVersions       │  │  • getFile       │ │ │
│  │  │  • getPolicyById     │  │  • setCurrentVersion │  │  • downloadFile  │ │ │
│  │  │  • updatePolicy     │  │                      │  │  • deleteFile    │ │ │
│  │  │  • deletePolicy     │  │                      │  │                  │ │ │
│  │  │  • archivePolicy    │  │                      │  │                  │ │ │
│  │  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │ │
│  │                                                                           │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │ │
│  │  │  approvalController │  │  controlController  │  │  auditLogCtrl    │ │ │
│  │  │  ──────────────────   │  │  ─────────────────   │  │  ─────────────   │ │ │
│  │  │  • submitForApproval │  │  • createControl     │  │  • getAuditLogs │ │ │
│  │  │  • approvePolicy     │  │  • mapPolicyControl  │  │                  │ │ │
│  │  │  • rejectPolicy      │  │  • getControls      │  │                  │ │ │
│  │  │  • getApprovals      │  │  • getPolicyControls │  │                  │ │ │
│  │  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────┬───────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (PostgreSQL)                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      src/db/policy/                                 │   │
│  │                                                                       │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │   │
│  │  │   policies.ts   │  │policyVersions.ts│  │policyFiles.ts  │         │   │
│  │  │   ──────────    │  │  ──────────     │  │  ──────────    │         │   │
│  │  │   CRUD ops     │  │   CRUD ops     │  │   CRUD ops     │         │   │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘         │   │
│  │          │                  │                  │                   │   │
│  │  ┌────────┴──────────────────┴──────────────────┴────────┐          │   │
│  │  │                    src/config/db.ts                   │          │   │
│  │  │                    (Connection Pool)                  │          │   │
│  │  └──────────────────────────────────────────────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        TABLES                                     │   │
│  │                                                                        │   │
│  │  ┌───────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────────┐    │   │
│  │  │policies  │ │policy_versions│ │policy_files│ │policy_approvals │    │   │
│  │  └───────────┘ └──────────────┘ └────────────┘ └─────────────────┘    │   │
│  │                                                                        │   │
│  │  ┌───────────┐ ┌─────────────────────┐ ┌──────────────────────┐       │   │
│  │  │ controls │ │policy_control_map   │ │policy_audit_logs    │       │   │
│  │  └───────────┘ └─────────────────────┘ └──────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```


---


## 4. Policy Lifecycle State Machine

```
                              ┌─────────────────────────────────────┐
                              │                                     │
                              │         POLICY LIFECYCLE            │
                              │                                     │
                              └─────────────────────────────────────┘
                                             │
                                             ▼
                              ┌───────────────────────────┐
                              │                           │
                              │           DRAFT           │
                              │                           │
                              │  • Initial state          │
                              │  • Can be edited          │
                              │  • Can add versions        │
                              │                           │
                              └─────────────┬─────────────┘
                                            │
                                            │ submitForApproval()
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │                           │
                              │          PENDING         │
                              │                           │
                              │  • Awaiting approval      │
                              │  • Can be rejected       │
                              │  • Cannot be edited       │
                              │                           │
                              └─────────────┬─────────────┘
                                            │
                                ┌─────────────┴─────────────┐
                                │                           │
                    approvePolicy()                   rejectPolicy()
                                │                           │
                                ▼                           ▼
              ┌───────────────────────────┐       ┌───────────────────────────┐
              │                           │       │                           │
              │          ACTIVE           │       │         REJECTED         │
              │                           │       │                           │
              │  • Approved              │       │  • Needs revision        │
              │  • Cannot be edited      │       │  • Can resubmit          │
              │  • Needs periodic review │       │                           │
              │                           │       └───────────────────────────┘
              └─────────────┬─────────────┘
                            │
                            │ archivePolicy()
                            │
                            ▼
              ┌───────────────────────────┐
              │                           │
              │         ARCHIVED          │
              │                           │
              │  • No longer active      │
              │  • Read-only             │
              │  • Cannot be reverted    │
              │                           │
              └───────────────────────────┘
```


---

## 5. Version Management Flow

```
                    VERSION MANAGEMENT WORKFLOW

                    ============================


    Policy Created (v0)
           │
           │ createVersion()
           │
           ▼
    ┌──────────────┐
    │ Version 1.0  │ ◄── is_current = TRUE
    │ (Initial)   │
    └──────┬───────┘
           │
           │ createVersion()
           │ (New update)
           │
           ▼
    ┌──────────────┐     ┌──────────────┐
    │ Version 1.0  │     │ Version 2.0  │
    │ (Previous)   │     │ (Current)    │ ◄── is_current = TRUE
    │              │     │              │
    │ is_current  │     │ is_current  │
    │ = FALSE     │     │ = TRUE      │
    └──────────────┘     └──────────────┘
           │
           │ createVersion()
           │
           ▼
    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
    │ Version 1.0  │     │ Version 2.0  │     │ Version 3.0  │
    │ (Old)        │     │ (Previous)  │     │ (Current)   │
    │              │     │              │     │              │
    │ is_current  │     │ is_current  │     │ is_current  │
    │ = FALSE     │     │ = FALSE     │     │ = TRUE      │
    └──────────────┘     └──────────────┘     └──────────────┘


    ┌──────────────────────────────────────────────────────────────┐
    │                      VERSION RULES                           │
    │                                                               │
    │  • Always creates NEW version (never overwrites)             │
    │  • Previous versions remain in database (audit trail)        │
    │  • Only ONE version can be "current" at a time per policy      │
    │  • Can set any version as current via setCurrentVersion()    │
    │  • Each version can have an optional file attachment          │
    │  • Each version has a change_log describing modifications    │
    └──────────────────────────────────────────────────────────────┘
```


---

## 6. Approval Workflow Sequence

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  USER   │     │  API    │     │ DB      │     │AUDIT LOG│     │POLICY   │
│         │     │         │     │         │     │         │     │         │
│         │     │         │     │         │     │         │     │         │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │              │              │              │              │
     │ 1. Submit    │              │              │              │
     │ for Approval │              │              │              │
     │─────────────►│              │              │              │
     │              │ 2. Create   │              │              │
     │              │ Approval     │              │              │
     │              │─────────────►│              │              │
     │              │              │              │              │
     │              │ 3. Log      │              │              │
     │              │────────────────────────────►│              │
     │              │              │              │              │
     │              │ 4. Response │              │              │
     │◄─────────────│              │              │              │
     │              │              │              │              │
     │              │              │              │              │
     │              │              │              │              │
     │ 5. Approve   │              │              │              │
     │─────────────►│              │              │              │
     │              │ 6. Update   │              │              │
     │              │ Status      │              │              │
     │              │─────────────►│              │              │
     │              │              │              │              │
     │              │ 7. Update   │              │              │
     │              │ Policy      │              │              │
     │              │ Status      │              │              │
     │              │─────────────►│              │              │
     │              │              │              │              │
     │              │ 8. Log      │              │              │
     │              │────────────────────────────►│              │
     │              │              │              │              │
     │              │ 9. Response │              │              │
     │◄─────────────│              │              │              │
     │              │              │              │              │
```

---

## 7. Control Mapping Flow

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      COMPLIANCE MAPPING SYSTEM                              │
│                                                                        │
│  FRAMEWORKS                    CONTROLS                MAPPINGS         │
│  ══════════                    ═════════                ═════════         │
│                                                                        │
│  ┌─────────────┐            ┌─────────────────┐    ┌──────────────────┐ │
│  │   SOC2     │            │ CC6.1           │    │ Policy A ──► GDPR│ │
│  │            │            │ CC6.2           │    │ Policy A ──► SOC2│ │
│  │            │◄───────────│ CC6.3           │    │ Policy B ──► SOC2│ │
│  │            │            │ CC6.4           │    │ Policy B ──► NIST│ │
│  │            │            │ ...             │    │ Policy C ──► GDPR│ │
│  └─────────────┘            └─────────────────┘    │ Policy C ──► SOC2│ │
│  ┌─────────────┐            ┌─────────────────┐    │ ...            │ │
│  │   GDPR     │            │ ARTICLE-25      │    └──────────────────┘ │
│  │            │◄───────────│ ARTICLE-30      │                           │
│  │            │            │ ARTICLE-32      │                           │
│  │            │            │ ARTICLE-35      │    ┌──────────────────┐ │
│  │            │            │ ...             │    │                  │ │
│  └─────────────┘            └─────────────────┘    │  Many-to-Many    │ │
│  ┌─────────────┐            ┌─────────────────┐    │                  │ │
│  │   ISO27001  │            │ A.5.1.1         │    │  1 Policy        │ │
│  │            │◄───────────│ A.5.1.2         │    │  ─────────────── │ │
│  │            │            │ A.6.1.1         │    │  Many Controls   │ │
│  │            │            │ ...             │    │                  │ │
│  └─────────────┘            └─────────────────┘    │  1 Control       │ │
│  ┌─────────────┐            ┌─────────────────┐    │  ─────────────── │ │
│  │   NIST     │            │ ID.AM-1         │    │  Many Policies  │ │
│  │            │◄───────────│ ID.AM-2         │    │                  │ │
│  │            │            │ ID.BE-1         │    └──────────────────┘ │
│  └─────────────┘            └─────────────────┘                          │
│                                                                        │
│                              EXAMPLE MAPPING                            │
│                              ═════════════════                           │
│                                                                        │
│   Policy: "Data Privacy Policy v1"                                     │
│       │                                                                    │
│       ├────────────────────────────► Control: GDPR-ARTICLE-25            │
│       │                                    "Data protection by design"  │
│       │                                                                    │
│       ├────────────────────────────► Control: GDPR-ARTICLE-32            │
│       │                                    "Data breach notification"   │
│       │                                                                    │
│       └────────────────────────────► Control: SOC2-CC6.1                 │
│                                        "Logical access controls"         │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. API Contract Summary


### Policy Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/policies` | Create policy | ADMIN, AUDITOR |
| `GET` | `/policies` | List all policies | All roles |
| `GET` | `/policies/:id` | Get policy details | All roles |
| `PUT` | `/policies/:id` | Update policy | ADMIN, AUDITOR |
| `DELETE` | `/policies/:id` | Soft delete | ADMIN |
| `PATCH` | `/policies/:id/archive` | Archive policy | ADMIN |

### Version Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/policies/:id/versions` | Create version |
| `GET` | `/policies/:id/versions` | List versions |
| `GET` | `/policies/:id/versions/current` | Get current version |
| `PATCH` | `/policies/:id/versions/:versionId/set-current` | Set current |

### File Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/policies/:id/files` | Upload file |
| `GET` | `/policies/:id/files` | List files |
| `GET` | `/policies/files/:fileId/download` | Download file |
| `DELETE` | `/policies/files/:fileId` | Delete file |

### Approval Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/policies/:id/approve` | Submit for approval |
| `GET` | `/policies/:id/approvals` | List approvals |
| `GET` | `/policies/approvals/pending` | Get pending |
| `PATCH` | `/policies/approvals/:approvalId/approve` | Approve |
| `PATCH` | `/policies/approvals/:approvalId/reject` | Reject |

### Control Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/policies/controls` | Create control |
| `GET` | `/policies/controls` | List controls |
| `POST` | `/policies/:id/controls` | Map to policy |
| `DELETE` | `/policies/:id/controls/:controlId` | Unmap |
| `GET` | `/policies/:id/controls` | Get policy controls |
| `GET` | `/policies/controls/:controlId/policies` | Get controls' policies |

### Audit Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/policies/:id/audit-logs` | Get audit logs |

---

## 9. Database Schema Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            PostgreSQL DATABASE                                      │
│                            ══════════════════                                       │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CREATE TABLE policies                                                   │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()          │ │
│  │ title           TEXT NOT NULL                                         │ │
│  │ description     TEXT                                                  │ │
│  │ category        VARCHAR(50) NOT NULL CHECK (...)                       │ │
│  │ status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (...)       │ │
│  │ owner_id        UUID                                                  │ │
│  │ reviewer_id     UUID                                                  │ │
│  │ created_by      UUID NOT NULL                                          │ │
│  │ created_at      TIMESTAMPTZ DEFAULT NOW()                              │ │
│  │ updated_at      TIMESTAMPTZ DEFAULT NOW()                              │ │
│  │ last_review_date DATE                                                  │ │
│  │ next_review_date DATE                                                  │ │
│  │ review_frequency TEXT DEFAULT 'ANNUALLY'                              │ │
│  │ is_deleted      BOOLEAN DEFAULT FALSE                                 │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CREATE TABLE policy_versions                                           │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()           │ │
│  │ policy_id       UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE│ │
│  │ version_number  INT NOT NULL                                           │ │
│  │ change_log      TEXT                                                  │ │
│  │ file_id         UUID REFERENCES policy_files(id) ON DELETE SET NULL    │ │
│  │ created_by      UUID NOT NULL                                         │ │
│  │ created_at      TIMESTAMPTZ DEFAULT NOW()                              │ │
│  │ is_current      BOOLEAN DEFAULT FALSE                                 │ │
│  │ UNIQUE(policy_id, version_number)                                     │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CREATE TABLE policy_files                                              │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()          │ │
│  │ file_name       TEXT NOT NULL                                         │ │
│  │ file_path       TEXT NOT NULL                                        │ │
│  │ file_size       BIGINT                                                │ │
│  │ mime_type       TEXT                                                  │ │
│  │ checksum        TEXT                                                  │ │
│  │ uploaded_by     UUID NOT NULL                                        │ │
│  │ uploaded_at     TIMESTAMPTZ DEFAULT NOW()                             │ │
│  │ is_active       BOOLEAN DEFAULT TRUE                                  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CREATE TABLE controls                                                  │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()          │ │
│  │ framework       VARCHAR(50) NOT NULL CHECK (...)                       │ │
│  │ control_code    TEXT NOT NULL                                        │ │
│  │ description     TEXT                                                  │ │
│  │ created_at      TIMESTAMPTZ DEFAULT NOW()                              │ │
│  │ UNIQUE(framework, control_code)                                      │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CREATE TABLE policy_control_mappings                                   │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()          │ │
│  │ policy_id       UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE│ │
│  │ control_id      UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE│ │
│  │ created_at      TIMESTAMPTZ DEFAULT NOW()                              │ │
│  │ UNIQUE(policy_id, control_id)                                         │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CREATE TABLE policy_approvals                                          │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()          │ │
│  │ policy_id       UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE│ │
│  │ version_id      UUID REFERENCES policy_versions(id) ON DELETE CASCADE │ │
│  │ approver_id     UUID NOT NULL                                          │ │
│  │ status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (...)     │ │
│  │ comments        TEXT                                                  │ │
│  │ approved_at     TIMESTAMPTZ                                            │ │
│  │ created_at      TIMESTAMPTZ DEFAULT NOW()                              │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ CREATE TABLE policy_audit_logs                                        │ │
│  │ ─────────────────────────────────────────────────────────────────────── │ │
│  │ id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()          │ │
│  │ policy_id       UUID REFERENCES policies(id) ON DELETE SET NULL      │ │
│  │ action          VARCHAR(20) NOT NULL CHECK (...)                       │ │
│  │ performed_by    UUID NOT NULL                                        │ │
│  │ old_data        JSONB                                                 │ │
│  │ new_data        JSONB                                                 │ │
│  │ created_at      TIMESTAMPTZ DEFAULT NOW()                             │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Key Design Decisions

### 10.1 Why PostgreSQL?
- **JSONB Support**: For storing old/new data in audit logs
- **UUID Generation**: Built-in `uuid_generate_v4()`
- **Full Text Search**: For policy search functionality
- **Transaction Support**: ACID compliance for complex operations
- **Performance**: Indexing and query optimization

### 10.2 Why Soft Delete?
- **Audit Trail**: Preserves historical data
- **Recovery**: Can implement "undelete" feature
- **Compliance**: Regulations may require data retention

### 10.3 Why Version Pattern?
- **Complete History**: Every change is preserved
- **Rollback Capability**: Can revert to any version
- **Change Tracking**: Change log explains modifications
- **Accountability**: Clear record of who changed what

### 10.4 Why Multiple Tables for Files?
- **Version Control**: Each version can have its own file
- **Metadata**: Track file size, type, checksum
- **Audit Trail**: Know who uploaded what and when


### 10.5 Why Control Mapping Table?
- **Many-to-Many**: One policy, many controls; one control, many policies
- **Flexibility**: Easy to add/remove mappings
- **Reporting**: Query which policies map to which controls


---

## 11. Security Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                   │
│                                                                            │
│  1. AUTHENTICATION                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • JWT Token required for all endpoints                              │   │
│  │ • Token validated via protect middleware                           │   │
│  │ • Cookie-based and Bearer token support                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  2. AUTHORIZATION                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Role-based access control (RBAC)                                 │   │
│  │ • ADMIN: Full access                                              │   │
│  │ • AUDITOR: Create/Update policies                                  │   │
│  │ • DEPARTMENT: Read-only access                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  3. INPUT VALIDATION                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Category enum validation                                        │   │
│  │ • Framework enum validation                                        │   │
│  │ • UUID format validation                                          │   │
│  │ • SQL injection prevention via parameterized queries              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  4. FILE SECURITY                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • File type validation                                            │   │
│  │ • Size limits enforced                                            │   │
│  │ • SHA-256 checksum for integrity                                   │   │
│  │ • Files stored outside web root                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  5. AUDIT LOGGING                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • All actions logged with user ID                                 │   │
│  │ • Old and new data captured                                        │   │
│  │ • Timestamp recorded                                              │   │
│  │ • Immutable audit trail                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INDEX STRATEGY                                        │
│                                                                            │
│  Tables                 Indexes                                              │
│  ═══════                ═════════                                            │
│                                                                            │
│  policies               • idx_policies_status        (status)               │
│                         • idx_policies_category      (category)             │
│                         • idx_policies_owner         (owner_id)             │
│                         • idx_policies_created_by    (created_by)           │
│                                                                            │
│  policy_versions        • idx_policy_versions_policy  (policy_id)          │
│                                                                            │
│  policy_approvals       • idx_policy_approvals_policy (policy_id)           │
│                         • idx_policy_approvals_approver (approver_id)       │
│                                                                            │
│  policy_audit_logs     • idx_policy_audit_logs_policy (policy_id)           │
│                         • idx_policy_audit_logs_action (action)             │
│                                                                            │
│  policy_control_map     • idx_policy_control_map_policy (policy_id)         │
│                         • idx_policy_control_map_control (control_id)        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         QUERY OPTIMIZATION                                   │
│                                                                            │
│  1. Use JOINs instead of subqueries where possible                          │
│  2. Filter early with WHERE clauses                                        │
│  3. Use pagination for large result sets                                   │
│  4. Leverage LATERAL joins for correlated subqueries                       │
│  5. Connection pooling via pg Pool                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. File Structure Summary

```
src/
├── server.ts                         # Entry point + setup initialization
├── routes.ts                        # Main router
│
├── modules/
│   └── policy/
│       ├── routes.ts                # All policy endpoints
│       ├── README.md                # API documentation
│       ├── POSTMAN_GUIDE.md         # Testing guide
│       └── controllers/
│           ├── policyController.ts  # Policy CRUD
│           ├── versionController.ts # Version management
│           ├── fileController.ts    # File operations
│           ├── approvalController.ts# Approval workflow
│           ├── controlController.ts# Control management
│           └── auditLogController.ts# Audit retrieval
│
db/
└── policy/
    ├── ARCHITECTURE.md           # Architecture explanation
    ├── SYSTEM_DESIGN.md            # This document
    ├── index.ts                    # Re-exports
    ├── setup.ts                    # Table creation
    ├── policies.ts                 # Policy DB layer
    ├── policyVersions.ts           # Version DB layer
    ├── policyFiles.ts              # File DB layer
    ├── policyApprovals.ts          # Approval DB layer
    ├── controls.ts                # Control DB layer
    ├── policyControlMappings.ts   # Mapping DB layer
    └── policyAuditLogs.ts         # Audit DB layer
```


---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Policy** | A formal document that defines rules, guidelines, or standards |
| **Version** | A snapshot of a policy at a point in time |
| **Control** | A safeguard or countermeasure to reduce risk |
| **Framework** | A set of standards or guidelines (SOC2, GDPR, etc.) |
| **Approval** | A formal sign-off process by an authorized person |
| **Audit Log** | A record of all actions performed on a policy |
| **Owner** | The person responsible for maintaining a policy |
| **Reviewer** | The person responsible for reviewing a policy |
| **Soft Delete** | Marking a record as deleted without removing it |
| **Checksum** | A hash value used to verify file integrity |


---

## 15. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-15 | System | Initial design document |
