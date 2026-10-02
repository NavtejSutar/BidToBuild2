-- V3__seed_dev_data.sql: Development Environment Seed Data
-- [DEV ONLY - NOT FOR PRODUCTION]

-- Insert dev locations
INSERT IGNORE INTO locations (id, campus_zone, building, floor, room, display_name) VALUES
(1, 'North Zone', 'Science Block A', 'Floor 1', 'Room 101', 'Science Block A - Room 101 (Physics Lab)'),
(2, 'North Zone', 'Science Block A', 'Floor 2', 'Room 204', 'Science Block A - Room 204 (Computer Lab)'),
(3, 'South Zone', 'Engineering Block B', 'Ground Floor', 'Room 005', 'Eng Block B - Workshop 005'),
(4, 'South Zone', 'Hostel Block C', 'Floor 3', 'Room 312', 'Hostel C - Dorm Room 312'),
(5, 'Central Zone', 'Library Building', 'Floor 1', 'Reading Hall', 'Central Library - Main Reading Hall'),
(6, 'Central Zone', 'Admin Building', 'Floor 2', 'Room 201', 'Admin Block - Registrar Office');

-- Insert dev users (Default password: Password@123)
-- Hash generated with BCrypt cost 12 for 'Password@123': /gK1N4jU2H1iL23Zq9y6j7f3vKCe
INSERT IGNORE INTO users (id, name, email, password_hash, role, department, active) VALUES
(1, 'Admin Officer', 'admin@campus.edu', '/gK1N4jU2H1iL23Zq9y6j7f3vKCe', 'ADMIN', 'Facilities Management', true),
(2, 'Rajesh Kumar (Technician)', 'tech.raj@campus.edu', '/gK1N4jU2H1iL23Zq9y6j7f3vKCe', 'TECHNICIAN', 'Electrical & HVAC Maintenance', true),
(3, 'Priya Sharma (Technician)', 'tech.priya@campus.edu', '/gK1N4jU2H1iL23Zq9y6j7f3vKCe', 'TECHNICIAN', 'Plumbing & Civil Works', true),
(4, 'Alex Johnson (Student)', 'student.alex@campus.edu', '/gK1N4jU2H1iL23Zq9y6j7f3vKCe', 'USER', 'Computer Science Dept', true);

-- Insert technician skills
INSERT IGNORE INTO technician_skills (technician_id, category) VALUES
(2, 'ELECTRICAL'),
(2, 'HVAC'),
(2, 'IT'),
(3, 'PLUMBING'),
(3, 'CIVIL'),
(3, 'FURNITURE'),
(3, 'CLEANING');
