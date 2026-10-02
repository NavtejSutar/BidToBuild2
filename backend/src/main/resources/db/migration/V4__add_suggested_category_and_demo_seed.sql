-- V4__add_suggested_category_and_demo_seed.sql: Suggested category column and recurrence demo seed

-- 1. Add suggested_category column
ALTER TABLE complaints ADD COLUMN suggested_category VARCHAR(50);

-- 2. Seed past complaints for recurrence demonstration
-- Location ID 2 is "Science Block A - Room 204 (Computer Lab)"
-- Category: ELECTRICAL
-- Reporter ID 4 is "Alex Johnson (Student)"
-- Past complaints within the last 30 days
INSERT INTO complaints (
    reporter_id, location_id, title, description, category, suggested_category,
    urgency, classification_status, classification_source, status,
    priority_score, priority_level, priority_breakdown, is_recurring, recurrence_index,
    created_at, updated_at
) VALUES
(4, 2, 'Flickering tube light near row 3', 'The fluorescent tube light is flickering continuously during lab sessions.', 'ELECTRICAL', 'ELECTRICAL', 'LOW', 'COMPLETED', 'FALLBACK', 'RESOLVED', 25, 'MEDIUM', '{"urgencyBase":10,"agingBonus":10,"recurrenceBonus":5}', true, 1, DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY)),
(4, 2, 'Power strip not providing electricity', 'Desktop computers in row 4 lost power because the floor extension box tripped.', 'ELECTRICAL', 'ELECTRICAL', 'MEDIUM', 'COMPLETED', 'FALLBACK', 'RESOLVED', 45, 'MEDIUM', '{"urgencyBase":30,"agingBonus":10,"recurrenceBonus":5}', true, 2, DATE_SUB(NOW(), INTERVAL 18 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY)),
(4, 2, 'Burnt smell from main distribution switch', 'Noticeable burning plastic odor coming from the laboratory sub-meter board.', 'ELECTRICAL', 'ELECTRICAL', 'HIGH', 'COMPLETED', 'FALLBACK', 'RESOLVED', 70, 'HIGH', '{"urgencyBase":55,"agingBonus":5,"recurrenceBonus":10}', true, 3, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
(4, 2, 'Tripped circuit breaker after heavy load', 'Circuit breaker tripped again when all 30 PCs were powered on simultaneously.', 'ELECTRICAL', 'ELECTRICAL', 'HIGH', 'COMPLETED', 'FALLBACK', 'ASSIGNED', 75, 'CRITICAL', '{"urgencyBase":55,"agingBonus":5,"recurrenceBonus":15}', true, 3, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));