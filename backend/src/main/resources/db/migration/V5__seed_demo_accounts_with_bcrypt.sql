-- V5__seed_demo_accounts_with_bcrypt.sql: Genuine BCrypt-hashed credentials for demo accounts

INSERT INTO users (name, email, password_hash, role, department, active) VALUES
('Campus Admin', 'admin@campus.edu', '$2a$12$pqWLV1enkEaS2P.1G6GFyOlR9VkkXUE/Qnm2u8Fy8..lPdsh6Ahna', 'ADMIN', 'Facilities Management', true),
('Sam Tech (Electrical)', 'tech1@campus.edu', '$2a$12$Qt.9op2VzGfAngbJpZBb7uXXNU.E8VH3ORP0QKjKJvIvxSk3x04VS', 'TECHNICIAN', 'Electrical Maintenance', true),
('Jordan Tech (Plumbing)', 'tech2@campus.edu', '$2a$12$Qt.9op2VzGfAngbJpZBb7uXXNU.E8VH3ORP0QKjKJvIvxSk3x04VS', 'TECHNICIAN', 'Plumbing & Civil Works', true),
('Alex Student', 'student1@campus.edu', '$2a$12$NgB96MzTDzEezUNASutR0./o.yP56wu5UVS0KAvxLaWFVFZluxzMC', 'STUDENT', 'Computer Science Dept', true),
('Faculty Staff', 'staff1@campus.edu', '$2a$12$NgB96MzTDzEezUNASutR0./o.yP56wu5UVS0KAvxLaWFVFZluxzMC', 'STAFF', 'Academic Affairs', true)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    active = true;
