# CampusOps: System Architecture

## Architecture Overview
CampusOps is built on a clean three-tier enterprise architecture comprising a Spring Boot 3 backend, a MySQL 8 relational store, and a React (Vite + Tailwind) single page application.

```
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
```

---

## Core Subsystems

### 1. Synchronous Keyword Screening & Groq AI Pipeline
When a user submits a complaint:
1. **Keyword Screening Layer**: Inspects title and description against `critical-keywords.txt` (`sparking`, `exposed wire`, `short circuit`, `flooding`, `fire`, `gas leak`). If any keyword matches, urgency is set to `CRITICAL` immediately.
2. **Groq AI Classifier**: An `ApplicationEventPublisher` triggers async classification using Groq (`openai/gpt-oss-120b`).
3. **Safety Non-Lowering Invariant**: The Groq classifier is explicitly barred from lowering a keyword-triggered `CRITICAL` urgency.
4. **Audit Logging**: Every AI request, duration, prompt tokens, completion tokens, and raw response are persisted in `llm_calls`.

### 2. Dynamic Priority Scoring Engine
Priority scores range from 0 to 100:

$$\text{Score} = \min(100, \text{UrgencyBase} + \text{AgingBonus} + \text{RecurrenceBonus})$$

- **Urgency Base**:
  - `CRITICAL`: 80
  - `HIGH`: 50
  - `MEDIUM`: 25
  - `LOW`: 10
- **Aging Bonus**:
  - Open complaints accumulate 1 point per 6 hours open, capped at 20 points:
    $$\text{AgingBonus} = \min\left(20, \lfloor \frac{\text{HoursOpen}}{6} \rfloor\right)$$
- **Recurrence Bonus**:
  - Multiplies the 30-day repeat occurrence count by 5, capped at 15 points:
    $$\text{RecurrenceBonus} = \min(15, \text{RecurrenceIndex} \times 5)$$
- **Priority Levels**:
  - `CRITICAL`: Score $\ge 75$
  - `HIGH`: Score $\ge 50$
  - `MEDIUM`: Score $\ge 25$
  - `LOW`: Score $< 25$

### 3. Recurrence Detection Engine
- Operates on a 30-day sliding window for matching `(location_id, category)`.
- Maintains both dynamic query-time counts and rolling aggregate cache in `recurrence_index` with trend analysis (`RISING`, `STABLE`, `FALLING`).
- Rebuilt automatically at 2:00 AM nightly via `@Scheduled(cron = "0 0 2 * * *")`.

### 4. Workflow State Machine
Strict transitions validated in `WorkflowService.java`:
- `REPORTED` $\rightarrow$ `ASSIGNED` (Administrator only)
- `ASSIGNED` $\rightarrow$ `ASSIGNED` (Reassignment by Administrator)
- `ASSIGNED` $\rightarrow$ `IN_PROGRESS` (Assigned Technician or Administrator)
- `IN_PROGRESS` $\rightarrow$ `RESOLVED` (Assigned Technician or Administrator)
- All transitions log actor, timestamps, from-status, to-status, and optional notes into `complaint_history`.
