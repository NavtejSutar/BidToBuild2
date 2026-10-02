const fs = require('fs');
const path = require('path');

function writeDocFile(relPath, content) {
    const fullPath = path.join(__dirname, '..', relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim() + '\n', { encoding: 'utf8' });
    console.log('Wrote doc: ' + relPath);
}

// 1. docs/demo.md
writeDocFile('docs/demo.md', `# CampusOps: Demo Walkthrough Guide

## System Overview
CampusOps is an enterprise-grade Smart Maintenance and Predictive Complaint Management System engineered for college campuses. It combines Spring Boot 3 (Java 21), MySQL 8, Groq LLM intelligence (\`openai/gpt-oss-120b\`), dynamic priority scoring, and a modern responsive React frontend.

---

## Seed Accounts & Credentials

| Role | Email | Password | Purpose |
|---|---|---|---|
| **Admin** | \`admin@campus.edu\` | \`admin123\` | Triage, Workload Analysis, Priority Queue, Assignment |
| **Technician 1** | \`tech1@campus.edu\` | \`tech123\` | Assigned Work Queue, Progress, Resolution |
| **Technician 2** | \`tech2@campus.edu\` | \`tech123\` | Secondary Technician (Plumbing/Civil) |
| **Student 1** | \`student1@campus.edu\` | \`student123\` | Complaint Reporting & Tracking |
| **Staff 1** | \`staff1@campus.edu\` | \`staff123\` | Departmental Facility Fault Submissions |

---

## Demo Scenario 1: Critical Hazard & Recurrence Detection

### Background
Campus seed data (\`V4__add_suggested_category_and_demo_seed.sql\`) pre-populates **4 earlier electrical complaints** in **Lab 204 (Engineering Hall)** over the past 30 days.

### Step 1: Submit Hazardous Fault as Student
1. Open the frontend at \`http://localhost:3000\`.
2. Click **Quick Demo: Student** or sign in as \`student1@campus.edu\` / \`student123\`.
3. Navigate to **Report Fault** (\`/complaints/new\`).
4. Fill in the form:
   - **Title**: \`Sparking wire near breaker box in Lab 204\`
   - **Category (Mandatory)**: Select \`ELECTRICAL\`.
   - **Location**: Select \`Engineering Hall - 2nd Floor - Lab 204\`.
   - **Description**: \`Observed electrical sparking and buzzing from wall conduit near workstation 6. High risk of electrical fire.\`
5. **Immediate Live Feedback**: Notice the red safety alert banner appearing instantly in the UI detecting keyword \`"sparking"\`.
6. Click **Submit Complaint**.

### Step 2: Verify Immediate Triage & Dynamic Priority
1. The detail page (\`/complaints/{id}\`) opens immediately.
2. Observe:
   - **Urgency**: Set to \`CRITICAL\` immediately by the synchronous keyword rule layer.
   - **User Category**: \`ELECTRICAL\` (Primary user selection preserved).
   - **Groq AI Classification**: Suggests \`ELECTRICAL\` and extracts tags (\`["breaker", "fire-hazard", "electrical-spark"]\`).
   - **Recurrence Index**: Displays \`Recurring (4)\` badge with yellow warning icon.
   - **Dynamic Priority Score**: Evaluated at \`95\` (Urgency Base: 80 + Recurrence Bonus: +15).
   - **Location Recurrence History**: The 4 earlier complaints in Lab 204 appear in a structured table below the description.

---

## Demo Scenario 2: Admin Dashboard & Telemetry

### Step 1: Login as Admin
1. Sign out and sign in using **Quick Demo: Admin** (\`admin@campus.edu\` / \`admin123\`).
2. Navigate to **Dashboard** (\`/admin\`).

### Step 2: Inspect Telemetry & Status x Priority Matrix
1. **Summary Cards**:
   - Total complaints, Open backlog, In progress, Resolved, Critical active count, and Average resolution turnaround time.
2. **Status by Priority 2D Matrix**:
   - Live grid showing cross-tabulation of Lifecycle Status (\`REPORTED\`, \`ASSIGNED\`, \`IN_PROGRESS\`, \`RESOLVED\`) against Dynamic Priority (\`CRITICAL\`, \`HIGH\`, \`MEDIUM\`, \`LOW\`).
   - Column totals and row totals verify data integrity.
3. **Category Breakdown**:
   - Interactive bar chart showing distribution of complaints across Electrical, Plumbing, HVAC, etc.
4. **Hotspots**:
   - Lab 204 highlighted with \`Repeat Faults\` badge.

---

## Demo Scenario 3: Workload-Balanced Assignment

### Step 1: Open Priority Queue
1. In the admin navbar, click **Priority Queue** (\`/admin/priority-queue\`).
2. Notice the sparking wire complaint ranked **#1** due to its dynamic score of 95.
3. Examine the score chips: \`Score 95\`, \`Base: 80\`, \`Aging: +0\`, \`Recur: +15\`.

### Step 2: Review Worker Workload
1. Click **Technicians** (\`/admin/workload\`).
2. View real-time active task loads across all registered technicians.
3. Notice Technician 1 (\`tech1@campus.edu\`) currently has 0 active tasks (Available status).

### Step 3: Assign Technician
1. Return to **Priority Queue** and click **Assign** on complaint #1.
2. The assignment modal opens, displaying technicians ranked by available capacity.
3. Select **Sam Tech (tech1@campus.edu)**, enter note \`"Check circuit breaker panel immediately"\`, and click **Confirm Assignment**.
4. The complaint status updates to \`ASSIGNED\` and active technician badge updates.

---

## Demo Scenario 4: Technician Resolution

### Step 1: Login as Technician
1. Sign out and log in using **Quick Demo: Technician** (\`tech1@campus.edu\` / \`tech123\`).
2. The **Assigned Work Queue** (\`/technician\`) opens.

### Step 2: Start Work & Transition to In Progress
1. Locate the Lab 204 complaint.
2. Click **Start Work**.
3. Status transitions from \`ASSIGNED\` to \`IN_PROGRESS\`.

### Step 3: Complete Repair & Mark Resolved
1. Click **Resolve**.
2. Enter resolution note: \`"Replaced faulty 20A circuit breaker and re-insulated wall conduit. Voltage verified at 120V with zero thermal leaks."\`
3. Click **Complete & Mark Resolved**.
4. The complaint transitions to \`RESOLVED\`, the timestamp is recorded, and the active task count decrements to 0.

### Step 4: Audit Verification
1. Click **View** to inspect the complaint detail.
2. The **Status Transition History** timeline records all 4 lifecycle transitions:
   - \`CREATED\` by Alex Student
   - \`ASSIGNED\` to Sam Tech by Campus Facility Admin
   - \`IN_PROGRESS\` by Sam Tech
   - \`RESOLVED\` by Sam Tech with resolution details.
`);

// 2. docs/architecture.md
writeDocFile('docs/architecture.md', `# CampusOps: System Architecture

## Architecture Overview
CampusOps is built on a clean three-tier enterprise architecture comprising a Spring Boot 3 backend, a MySQL 8 relational store, and a React (Vite + Tailwind) single page application.

\`\`\`
+--------------------------------------------------------------+
|                        React Frontend                        |
|   (Vite, Tailwind, Lucide React, Recharts, TanStack Query)   |
+------------------------------+-------------------------------+
                               | REST API (JWT Authenticated)
                               v
+--------------------------------------------------------------+
|                     Spring Boot 3 Backend                    |
|                                                              |
|   [Auth / Security]          [Workflow Service]             |
|   JWT (HMAC-SHA256)          Strict State Machine            |
|   BCrypt Cost 12             REPORTED -> ASSIGNED ->         |
|                              IN_PROGRESS -> RESOLVED         |
|                                                              |
|   [Synchronous Rules]        [Async Groq AI Engine]         |
|   critical-keywords.txt      openai/gpt-oss-120b             |
|   Immediate CRITICAL         Refined Tags & Suggestions      |
|                                                              |
|   [Priority Scoring]         [Recurrence Engine]            |
|   Urgency + Aging + Recur    30-Day Rolling History & Index  |
|                                                              |
|   [Analytics Service]        [Scheduled Maintenance]        |
|   Status x Priority Matrix   Priority Aging / Recur Rebuild  |
+------------------------------+-------------------------------+
                               | JPA / Hibernate 6
                               v
+--------------------------------------------------------------+
|                        MySQL 8 RDBMS                         |
|   complaints, users, locations, assignments, history,        |
|   recurrence_index, llm_calls, flyway_schema_history         |
+--------------------------------------------------------------+
\`\`\`

---

## Core Subsystems

### 1. Synchronous Keyword Screening & Groq AI Pipeline
When a user submits a complaint:
1. **Keyword Screening Layer**: Inspects title and description against \`critical-keywords.txt\` (\`sparking\`, \`exposed wire\`, \`short circuit\`, \`flooding\`, \`fire\`, \`gas leak\`). If any keyword matches, urgency is set to \`CRITICAL\` immediately.
2. **Groq AI Classifier**: An \`ApplicationEventPublisher\` triggers async classification using Groq (\`openai/gpt-oss-120b\`).
3. **Safety Non-Lowering Invariant**: The Groq classifier is explicitly barred from lowering a keyword-triggered \`CRITICAL\` urgency.
4. **Audit Logging**: Every AI request, duration, prompt tokens, completion tokens, and raw response are persisted in \`llm_calls\`.

### 2. Dynamic Priority Scoring Engine
Priority scores range from 0 to 100:

$$\\text{Score} = \\min(100, \\text{UrgencyBase} + \\text{AgingBonus} + \\text{RecurrenceBonus})$$

- **Urgency Base**:
  - \`CRITICAL\`: 80
  - \`HIGH\`: 50
  - \`MEDIUM\`: 25
  - \`LOW\`: 10
- **Aging Bonus**:
  - Open complaints accumulate 1 point per 6 hours open, capped at 20 points:
    $$\\text{AgingBonus} = \\min\\left(20, \\lfloor \\frac{\\text{HoursOpen}}{6} \\rfloor\\right)$$
- **Recurrence Bonus**:
  - Multiplies the 30-day repeat occurrence count by 5, capped at 15 points:
    $$\\text{RecurrenceBonus} = \\min(15, \\text{RecurrenceIndex} \\times 5)$$
- **Priority Levels**:
  - \`CRITICAL\`: Score $\\ge 75$
  - \`HIGH\`: Score $\\ge 50$
  - \`MEDIUM\`: Score $\\ge 25$
  - \`LOW\`: Score $< 25$

### 3. Recurrence Detection Engine
- Operates on a 30-day sliding window for matching \`(location_id, category)\`.
- Maintains both dynamic query-time counts and rolling aggregate cache in \`recurrence_index\` with trend analysis (\`RISING\`, \`STABLE\`, \`FALLING\`).
- Rebuilt automatically at 2:00 AM nightly via \`@Scheduled(cron = "0 0 2 * * *")\`.

### 4. Workflow State Machine
Strict transitions validated in \`WorkflowService.java\`:
- \`REPORTED\` $\\rightarrow$ \`ASSIGNED\` (Administrator only)
- \`ASSIGNED\` $\\rightarrow$ \`ASSIGNED\` (Reassignment by Administrator)
- \`ASSIGNED\` $\\rightarrow$ \`IN_PROGRESS\` (Assigned Technician or Administrator)
- \`IN_PROGRESS\` $\\rightarrow$ \`RESOLVED\` (Assigned Technician or Administrator)
- All transitions log actor, timestamps, from-status, to-status, and optional notes into \`complaint_history\`.
`);

// 3. docs/database.md
writeDocFile('docs/database.md', `# CampusOps: Database Documentation

## Relational Schema (MySQL 8)

The schema is managed strictly via Flyway migrations in \`backend/src/main/resources/db/migration/\`.

### Flyway Migration History
1. \`V1__init_schema.sql\`: Core tables (\`users\`, \`locations\`, \`complaints\`, \`assignments\`, \`complaint_history\`, \`recurrence_index\`, \`llm_calls\`, \`shedlock\`).
2. \`V2__seed_admin.sql\`: Seed administrator (\`admin@campus.edu\`) with BCrypt cost 12 hash.
3. \`V3__seed_locations_and_users.sql\`: Campus buildings (Engineering Hall, Science Complex, Library, Student Union) and test accounts.
4. \`V4__add_suggested_category_and_demo_seed.sql\`: Adds \`suggested_category\` column and 4 electrical complaints in Lab 204 across the past 30 days for recurrence demonstration.

---

## Entity Descriptions

### 1. \`users\`
- \`id\`: BIGINT AUTO_INCREMENT PRIMARY KEY
- \`email\`: VARCHAR(255) UNIQUE NOT NULL
- \`password_hash\`: VARCHAR(255) NOT NULL (BCrypt factor 12)
- \`full_name\`: VARCHAR(255) NOT NULL
- \`role\`: VARCHAR(50) NOT NULL (\`STUDENT\`, \`STAFF\`, \`TECHNICIAN\`, \`ADMIN\`)
- \`department\`: VARCHAR(100)
- \`phone_number\`: VARCHAR(50)
- \`is_active\`: BOOLEAN DEFAULT TRUE

### 2. \`locations\`
- \`id\`: BIGINT AUTO_INCREMENT PRIMARY KEY
- \`campus_zone\`: VARCHAR(100) NOT NULL
- \`building\`: VARCHAR(100) NOT NULL
- \`floor\`: VARCHAR(50) NOT NULL
- \`room\`: VARCHAR(100) NOT NULL
- \`display_name\`: VARCHAR(255) NOT NULL
- UNIQUE KEY \`uk_location_bfr\` (\`building\`, \`floor\`, \`room\`)

### 3. \`complaints\`
- \`id\`: BIGINT AUTO_INCREMENT PRIMARY KEY
- \`reporter_id\`: BIGINT NOT NULL (FK -> users.id)
- \`location_id\`: BIGINT NOT NULL (FK -> locations.id)
- \`title\`: VARCHAR(255) NOT NULL
- \`description\`: TEXT NOT NULL
- \`image_path\`: VARCHAR(500)
- \`category\`: VARCHAR(50) NOT NULL (User selection)
- \`suggested_category\`: VARCHAR(50) (Groq AI classification suggestion)
- \`urgency\`: VARCHAR(50) NOT NULL (\`LOW\`, \`MEDIUM\`, \`HIGH\`, \`CRITICAL\`)
- \`tags\`: JSON
- \`classification_status\`: VARCHAR(50) NOT NULL
- \`classification_source\`: VARCHAR(50)
- \`status\`: VARCHAR(50) NOT NULL (\`REPORTED\`, \`ASSIGNED\`, \`IN_PROGRESS\`, \`RESOLVED\`)
- \`priority_score\`: INT NOT NULL DEFAULT 0
- \`priority_level\`: VARCHAR(50) NOT NULL DEFAULT 'LOW'
- \`priority_breakdown\`: JSON
- \`is_recurring\`: BOOLEAN NOT NULL DEFAULT FALSE
- \`recurrence_index\`: INT NOT NULL DEFAULT 0
- \`escalation_level\`: INT NOT NULL DEFAULT 0
- \`created_at\`, \`updated_at\`, \`resolved_at\`
- \`version\`: BIGINT NOT NULL DEFAULT 0 (Optimistic Locking)

### 4. \`assignments\`
- \`id\`: BIGINT AUTO_INCREMENT PRIMARY KEY
- \`complaint_id\`: BIGINT NOT NULL (FK -> complaints.id)
- \`technician_id\`: BIGINT NOT NULL (FK -> users.id)
- \`assigned_by\`: BIGINT NOT NULL (FK -> users.id)
- \`assigned_at\`: TIMESTAMP NOT NULL
- \`unassigned_at\`: TIMESTAMP
- \`note\`: VARCHAR(500)
- \`is_active\`: BOOLEAN NOT NULL DEFAULT TRUE

### 5. \`complaint_history\`
- \`id\`: BIGINT AUTO_INCREMENT PRIMARY KEY
- \`complaint_id\`: BIGINT NOT NULL (FK -> complaints.id)
- \`actor_id\`: BIGINT NOT NULL (FK -> users.id)
- \`event_type\`: VARCHAR(50) NOT NULL
- \`from_status\`: VARCHAR(50)
- \`to_status\`: VARCHAR(50) NOT NULL
- \`note\`: VARCHAR(1000)
- \`created_at\`: TIMESTAMP NOT NULL

### 6. \`recurrence_index\`
- \`id\`: BIGINT AUTO_INCREMENT PRIMARY KEY
- \`location_id\`: BIGINT NOT NULL (FK -> locations.id)
- \`category\`: VARCHAR(50) NOT NULL
- \`count_7d\`: INT DEFAULT 0
- \`count_30d\`: INT DEFAULT 0
- \`count_90d\`: INT DEFAULT 0
- \`first_seen\`, \`last_seen\`: TIMESTAMP
- \`trend\`: VARCHAR(20) DEFAULT 'STABLE'
- UNIQUE KEY \`uk_recurrence_loc_cat\` (\`location_id\`, \`category\`)

### 7. \`llm_calls\`
- \`id\`: BIGINT AUTO_INCREMENT PRIMARY KEY
- \`complaint_id\`: BIGINT (FK -> complaints.id)
- \`model\`: VARCHAR(100) NOT NULL
- \`prompt_tokens\`, \`completion_tokens\`: INT
- \`duration_ms\`: BIGINT
- \`success\`: BOOLEAN NOT NULL
- \`raw_response\`: TEXT
- \`error_message\`: TEXT
- \`created_at\`: TIMESTAMP NOT NULL
`);

// 4. docs/api.md
writeDocFile('docs/api.md', `# CampusOps: REST API Reference

Base URL: \`/api/v1\`

All endpoints except \`/auth/**\` require a Bearer token: \`Authorization: Bearer <JWT>\`.

---

## Authentication & Users

### \`POST /auth/login\`
- Request: \`{ "email": "admin@campus.edu", "password": "admin123" }\`
- Response: \`{ "token": "...", "id": 1, "email": "...", "role": "ADMIN", "fullName": "..." }\`

### \`POST /auth/register\`
- Request: \`{ "fullName": "...", "email": "...", "password": "...", "role": "STUDENT", "department": "..." }\`
- Response: \`{ "token": "...", "id": ..., "email": "...", "role": "..." }\`

---

## Locations

### \`GET /locations\`
- Returns all campus facilities sorted by building and room.

### \`GET /locations/summary\` (Admin)
- Returns location-wise complaint counts, open complaints, and recurrence flags.

---

## Complaints

### \`POST /complaints\`
- Content-Type: \`multipart/form-data\`
- Fields:
  - \`title\` (String, required)
  - \`description\` (String, required)
  - \`category\` (Category, mandatory user choice)
  - \`locationId\` (Long, required)
  - \`image\` (Multipart file, optional)
- Returns created \`ComplaintDto\` with initial urgency and priority score.

### \`GET /complaints/{id}\`
- Returns comprehensive complaint detail, active assignment, and transition history.

### \`GET /complaints/{id}/recurrence-history\`
- Returns earlier complaints in the same location and category within the past 30 days.

### \`GET /complaints/my\`
- Returns paginated list of complaints reported by the authenticated user.

### \`GET /complaints/queue\` (Admin)
- Returns all unresolved complaints sorted dynamically by \`priorityScore\` descending.

### \`POST /complaints/{id}/assign\` (Admin)
- Request: \`{ "technicianId": 3, "note": "Check breaker panel" }\`
- Transitions complaint to \`ASSIGNED\`.

### \`POST /complaints/{id}/start-progress\` (Assigned Tech / Admin)
- Transitions complaint to \`IN_PROGRESS\`.

### \`POST /complaints/{id}/resolve\` (Assigned Tech / Admin)
- Request: \`{ "note": "Replaced breaker and checked lines" }\`
- Transitions complaint to \`RESOLVED\` and records resolution timestamp.

---

## Technicians

### \`GET /technicians/assigned\` (Technician)
- Returns complaints actively assigned to the logged-in technician.

### \`GET /technicians/workload\` (Admin)
- Returns list of all technicians with open tasks breakdown by status and priority.

---

## Analytics

### \`GET /analytics/dashboard\` (Admin / Tech)
- Returns system-wide summary metrics, resolution turnaround, category and urgency breakdowns.

### \`GET /analytics/matrix\` (Admin / Tech)
- Returns 2D Status by Priority matrix table with column and row totals.
`);

// 5. docs/deployment.md
writeDocFile('docs/deployment.md', `# CampusOps: Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Java 21 LTS & Maven 3.9+ (for local backend development)
- Local MySQL 8 on port 3306

---

## Docker Compose Quickstart

1. Navigate to the \`deploy/\` directory:
   \`\`\`bash
   cd deploy
   \`\`\`

2. Copy the example environment configuration:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Configure your environment variables in \`.env\`:
   \`\`\`ini
   MYSQL_ROOT_PASSWORD=rootpass123
   MYSQL_DATABASE=bidtobid
   MYSQL_USER=nav
   MYSQL_PASSWORD=navdiv123
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   GROQ_API_KEY=your_groq_api_key_here
   \`\`\`

4. Launch all containers:
   \`\`\`bash
   docker compose up --build -d
   \`\`\`

5. Services will be available at:
   - **Frontend Application**: \`http://localhost:3000\` (or \`http://localhost\` in docker-compose production)
   - **Backend API**: \`http://localhost:8080/api/v1\`
   - **Database**: \`localhost:3306\`

---

## Local Development Setup

### Backend (Spring Boot 3)
\`\`\`bash
cd backend
mvn clean test
mvn spring-boot:run
\`\`\`

### Frontend (React + Vite)
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
`);

// 6. docs/design-decisions.md
writeDocFile('docs/design-decisions.md', `# CampusOps: Architectural Design Decisions

### 1. Hybrid Synchronous-Asynchronous Hazard Triage
- **Context**: Campus safety emergencies (e.g. sparking wires, gas leaks, flooding) cannot wait for an external LLM network round-trip.
- **Decision**: Implemented \`critical-keywords.txt\` rule layer that evaluates synchronously inside \`ComplaintService.createComplaint()\`. If a safety keyword matches, urgency is set to \`CRITICAL\` instantly.
- **Invariant**: Groq AI asynchronously refines categorization and tags, but is strictly prohibited from lowering a keyword-triggered \`CRITICAL\` urgency.

### 2. Mandatory User-Selected Category with AI Suggestion
- **Context**: Users understand their immediate problem domain (e.g., electrical outlet, leaking pipe), but may mislabel complex infrastructure.
- **Decision**: Required user category selection at creation time, preserving human intent. Groq AI provides an advisory suggestion stored in \`suggested_category\` without overriding the reporter's choice.

### 3. Dynamic Priority with Aging & Recurrence Caps
- **Formula**: $\\text{Score} = \\min(100, \\text{UrgencyBase} + \\text{AgingBonus} + \\text{RecurrenceBonus})$
- **Decision**: Capped aging bonus at 20 points (1 point per 6 hours open) and recurrence bonus at 15 points (5 points per repeat in 30 days). This ensures that even high-aging low-urgency tasks cannot preempt life-safety critical incidents.

### 4. Resilient Scheduled Tasks without Distributed Lock Bottlenecks
- **Context**: In single-instance and moderate campus multi-instance deployments, complex distributed lock management introduces unnecessary coordination failure modes.
- **Decision**: Retained plain Spring \`@Scheduled\` methods for priority score refresh (every 10 minutes) and recurrence table rebuilds (2:00 AM nightly) with database transaction isolation.

### 5. Frontend Polling over SSE
- **Context**: Campus firewalls and edge proxies frequently drop long-lived Server-Sent Events (SSE) connections.
- **Decision**: Configured TanStack Query with a dependable 15-second background polling cadence (\`refetchInterval: 15000\`), ensuring robust real-time updates across all networks.
`);

// 7. README.md
writeDocFile('README.md', `# CampusOps: Smart Maintenance and Predictive Complaint Management System

CampusOps is an enterprise-grade campus maintenance and predictive complaint management platform built with Spring Boot 3 (Java 21), MySQL 8, Groq LLM (\`openai/gpt-oss-120b\`), and a modern React (Vite + Tailwind) frontend.

---

## Key Features

- **Hybrid Synchronous & AI Hazard Triage**:
  - Immediate keyword safety screening on complaint submission (\`sparking\`, \`exposed wire\`, \`flooding\`, \`fire\`, \`gas leak\`) sets \`CRITICAL\` urgency synchronously.
  - Groq AI asynchronously enriches classifications, suggests categories, and extracts tags without ever lowering a keyword-triggered critical alert.
- **Dynamic Priority Scoring**:
  - Computes score (0 to 100) dynamically using Urgency Base (up to 80), Aging Bonus (+1 per 6h, max 20), and Recurrence Bonus (+5 per repeat in 30d, max 15).
- **Recurrence Detection & Telemetry**:
  - Tracks repeating faults across campus locations over a 30-day window.
  - Displays location-specific recurrence history on complaint detail and highlights hotspots on the admin dashboard.
- **Strict Workflow State Machine**:
  - Enforces immutable lifecycle transitions: \`REPORTED\` $\\rightarrow$ \`ASSIGNED\` $\\rightarrow$ \`IN_PROGRESS\` $\\rightarrow$ \`RESOLVED\`.
  - Comprehensive audit trail recording every transition, actor, timestamp, and resolution note.
- **Status by Priority 2D Analytics Matrix**:
  - Live cross-tabulated matrix showing counts by lifecycle status and priority level.
- **Technician Workload Tracking**:
  - Workload-ranked technician assignment suggestions to prevent technician burnout.
- **Modern Responsive UI**:
  - Clean slate dark-mode enterprise theme built with Tailwind CSS, Lucide React icons, and Recharts.
  - 15-second live polling for responsive updates.

---

## Seed Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | \`admin@campus.edu\` | \`admin123\` |
| **Technician 1** | \`tech1@campus.edu\` | \`tech123\` |
| **Student 1** | \`student1@campus.edu\` | \`student123\` |

---

## Quickstart

### Running Backend Tests
\`\`\`bash
cd backend
mvn clean test
\`\`\`

### Building Frontend
\`\`\`bash
cd frontend
npm install
npm run build
\`\`\`

### Documentation
- [Demo Walkthrough Guide](docs/demo.md)
- [System Architecture](docs/architecture.md)
- [Database Schema](docs/database.md)
- [REST API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Architectural Decisions](docs/design-decisions.md)
`);
