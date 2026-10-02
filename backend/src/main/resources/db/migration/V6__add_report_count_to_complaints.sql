-- V6__add_report_count_to_complaints.sql: Track multiple reporter count on existing unresolved complaints
ALTER TABLE complaints ADD COLUMN report_count INT NOT NULL DEFAULT 1;
