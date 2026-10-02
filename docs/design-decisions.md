# CampusOps: Architectural Design Decisions

### 1. Hybrid Synchronous-Asynchronous Hazard Triage
- **Context**: Campus safety emergencies (e.g. sparking wires, gas leaks, flooding) cannot wait for an external LLM network round-trip.
- **Decision**: Implemented `critical-keywords.txt` rule layer that evaluates synchronously inside `ComplaintService.createComplaint()`. If a safety keyword matches, urgency is set to `CRITICAL` instantly.
- **Invariant**: Groq AI asynchronously refines categorization and tags, but is strictly prohibited from lowering a keyword-triggered `CRITICAL` urgency.

### 2. Mandatory User-Selected Category with AI Suggestion
- **Context**: Users understand their immediate problem domain (e.g., electrical outlet, leaking pipe), but may mislabel complex infrastructure.
- **Decision**: Required user category selection at creation time, preserving human intent. Groq AI provides an advisory suggestion stored in `suggested_category` without overriding the reporter's choice.

### 3. Dynamic Priority with Aging & Recurrence Caps
- **Formula**: $\text{Score} = \min(100, \text{UrgencyBase} + \text{AgingBonus} + \text{RecurrenceBonus})$
- **Decision**: Capped aging bonus at 20 points (1 point per 6 hours open) and recurrence bonus at 15 points (5 points per repeat in 30 days). This ensures that even high-aging low-urgency tasks cannot preempt life-safety critical incidents.

### 4. Resilient Scheduled Tasks without Distributed Lock Bottlenecks
- **Context**: In single-instance and moderate campus multi-instance deployments, complex distributed lock management introduces unnecessary coordination failure modes.
- **Decision**: Retained plain Spring `@Scheduled` methods for priority score refresh (every 10 minutes) and recurrence table rebuilds (2:00 AM nightly) with database transaction isolation.

### 5. Frontend Polling over SSE
- **Context**: Campus firewalls and edge proxies frequently drop long-lived Server-Sent Events (SSE) connections.
- **Decision**: Configured TanStack Query with a dependable 15-second background polling cadence (`refetchInterval: 15000`), ensuring robust real-time updates across all networks.
