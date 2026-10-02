# CampusOps: Demo Walkthrough Guide

## System Overview
CampusOps is an enterprise-grade Smart Maintenance and Predictive Complaint Management System engineered for college campuses. It combines Spring Boot 3 (Java 21), MySQL 8, Groq LLM intelligence (`openai/gpt-oss-120b`), dynamic priority scoring, and a modern responsive React frontend.

---

## Seed Accounts & Credentials

| Role | Email | Password | Purpose |
|---|---|---|---|
| **Admin** | `admin@campus.edu` | `admin123` | Triage, Workload Analysis, Priority Queue, Assignment |
| **Technician 1** | `tech1@campus.edu` | `tech123` | Assigned Work Queue, Progress, Resolution |
| **Technician 2** | `tech2@campus.edu` | `tech123` | Secondary Technician (Plumbing/Civil) |
| **Student 1** | `student1@campus.edu` | `student123` | Complaint Reporting & Tracking |
| **Staff 1** | `staff1@campus.edu` | `staff123` | Departmental Facility Fault Submissions |

---

## Demo Scenario 1: Critical Hazard & Recurrence Detection

### Background
Campus seed data (`V4__add_suggested_category_and_demo_seed.sql`) pre-populates **4 earlier electrical complaints** in **Lab 204 (Engineering Hall)** over the past 30 days.

### Step 1: Submit Hazardous Fault as Student
1. Open the frontend at `http://localhost:3000`.
2. Click **Quick Demo: Student** or sign in as `student1@campus.edu` / `student123`.
3. Navigate to **Report Fault** (`/complaints/new`).
4. Fill in the form:
   - **Title**: `Sparking wire near breaker box in Lab 204`
   - **Category (Mandatory)**: Select `ELECTRICAL`.
   - **Location**: Select `Engineering Hall - 2nd Floor - Lab 204`.
   - **Description**: `Observed electrical sparking and buzzing from wall conduit near workstation 6. High risk of electrical fire.`
5. **Immediate Live Feedback**: Notice the red safety alert banner appearing instantly in the UI detecting keyword `"sparking"`.
6. Click **Submit Complaint**.

### Step 2: Verify Immediate Triage & Dynamic Priority
1. The detail page (`/complaints/{id}`) opens immediately.
2. Observe:
   - **Urgency**: Set to `CRITICAL` immediately by the synchronous keyword rule layer.
   - **User Category**: `ELECTRICAL` (Primary user selection preserved).
   - **Groq AI Classification**: Suggests `ELECTRICAL` and extracts tags (`["breaker", "fire-hazard", "electrical-spark"]`).
   - **Recurrence Index**: Displays `Recurring (4)` badge with yellow warning icon.
   - **Dynamic Priority Score**: Evaluated at `95` (Urgency Base: 80 + Recurrence Bonus: +15).
   - **Location Recurrence History**: The 4 earlier complaints in Lab 204 appear in a structured table below the description.

---

## Demo Scenario 2: Admin Dashboard & Telemetry

### Step 1: Login as Admin
1. Sign out and sign in using **Quick Demo: Admin** (`admin@campus.edu` / `admin123`).
2. Navigate to **Dashboard** (`/admin`).

### Step 2: Inspect Telemetry & Status x Priority Matrix
1. **Summary Cards**:
   - Total complaints, Open backlog, In progress, Resolved, Critical active count, and Average resolution turnaround time.
2. **Status by Priority 2D Matrix**:
   - Live grid showing cross-tabulation of Lifecycle Status (`REPORTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`) against Dynamic Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Column totals and row totals verify data integrity.
3. **Category Breakdown**:
   - Interactive bar chart showing distribution of complaints across Electrical, Plumbing, HVAC, etc.
4. **Hotspots**:
   - Lab 204 highlighted with `Repeat Faults` badge.

---

## Demo Scenario 3: Workload-Balanced Assignment

### Step 1: Open Priority Queue
1. In the admin navbar, click **Priority Queue** (`/admin/priority-queue`).
2. Notice the sparking wire complaint ranked **#1** due to its dynamic score of 95.
3. Examine the score chips: `Score 95`, `Base: 80`, `Aging: +0`, `Recur: +15`.

### Step 2: Review Worker Workload
1. Click **Technicians** (`/admin/workload`).
2. View real-time active task loads across all registered technicians.
3. Notice Technician 1 (`tech1@campus.edu`) currently has 0 active tasks (Available status).

### Step 3: Assign Technician
1. Return to **Priority Queue** and click **Assign** on complaint #1.
2. The assignment modal opens, displaying technicians ranked by available capacity.
3. Select **Sam Tech (tech1@campus.edu)**, enter note `"Check circuit breaker panel immediately"`, and click **Confirm Assignment**.
4. The complaint status updates to `ASSIGNED` and active technician badge updates.

---

## Demo Scenario 4: Technician Resolution

### Step 1: Login as Technician
1. Sign out and log in using **Quick Demo: Technician** (`tech1@campus.edu` / `tech123`).
2. The **Assigned Work Queue** (`/technician`) opens.

### Step 2: Start Work & Transition to In Progress
1. Locate the Lab 204 complaint.
2. Click **Start Work**.
3. Status transitions from `ASSIGNED` to `IN_PROGRESS`.

### Step 3: Complete Repair & Mark Resolved
1. Click **Resolve**.
2. Enter resolution note: `"Replaced faulty 20A circuit breaker and re-insulated wall conduit. Voltage verified at 120V with zero thermal leaks."`
3. Click **Complete & Mark Resolved**.
4. The complaint transitions to `RESOLVED`, the timestamp is recorded, and the active task count decrements to 0.

### Step 4: Audit Verification
1. Click **View** to inspect the complaint detail.
2. The **Status Transition History** timeline records all 4 lifecycle transitions:
   - `CREATED` by Alex Student
   - `ASSIGNED` to Sam Tech by Campus Facility Admin
   - `IN_PROGRESS` by Sam Tech
   - `RESOLVED` by Sam Tech with resolution details.
