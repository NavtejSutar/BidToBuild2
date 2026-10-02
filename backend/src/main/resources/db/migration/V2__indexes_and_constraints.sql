-- V2__indexes_and_constraints.sql: Performance Indexes

-- Index for complaint queue triage sorted by status and priority descending
CREATE INDEX idx_complaints_status_priority ON complaints (status, priority_score DESC);

-- Index for recurring issue detection and category time queries
CREATE INDEX idx_complaints_loc_cat_created ON complaints (location_id, category, created_at);

-- Index for reporter history lookup
CREATE INDEX idx_complaints_reporter_created ON complaints (reporter_id, created_at);

-- Index for active assignment lookup by technician
CREATE INDEX idx_assignments_tech_active ON assignments (technician_id, active);

-- Index for complaint assignment lookup
CREATE INDEX idx_assignments_complaint_active ON assignments (complaint_id, active);

-- Index for notifications lookup by user and read status
CREATE INDEX idx_notifications_user_read ON notifications (user_id, read_at);

-- Index for history lookup by complaint
CREATE INDEX idx_history_complaint_created ON complaint_history (complaint_id, created_at);
