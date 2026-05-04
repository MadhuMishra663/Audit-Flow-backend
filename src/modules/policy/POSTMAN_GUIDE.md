# Postman Testing Guide - Policy Management API

## 📋 Prerequisites

### 1. Start the Server
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 2. Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication Setup

### Step 1: Login to Get Token

**Request:**
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN"
    }
  }
}
```

### Step 2: Setup Environment Variables in Postman

Create a Postman environment with:

| Variable | Initial Value | Current Value |
|----------|--------------|---------------|
| `baseUrl` | `http://localhost:5000/api` | `http://localhost:5000/api` |
| `token` | `your-token-here` | (copy from login response) |
| `userId` | `user-uuid-here` | (copy from login response) |

### Step 3: Add Authorization Header

For ALL requests, add:
```
Authorization: Bearer {{token}}
Cookie: token={{token}}
```

---


## 📝 Complete API Testing Workflow

### ============================================
### 1. CREATE A POLICY
### ============================================

**Request:**
```
POST {{baseUrl}}/policies
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Data Privacy Policy v1",
  "description": "This policy outlines how we handle customer data, ensuring GDPR compliance and data protection standards.",
  "category": "PRIVACY",
  "owner_id": "{{userId}}",
  "reviewer_id": "{{userId}}",
  "review_frequency": "ANNUALLY",
  "last_review_date": "2024-01-15",
  "next_review_date": "2025-01-15"
}
```


**Response:**
```json
{
  "success": true,
  "policy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Data Privacy Policy v1",
    "description": "This policy outlines...",
    "category": "PRIVACY",
    "status": "DRAFT",
    "owner_id": "uuid-here",
    "reviewer_id": "uuid-here",
    "created_by": "uuid-here",
    "created_at": "2024-01-15T10:30:00.000Z",
    "review_frequency": "ANNUALLY"
  }
}
```


**Copy the `policy.id` for next steps:**
```
{{policyId}} = 550e8400-e29b-41d4-a716-446655440000
```

---


### 2. GET ALL POLICIES (with Filters)

**Request:**
```
GET {{baseUrl}}/policies
Authorization: Bearer {{token}}
```


**With Filters:**
```
GET {{baseUrl}}/policies?status=DRAFT&category=PRIVACY&search=Data
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "policies": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Data Privacy Policy v1",
      "status": "DRAFT",
      "category": "PRIVACY",
      "owner_name": "John Doe",
      "current_version": null
    }
  ]
}
```


---

### 3. GET SINGLE POLICY WITH ALL DETAILS

**Request:**
```
GET {{baseUrl}}/policies/{{policyId}}
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "policy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Data Privacy Policy v1",
    "description": "This policy outlines...",
    "category": "PRIVACY",
    "status": "DRAFT",
    "owner_name": "John Doe",
    "reviewer_name": "John Doe",
    "created_by_name": "John Doe",
    "versions": [],
    "controls": [],
    "approvals": []
  }
}
```


---


### 4. CREATE A CONTROL

**Request:**
```
POST {{baseUrl}}/policies/controls
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "framework": "GDPR",
  "control_code": "GDPR-ARTICLE-25",
  "description": "Data protection by design and by default"
}
```


**Response:**
```json
{
  "success": true,
  "control": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "framework": "GDPR",
    "control_code": "GDPR-ARTICLE-25",
    "description": "Data protection by design and by default"
  }
}
```


**Copy:**
```
{{controlId}} = 660e8400-e29b-41d4-a716-446655440001
```

---

### 5. CREATE ANOTHER CONTROL (SOC2)


**Request:**
```
POST {{baseUrl}}/policies/controls
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "framework": "SOC2",
  "control_code": "CC6.1",
  "description": "Logical and physical access controls"
}
```


---


### 6. MAP CONTROL TO POLICY

**Request:**
```
POST {{baseUrl}}/policies/{{policyId}}/controls
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "control_id": "{{controlId}}"
}
```

**Response:**
```json
{
  "success": true,
  "mapping": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "policy_id": "550e8400-e29b-41d4-a716-446655440000",
    "control_id": "660e8400-e29b-41d4-a716-446655440001"
  }
}
```


---


### 7. GET POLICY CONTROLS

**Request:**
```
GET {{baseUrl}}/policies/{{policyId}}/controls
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "controls": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "framework": "GDPR",
      "control_code": "GDPR-ARTICLE-25"
    }
  ]
}
```


---

### 8. UPLOAD FILE FOR POLICY

**Request:**
```
POST {{baseUrl}}/policies/{{policyId}}/files
Authorization: Bearer {{token}}
Content-Type: multipart/form-data

Key: file (type: File)
Value: [Select any PDF, DOCX, or TXT file]
```


**Response:**
```json
{
  "success": true,
  "file": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "file_name": "privacy-policy-draft.pdf",
    "file_path": "/uploads/1234567890-privacy-policy-draft.pdf",
    "file_size": 245678,
    "mime_type": "application/pdf",
    "checksum": "a1b2c3d4e5f6..."
  }
}
```


**Copy:**
```
{{fileId}} = 880e8400-e29b-41d4-a716-446655440003
```


---

### 9. CREATE POLICY VERSION

**Request:**
```
POST {{baseUrl}}/policies/{{policyId}}/versions
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "change_log": "Initial draft with GDPR compliance requirements",
  "file_id": "{{fileId}}"
}
```

**Response:**
```json
{
  "success": true,
  "version": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "policy_id": "550e8400-e29b-41d4-a716-446655440000",
    "version_number": 1,
    "change_log": "Initial draft with GDPR compliance requirements",
    "file_id": "880e8400-e29b-41d4-a716-446655440003",
    "is_current": true
  }
}
```


**Copy:**
```
{{versionId}} = 990e8400-e29b-41d4-a716-446655440004
```


---


### 10. GET ALL VERSIONS

**Request:**
```
GET {{baseUrl}}/policies/{{policyId}}/versions
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "versions": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "version_number": 1,
      "change_log": "Initial draft with GDPR compliance requirements",
      "is_current": true,
      "file_name": "privacy-policy-draft.pdf"
    }
  ]
}
```

---

### 11. GET CURRENT VERSION

**Request:**
```
GET {{baseUrl}}/policies/{{policyId}}/versions/current
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "version": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "version_number": 1,
    "is_current": true,
    "file_name": "privacy-policy-draft.pdf"
  }
}
```


---

### 12. SUBMIT FOR APPROVAL

**Request:**
```
POST {{baseUrl}}/policies/{{policyId}}/approve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "approver_id": "{{userId}}",
  "version_id": "{{versionId}}",
  "comments": "Please review this policy for compliance with GDPR Article 25"
}
```

**Response:**
```json
{
  "success": true,
  "approval": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "policy_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING",
    "comments": "Please review this policy..."
  }
}
```

**Copy:**
```
{{approvalId}} = aa0e8400-e29b-41d4-a716-446655440005
```

---


### 13. GET PENDING APPROVALS (For Approvers)


**Request:**
```
GET {{baseUrl}}/policies/approvals/pending
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "approvals": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "policy_id": "550e8400-e29b-41d4-a716-446655440000",
      "policy_title": "Data Privacy Policy v1",
      "status": "PENDING"
    }
  ]
}
```


---


### 14. APPROVE POLICY

**Request:**
```
PATCH {{baseUrl}}/policies/approvals/{{approvalId}}/approve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "comments": "Approved! Policy meets GDPR requirements."
}
```


**Response:**
```json
{
  "success": true,
  "approval": {
    "id": "aa0e8400-e29b-41d4-a716-446655440005",
    "status": "APPROVED",
    "approved_at": "2024-01-15T11:00:00.000Z"
  }
}
```


**Note:** After approval, policy status changes from DRAFT to ACTIVE


---

### 15. UPDATE POLICY (After Approval)

**Request:**
```
PUT {{baseUrl}}/policies/{{policyId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "description": "Updated description with more details about data retention.",
  "review_frequency": "BIANNUALLY"
}
```

---

### 16. CREATE NEW VERSION (After Update)

**Request:**
```
POST {{baseUrl}}/policies/{{policyId}}/versions
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "change_log": "Updated data retention section, added bi-annual review frequency"
}
```

**Response:**
```json
{
  "success": true,
  "version": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "version_number": 2,
    "is_current": true
  }
}
```

---


### 17. REJECT POLICY (Example)


**Submit for rejection first:**
```
POST {{baseUrl}}/policies/{{policyId}}/approve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "approver_id": "{{userId}}",
  "comments": "Please review before rejection"
}
```

**Then reject:**
```
PATCH {{baseUrl}}/policies/approvals/{{newApprovalId}}/reject
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "comments": "Rejection reason: Missing data retention period"
}
```

---


### 18. GET AUDIT LOGS


**Request:**
```
GET {{baseUrl}}/policies/{{policyId}}/audit-logs
Authorization: Bearer {{token}}
```

**With Filters:**
```
GET {{baseUrl}}/policies/{{policyId}}/audit-logs?action=UPDATE&limit=10
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "audit_logs": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "action": "UPDATE",
      "performed_by_name": "John Doe",
      "old_data": {"description": "old value"},
      "new_data": {"description": "new value"},
      "created_at": "2024-01-15T11:30:00.000Z"
    },
    {
      "action": "APPROVE",
      "performed_by_name": "Jane Smith",
      "created_at": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---


### 19. GET ALL CONTROLS


**Request:**
```
GET {{baseUrl}}/policies/controls
Authorization: Bearer {{token}}
```


**With Framework Filter:**
```
GET {{baseUrl}}/policies/controls?framework=SOC2
Authorization: Bearer {{token}}
```


---

### 20. GET POLICIES BY CONTROL

**Request:**
```
GET {{baseUrl}}/policies/controls/{{controlId}}/policies
Authorization: Bearer {{token}}
```


---

### 21. ARCHIVE POLICY

**Request:**
```
PATCH {{baseUrl}}/policies/{{policyId}}/archive
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "policy": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "ARCHIVED"
  }
}
```


---

### 22. DELETE POLICY (Soft Delete)

**Request:**
```
DELETE {{baseUrl}}/policies/{{policyId}}
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "success": true,
  "message": "Policy deleted successfully"
}
```


---

## 🔄 Complete Workflow Summary


```
1. CREATE POLICY
   POST /policies
       │
       ▼
2. ADD CONTROLS
   POST /policies/:id/controls
   POST /policies/controls (create control first)
       │
       ▼
3. UPLOAD FILE
   POST /policies/:id/files
       │
       ▼
4. CREATE VERSION
   POST /policies/:id/versions
       │
       ▼
5. SUBMIT FOR APPROVAL
   POST /policies/:id/approve
       │
       ▼
6. APPROVE/REJECT
   PATCH /approvals/:id/approve
   PATCH /approvals/:id/reject
       │
       ▼
7. VIEW AUDIT LOGS
   GET /policies/:id/audit-logs
```

---

## 📊 Category & Framework Options

### Policy Categories
| Value | Description |
|-------|-------------|
| `SECURITY` | Security policies |
| `PRIVACY` | Privacy/GDPR policies |
| `FINANCE` | Financial policies |
| `HR` | Human Resources policies |
| `OPERATIONS` | Operational policies |
| `IT` | IT policies |
| `COMPLIANCE` | Compliance policies |
| `OTHER` | Other policies |


### Policy Statuses
| Value | Description |
|-------|-------------|
| `DRAFT` | Initial state |
| `ACTIVE` | After approval |
| `ARCHIVED` | Archived policies |

### Compliance Frameworks
| Value | Description |
|-------|-------------|
| `SOC2` | SOC 2 Type II |
| `ISO27001` | ISO/IEC 27001 |
| `GDPR` | General Data Protection Regulation |
| `HIPAA` | Health Insurance Portability and Accountability Act |
| `PCI-DSS` | Payment Card Industry Data Security Standard |
| `NIST` | NIST Cybersecurity Framework |
| `OTHER` | Other frameworks |


### Audit Actions
| Value | Description |
|-------|-------------|
| `CREATE` | Policy created |
| `UPDATE` | Policy updated |
| `DELETE` | Policy deleted |
| `APPROVE` | Policy approved |
| `REJECT` | Policy rejected |
| `UPLOAD` | File uploaded |
| `VERSION` | New version created |

---

## ⚠️ Common Issues & Solutions

### 1. "Not authorized by CORS"
**Solution:** Make sure your origin is in the CLIENT_URLS env variable

### 2. "Token not found"
**Solution:** Include `Authorization: Bearer {{token}}` header

### 3. "Policy not found"
**Solution:** Verify the UUID format is correct


### 4. "File upload failed"
**Solution:** Ensure file size is under the limit and correct MIME type


### 5. "Already pending approval"
**Solution:** Wait for current approval to be processed first

---

## 📁 Testing with File Downloads


### Download File
```
GET {{baseUrl}}/policies/files/{{fileId}}/download
Authorization: Bearer {{token}}
```

Save the response as a file to verify the uploaded document.

---

## 🎯 Quick Test Checklist

- [ ] Login and get token
- [ ] Create a policy
- [ ] Create controls
- [ ] Map controls to policy
- [ ] Upload a file
- [ ] Create version
- [ ] Submit for approval
- [ ] Approve the policy
- [ ] View audit logs
- [ ] Get policy with all details
- [ ] Update policy
- [ ] Archive policy
