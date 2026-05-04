# Policy Management Module

## Overview
Complete GRC (Governance, Risk, and Compliance) Policy Management system with versioning, approvals, and compliance controls.

## SQL Schema
Run the schema from `sql/schema.sql` first.

## API Endpoints

### Policies
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/policies` | Create new policy |
| GET | `/api/policies` | Get all policies |
| GET | `/api/policies/:id` | Get policy by ID |
| PUT | `/api/policies/:id` | Update policy |
| DELETE | `/api/policies/:id` | Soft delete policy |
| PATCH | `/api/policies/:id/archive` | Archive policy |

### Versions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/policies/:id/versions` | Create new version |
| GET | `/api/policies/:id/versions` | Get all versions |
| GET | `/api/policies/:id/versions/current` | Get current version |
| PATCH | `/api/policies/:id/versions/:versionId/set-current` | Set current version |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/policies/:id/files` | Upload file |
| GET | `/api/policies/:id/files` | Get all files |
| GET | `/api/policies/files/:fileId` | Get file info |
| GET | `/api/policies/files/:fileId/download` | Download file |
| DELETE | `/api/policies/files/:fileId` | Delete file |

### Approvals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/policies/:id/approve` | Submit for approval |
| GET | `/api/policies/:id/approvals` | Get approvals |
| PATCH | `/api/policies/approvals/:approvalId/approve` | Approve policy |
| PATCH | `/api/policies/approvals/:approvalId/reject` | Reject policy |
| GET | `/api/policies/approvals/pending` | Get pending approvals |

### Controls
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/policies/controls` | Create control |
| GET | `/api/policies/controls` | Get all controls |
| GET | `/api/policies/controls/:controlId` | Get control by ID |
| POST | `/api/policies/:id/controls` | Map policy to control |
| DELETE | `/api/policies/:id/controls/:controlId` | Unmap control |
| GET | `/api/policies/:id/controls` | Get policy controls |
| GET | `/api/policies/controls/:controlId/policies` | Get policies by control |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/policies/:id/audit-logs` | Get audit logs |

## Request/Response Examples

### Create Policy
```json
POST /api/policies
{
  "title": "Data Privacy Policy",
  "description": "Policy for handling customer data",
  "category": "PRIVACY",
  "owner_id": "uuid",
  "reviewer_id": "uuid",
  "review_frequency": "ANNUALLY"
}
```

### Submit for Approval
```json
POST /api/policies/:id/approve
{
  "approver_id": "uuid",
  "version_id": "uuid",
  "comments": "Please review this policy"
}
```

### Map Control to Policy
```json
POST /api/policies/:id/controls
{
  "control_id": "uuid"
}
```

## Categories
- SECURITY, PRIVACY, FINANCE, HR, OPERATIONS, IT, COMPLIANCE, OTHER

## Frameworks
- SOC2, ISO27001, GDPR, HIPAA, PCI-DSS, NIST, OTHER


## Policy Statuses
- DRAFT, ACTIVE, ARCHIVED

## Approval Statuses
- PENDING, APPROVED, REJECTED

## Audit Actions
- CREATE, UPDATE, DELETE, APPROVE, REJECT, UPLOAD, VERSION
