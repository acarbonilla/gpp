# 🔌 GatePassPro API Documentation

## 📋 **Overview**

The GatePassPro API is a RESTful service built with Django REST Framework. It provides endpoints for visitor management, user authentication, and system administration.

**Base URL**: `http://localhost:8000/api/` (Development)
**Authentication**: JWT Token-based

---

## 🔐 **Authentication**

### **Login**
```http
POST /api/auth/login/
```

**Request Body:**
```json
{
  "username": "employee@company.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "employee@company.com",
    "email": "employee@company.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### **Token Refresh**
```http
POST /api/token/refresh/
```

**Request Body:**
```json
{
  "refresh": "your_refresh_token"
}
```

### **User Info**
```http
GET /api/auth/user/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "id": 1,
  "username": "employee@company.com",
  "email": "employee@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "groups": ["employee"]
}
```

---

## 👥 **User Management**

### **Logout**
```http
POST /api/auth/logout/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

---

## 📊 **Dashboard & Analytics**

### **Dashboard Metrics**
```http
GET /api/dashboard-metrics/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
[
  {
    "label": "Total Visit Requests",
    "value": 45,
    "icon": "ClipboardDocumentListIcon",
    "color": "blue"
  },
  {
    "label": "Pending Check-in",
    "value": 8,
    "icon": "ClockIcon",
    "color": "yellow"
  },
  {
    "label": "Active Visitors",
    "value": 3,
    "icon": "UserGroupIcon",
    "color": "green"
  }
]
```

### **Dashboard Analytics**
```http
GET /api/dashboard-analytics/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD) - default: 7 days ago
- `end_date` (optional): End date (YYYY-MM-DD) - default: today

**Response:**
```json
{
  "totalVisitors": 138,
  "totalVisitRequests": 156,
  "checkedInVisitors": 142,
  "checkedOutVisitors": 138,
  "noShowVisitors": 8,
  "pendingVisitors": 6,
  "averageCheckInTime": "Calculated from check-in data",
  "peakHours": "10:00",
  "topEmployees": [],
  "topPurposes": [],
  "visitors": []
}
```

**Note:** 
- `totalVisitors` now represents only completed visits (those that have checked out)
- `totalVisitRequests` represents all visit requests regardless of status
- `checkedOutVisitors` and `totalVisitors` will have the same value since both represent completed visits

**Note:** This endpoint is available to all authenticated users. Lobby attendants see all data, while employees see their own data and any visits they originally created (even if converted to walk-in).

### **Recent Activities**
```http
GET /api/recent-activities/
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10)
- `start_date` (optional): Start date (YYYY-MM-DD) - default: 7 days ago
- `end_date` (optional): End date (YYYY-MM-DD) - default: today

**Response:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/recent-activities/?page=2",
  "previous": null,
  "results": [
    {
      "id": "checkin_123",
      "type": "checkin",
      "message": "Checked in visitor John Smith",
      "details": "Host: Jane Doe",
      "time": "2024-01-15T14:30:00Z",
      "icon": "UserGroupIcon",
      "color": "green"
    }
  ]
}
```

---

## 🏢 **Visit Management**

### **Create Visit Request**
```http
POST /api/visit-requests/
```

**Headers:**
```
Authorization: Bearer your_access_token
Content-Type: application/json
```

**Request Body:**
```json
{
  "purpose": "Business meeting to discuss project requirements",
  "scheduled_time": "2024-01-20T14:00:00Z",
  "visit_type": "scheduled"
}
```

**Response:**
```json
{
  "id": 123,
  "purpose": "Business meeting to discuss project requirements",
  "scheduled_time": "2024-01-20T14:00:00Z",
  "visit_type": "scheduled",
  "status": "pending",
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "invitation_link": "http://localhost:3000/visitor-form/550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **Get Visit Requests**
```http
GET /api/visit-requests/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 123,
      "purpose": "Business meeting",
      "scheduled_time": "2024-01-20T14:00:00Z",
      "visit_type": "scheduled",
      "status": "approved",
      "visitor": {
        "full_name": "John Smith",
        "email": "john@example.com"
      },
      "invitation_link": "http://localhost:3000/visitor-form/550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

### **Update Visit Request**
```http
PUT /api/visit-requests/{id}/
```

**Request Body:**
```json
{
  "purpose": "Updated meeting purpose",
  "scheduled_time": "2024-01-20T15:00:00Z"
}
```

### **Delete Visit Request**
```http
DELETE /api/visit-requests/{id}/
```

---

## ✅ **Visit Approval**

### **Get Pending Visits (Approved but not checked in)**
```http
GET /api/visit-requests/pending/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
[
  {
    "id": 123,
    "purpose": "Business meeting",
    "scheduled_time": "2024-01-20T14:00:00Z",
    "visitor": {
      "full_name": "John Smith",
      "email": "john@example.com",
      "contact": "+1234567890"
    },
    "status": "approved"
  }
]
```

### **Get Pending Approvals (Waiting for approval)**
```http
GET /api/visit-requests/pending-approvals/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
[
  {
    "id": 123,
    "purpose": "Business meeting",
    "scheduled_time": "2024-01-20T14:00:00Z",
    "visitor": {
      "full_name": "John Smith",
      "email": "john@example.com",
      "contact": "+1234567890"
    },
    "status": "pending"
  }
]
```

### **Approve Visit**
```http
POST /api/visit-requests/{id}/approve/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "message": "Visit approved successfully.",
  "visit_id": 123
}
```

### **Reject Visit**
```http
POST /api/visit-requests/{id}/reject/
```

**Response:**
```json
{
  "message": "Visit rejected and notification sent to visitor."
}
```

### **Cancel Visit**
```http
POST /api/visit-requests/{id}/cancel/
```

**Response:**
```json
{
  "message": "Visit canceled successfully."
}
```

---

## 🏥 **Lobby Management**

### **Get Today's Visitors**
```http
GET /api/lobby/today-visitors/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
[
  {
    "id": 123,
    "visitor_name": "John Smith",
    "employee_name": "Jane Doe",
    "purpose": "Business meeting",
    "scheduled_time": "2024-01-15T14:00:00Z",
    "status": "approved",
    "is_checked_in": false,
    "is_checked_out": false,
    "check_in_time": null,
    "check_out_time": null
  }
]
```

### **Get All Today's Visits**
```http
GET /api/lobby/today-all-visits/
```

### **Check-in Visitor**
```http
POST /api/lobby/checkin/
```

**Headers:**
```
Authorization: Bearer your_access_token
Content-Type: application/json
```

**Request Body:**
```json
{
  "visitor_id": 456
}
```

**Response:**
```json
{
  "message": "Visitor checked in successfully.",
  "visit_id": 123,
  "visitor_name": "John Smith",
  "check_in_time": "2024-01-15T14:30:00Z",
  "checked_in_by": "lobby_attendant"
}
```

### **Check-out Visitor**
```http
POST /api/lobby/checkout/
```

**Request Body:**
```json
{
  "visitor_id": 456
}
```

**Response:**
```json
{
  "message": "Visitor checked out successfully.",
  "visit_id": 123,
  "visitor_name": "John Smith",
  "check_out_time": "2024-01-15T16:30:00Z",
  "checked_out_by": "lobby_attendant"
}
```

### **Mark as No-Show**
```http
POST /api/visit-requests/{id}/no-show/
```

**Response:**
```json
{
  "message": "Visit marked as no show."
}
```

---

## 🚶 **Walk-in Management**

### **Create Walk-in Visit**
```http
POST /api/lobby/walkin/
```

**Headers:**
```
Authorization: Bearer your_access_token
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "email": "john@example.com",
  "contact": "+1234567890",
  "address": "123 Main St, City, State",
  "host_name": "Jane Doe",
  "purpose": "Unexpected meeting",
  "scheduled_time": "2024-01-15T15:00:00Z"
}
```

**Response:**
```json
{
  "message": "Walk-in visit created successfully.",
  "visit_id": 124,
  "visitor_id": 457,
  "visitor_name": "John Smith",
  "host_name": "Jane Doe",
  "purpose": "Unexpected meeting - Visiting Jane Doe",
  "scheduled_time": "2024-01-15T15:00:00Z"
}
```

### **Convert to Walk-in**
```http
POST /api/lobby/convert-to-walkin/{visit_id}/
```

**Response:**
```json
{
  "message": "Scheduled visit successfully converted to walk-in.",
  "visit_id": 123,
  "visitor_name": "John Smith",
  "host_name": "Jane Doe",
  "purpose": "Business meeting - Visiting Jane Doe",
  "converted_at": "2024-01-15T15:00:00Z"
}
```

**Note:** When a visit is converted to walk-in, the original employee is preserved in the `original_employee` field, ensuring the visit still appears in the original employee's metrics and reports.

---

## 👤 **My Visitors**

### **Get My Visitors**
```http
GET /api/my-visitors/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
[
  {
    "id": 123,
    "visitor_name": "John Smith",
    "purpose": "Business meeting",
    "scheduled_time": "2024-01-15T14:00:00Z",
    "status": "approved",
    "is_checked_in": true,
    "is_checked_out": false,
    "check_in_time": "2024-01-15T14:30:00Z",
    "check_out_time": null,
    "employee_name": "Jane Doe"
  }
]
```

---

## 📊 **Reports**

### **Get Employee List**
```http
GET /api/employees/
```

**Headers:**
```
Authorization: Bearer your_access_token
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "jane_doe",
    "display_name": "Jane Doe (jane_doe)"
  },
  {
    "id": 2,
    "username": "john_smith",
    "display_name": "John Smith (john_smith)"
  },
  {
    "id": 3,
    "username": "attendant",
    "display_name": "Lobby Attendant (attendant)"
  }
]
```

**Note:** This endpoint returns all users (employees and lobby attendants) who have hosted visitors, sorted by first name and last name. The display_name format is "First Last (username)" or just "username" if no name is set.

### **Generate Reports**
```http
GET /api/generate-reports/
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `status` (optional): Filter by status (all, approved, checked_in, checked_out, no_show)
- `employee` (optional): Filter by employee username
- `visit_type` (optional): Filter by visit type (all, scheduled, walkin)

**Response:**
```json
{
  "totalVisitors": 156,
  "checkedInVisitors": 142,
  "checkedOutVisitors": 138,
  "noShowVisitors": 8,
  "pendingVisitors": 6,
  "averageCheckInTime": "Calculated from check-in data",
  "peakHours": "10:00",
  "topEmployees": [
    {"name": "jane_doe", "visitors": 25},
    {"name": "john_smith", "visitors": 18}
  ],
  "topPurposes": [
    {"purpose": "Business meeting", "count": 45},
    {"purpose": "Interview", "count": 23}
  ],
  "visitors": [
    {
      "visit_id": 123,
      "visitor_name": "John Smith",
      "employee_name": "jane_doe",
      "scheduled_time": "2024-01-15T14:00:00Z",
      "status": "checked_out",
      "check_in_time": "2024-01-15T14:30:00Z",
      "check_out_time": "2024-01-15T16:30:00Z",
      "purpose": "Business meeting",
      "visit_type": "scheduled"
    }
  ]
}
```

### **Download Reports**
```http
GET /api/download-reports/
```

**Query Parameters:**
- `format` (optional): Export format (csv, excel) - default: csv
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `status` (optional): Filter by status
- `employee` (optional): Filter by employee
- `visit_type` (optional): Filter by visit type

**Response:** CSV or Excel file download

---

## 🏠 **Visitor Form**

### **Get Visit Details**
```http
GET /api/visitor-form/{token}/
```

**Response:**
```json
{
  "visit_details": {
    "purpose": "Business meeting",
    "scheduled_time": "2024-01-20T14:00:00Z",
    "employee_name": "Jane Doe",
    "visit_type": "scheduled"
  },
  "message": "Please fill out your visitor information below."
}
```

### **Submit Visitor Information**
```http
POST /api/visitor-form/{token}/
```

**Request Body:**
```json
{
  "full_name": "John Smith",
  "email": "john@example.com",
  "contact": "+1234567890",
  "address": "123 Main St, City, State"
}
```

**Response:**
```json
{
  "message": "Visitor information submitted successfully. Your host will be notified and will review your request.",
  "visit_id": 123,
  "scheduled_time": "2024-01-20T14:00:00Z",
  "visitor_name": "John Smith"
}
```

---

## ⚠️ **Error Responses**

### **Validation Error**
```json
{
  "error": "Please correct the errors below and try again.",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": ["Please provide a valid email address."],
    "full_name": ["Full name is required."]
  }
}
```

### **Authentication Error**
```json
{
  "error": "Invalid username or password. Please check your credentials and try again.",
  "code": "INVALID_CREDENTIALS"
}
```

### **Permission Error**
```json
{
  "error": "You do not have permission to perform this action.",
  "code": "PERMISSION_DENIED"
}
```

### **Not Found Error**
```json
{
  "error": "Visit not found.",
  "code": "NOT_FOUND"
}
```

---

## 📝 **Status Codes**

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (Authentication Required)
- `403` - Forbidden (Permission Denied)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔧 **Rate Limiting**

- **Authentication endpoints**: 5 requests per minute
- **API endpoints**: 100 requests per hour per user
- **Report generation**: 10 requests per hour per user

---

## 📞 **Support**

For API support and questions:
- **Documentation**: This file
- **Issues**: [GitHub Issues](https://github.com/yourusername/gatepasspro/issues)
- **Email**: api-support@gatepasspro.com 