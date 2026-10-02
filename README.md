# CampusOps: Smart Maintenance and Predictive Complaint Management System

CampusOps is an enterprise-grade campus maintenance and predictive complaint management platform built with Spring Boot 3 (Java 21), MySQL 8, Groq LLM (`openai/gpt-oss-120b`), and a modern React (Vite + Tailwind) frontend.

---

## Key Features

- **Hybrid Synchronous & AI Hazard Triage**:
  - Immediate keyword safety screening on complaint submission (`sparking`, `exposed wire`, `flooding`, `fire`, `gas leak`) sets `CRITICAL` urgency synchronously.
  - Groq AI asynchronously enriches classifications, suggests categories, and extracts tags without ever lowering a keyword-triggered critical alert.
- **Dynamic Priority Scoring**:
  - Computes score (0 to 100) dynamically using Urgency Base (up to 80), Aging Bonus (+1 per 6h, max 20), and Recurrence Bonus (+5 per repeat in 30d, max 15).
- **Recurrence Detection & Telemetry**:
  - Tracks repeating faults across campus locations over a 30-day window.
  - Displays location-specific recurrence history on complaint detail and highlights hotspots on the admin dashboard.
- **Strict Workflow State Machine**:
  - Enforces immutable lifecycle transitions: `REPORTED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`.
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
| **Admin** | `admin@campus.edu` | `admin123` |
| **Technician 1** | `tech1@campus.edu` | `tech123` |
| **Student 1** | `student1@campus.edu` | `student123` |

---

## Quickstart

### Running Backend Tests
```bash
cd backend
mvn clean test
```

### Building Frontend
```bash
cd frontend
npm install
npm run build
```

### Documentation
- [Demo Walkthrough Guide](docs/demo.md)
- [System Architecture](docs/architecture.md)
- [Database Schema](docs/database.md)
- [REST API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Architectural Decisions](docs/design-decisions.md)
