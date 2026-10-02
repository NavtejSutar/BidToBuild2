# CampusOps: REST API Reference

Base URL: `/api/v1`

All endpoints except `/auth/**` require a Bearer token: `Authorization: Bearer <JWT>`.

---

## Authentication & Users

### `POST /auth/login`
- Request: `{ "email": "admin@campus.edu", "password": "admin123" }`
- Response: `{ "token": "...", "id": 1, "email": "...", "role": "ADMIN", "fullName": "..." }`

### `POST /auth/register`
- Request: `{ "fullName": "...", "email": "...", "password": "...", "role": "STUDENT", "department": "..." }`
- Response: `{ "token": "...", "id": ..., "email": "...", "role": "..." }`

---

## Locations

### `GET /locations`
- Returns all campus facilities sorted by building and room.

### `GET /locations/summary` (Admin)
- Returns location-wise complaint counts, open complaints, and recurrence flags.

---

## Complaints

### `POST /complaints`
- Content-Type: `multipart/form-data`
- Fields:
  - `title` (String, required)
  - `description` (String, required)
  - `category` (Category, mandatory user choice)
  - `locationId` (Long, required)
  - `image` (Multipart file, optional)
- Returns created `ComplaintDto` with initial urgency and priority score.

### `GET /complaints/{id}`
- Returns comprehensive complaint detail, active assignment, and transition history.

### `GET /complaints/{id}/recurrence-history`
- Returns earlier complaints in the same location and category within the past 30 days.

### `GET /complaints/my`
- Returns paginated list of complaints reported by the authenticated user.

### `GET /complaints/queue` (Admin)
- Returns all unresolved complaints sorted dynamically by `priorityScore` descending.

### `POST /complaints/{id}/assign` (Admin)
- Request: `{ "technicianId": 3, "note": "Check breaker panel" }`
- Transitions complaint to `ASSIGNED`.

### `POST /complaints/{id}/start-progress` (Assigned Tech / Admin)
- Transitions complaint to `IN_PROGRESS`.

### `POST /complaints/{id}/resolve` (Assigned Tech / Admin)
- Request: `{ "note": "Replaced breaker and checked lines" }`
- Transitions complaint to `RESOLVED` and records resolution timestamp.

---

## Technicians

### `GET /technicians/assigned` (Technician)
- Returns complaints actively assigned to the logged-in technician.

### `GET /technicians/workload` (Admin)
- Returns list of all technicians with open tasks breakdown by status and priority.

---

## Analytics

### `GET /analytics/dashboard` (Admin / Tech)
- Returns system-wide summary metrics, resolution turnaround, category and urgency breakdowns.

### `GET /analytics/matrix` (Admin / Tech)
- Returns 2D Status by Priority matrix table with column and row totals.
