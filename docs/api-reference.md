# API Reference

This document provides a comprehensive reference for all API endpoints in the Contact Management API.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "data": {
    // Response data
  },
  "message": "Success message",
  "statusCode": 200
}
```

### Error Response
```json
{
  "error": {
    "message": "Error description",
    "details": "Additional error details"
  },
  "statusCode": 400
}
```

### Paginated Response
```json
{
  "data": [
    // Array of items
  ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "provider": { "id": 1 },
  "country": { "id": 1 }
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { "id": 2, "name": "user" },
      "status": { "id": 1, "name": "inactive" }
    }
  },
  "message": "Registration successful. Please check your email to confirm your account."
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "provider": { "id": 1 }
}
```

**Response:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpires": 1640995200000,
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": { "id": 2, "name": "user" }
    }
  }
}
```

### Confirm Email
```http
POST /auth/confirm-email
```

**Request Body:**
```json
{
  "hash": "confirmation_hash_from_email"
}
```

### Forgot Password
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

### Reset Password
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "password": "newSecurePassword123",
  "hash": "reset_hash_from_email"
}
```

### Get Profile
```http
GET /auth/me
```
*Requires authentication*

### Update Profile
```http
PATCH /auth/me
```
*Requires authentication*

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "avatar": "https://example.com/avatar.jpg"
}
```

### Delete Account
```http
DELETE /auth/me
```
*Requires authentication*

## Contact Endpoints

### Create Contact
```http
POST /contacts
```
*Requires authentication*

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "organization": "Tech Corp",
  "job_title": "Software Engineer",
  "birthday": "1990-05-15",
  "anniversary": "2020-06-20",
  "notes": "Important client contact",
  "avatar": { "id": 1 }
}
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Smith",
    "organization": "Tech Corp",
    "job_title": "Software Engineer",
    "birthday": "1990-05-15",
    "anniversary": "2020-06-20",
    "notes": "Important client contact",
    "avatar": {
      "id": 1,
      "path": "files/avatar.jpg"
    },
    "createdAt": "2023-12-01T10:00:00Z",
    "updatedAt": "2023-12-01T10:00:00Z"
  }
}
```

### Get All Contacts
```http
GET /contacts?page=1&limit=10&search=jane&sortBy=firstName&sortOrder=ASC
```
*Requires authentication*

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `search` (optional): Search term for name, email, or phone
- `sortBy` (optional): Field to sort by (firstName, lastName, createdAt)
- `sortOrder` (optional): Sort order (ASC, DESC)

### Get Contact by ID
```http
GET /contacts/{id}
```
*Requires authentication*

### Update Contact
```http
PATCH /contacts/{id}
```
*Requires authentication*

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith Updated",
  "organization": "New Tech Corp"
}
```

### Delete Contact
```http
DELETE /contacts/{id}
```
*Requires authentication*

### Export Contacts
```http
GET /contacts/export?format=csv
```
*Requires authentication*

**Query Parameters:**
- `format`: Export format (csv)

## Email Endpoints

### Add Email to Contact
```http
POST /contacts/emails
```
*Requires authentication*

**Request Body:**
```json
{
  "email": "jane.smith@example.com",
  "email_type": { "id": 1 },
  "contact": { "id": 1 }
}
```

### Get Contact Emails
```http
GET /contacts/emails?contactId=1
```
*Requires authentication*

### Update Email
```http
PATCH /contacts/emails/{id}
```
*Requires authentication*

### Delete Email
```http
DELETE /contacts/emails/{id}
```
*Requires authentication*

## Phone Endpoints

### Add Phone to Contact
```http
POST /contacts/phones
```
*Requires authentication*

**Request Body:**
```json
{
  "phone": "+1234567890",
  "phone_type": { "id": 1 },
  "contact": { "id": 1 }
}
```

### Get Contact Phones
```http
GET /contacts/phones?contactId=1
```
*Requires authentication*

### Update Phone
```http
PATCH /contacts/phones/{id}
```
*Requires authentication*

### Delete Phone
```http
DELETE /contacts/phones/{id}
```
*Requires authentication*

## Address Endpoints

### Add Address to Contact
```http
POST /contacts/addresses
```
*Requires authentication*

**Request Body:**
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": { "id": 1 },
  "address_type": { "id": 1 },
  "contact": { "id": 1 }
}
```

### Get Contact Addresses
```http
GET /contacts/addresses?contactId=1
```
*Requires authentication*

### Update Address
```http
PATCH /contacts/addresses/{id}
```
*Requires authentication*

### Delete Address
```http
DELETE /contacts/addresses/{id}
```
*Requires authentication*

## Tag Endpoints

### Create Tag
```http
POST /tags
```
*Requires authentication*

**Request Body:**
```json
{
  "name": "Work",
  "color": "#FF5733"
}
```

### Get All Tags
```http
GET /tags
```
*Requires authentication*

### Update Tag
```http
PATCH /tags/{id}
```
*Requires authentication*

### Delete Tag
```http
DELETE /tags/{id}
```
*Requires authentication*

## File Endpoints

### Upload File
```http
POST /files/upload
```
*Requires authentication*

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "data": {
    "id": 1,
    "path": "files/uploaded-file.jpg",
    "originalName": "avatar.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000
  }
}
```

### Get File
```http
GET /files/{filename}
```

### Delete File
```http
DELETE /files/{id}
```
*Requires authentication*

## User Management (Admin Only)

### Get All Users
```http
GET /users?page=1&limit=10
```
*Requires admin authentication*

### Create User
```http
POST /users
```
*Requires admin authentication*

### Get User by ID
```http
GET /users/{id}
```
*Requires admin authentication*

### Update User
```http
PATCH /users/{id}
```
*Requires admin authentication*

### Delete User
```http
DELETE /users/{id}
```
*Requires admin authentication*

## Health Check Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### Readiness Check
```http
GET /health/ready
```

### Liveness Check
```http
GET /health/live
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per minute per IP
- **Headers**: Rate limit information is included in response headers
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## Pagination

All list endpoints support pagination:
- **Default page size**: 10
- **Maximum page size**: 50
- **Page numbering**: Starts from 1

## Search and Filtering

Contact search supports:
- **Full-text search**: Searches across firstName, lastName, organization
- **Email search**: Searches contact emails
- **Phone search**: Searches contact phone numbers
- **Tag filtering**: Filter by contact tags
