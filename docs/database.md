# CampusOps: Database Documentation

## Relational Schema (MySQL 8)

The schema is managed strictly via Flyway migrations in `backend/src/main/resources/db/migration/`.

### Flyway Migration History
1. `V1__init_schema.sql`: Core tables (`users`, `locations`, `complaints`, `assignments`, `complaint_history`, `recurrence_index`, `llm_calls`, `shedlock`).
2. `V2__seed_admin.sql`: Seed administrator (`admin@campus.edu`) with BCrypt cost 12 hash.
3. `V3__seed_locations_and_users.sql`: Campus buildings (Engineering Hall, Science Complex, Library, Student Union) and test accounts.
4. `V4__add_suggested_category_and_demo_seed.sql`: Adds `suggested_category` column and 4 electrical complaints in Lab 204 across the past 30 days for recurrence demonstration.

---

## Entity Descriptions

### 1. `users`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `password_hash`: VARCHAR(255) NOT NULL (BCrypt factor 12)
- `full_name`: VARCHAR(255) NOT NULL
- `role`: VARCHAR(50) NOT NULL (`STUDENT`, `STAFF`, `TECHNICIAN`, `ADMIN`)
- `department`: VARCHAR(100)
- `phone_number`: VARCHAR(50)
- `is_active`: BOOLEAN DEFAULT TRUE

### 2. `locations`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `campus_zone`: VARCHAR(100) NOT NULL
- `building`: VARCHAR(100) NOT NULL
- `floor`: VARCHAR(50) NOT NULL
- `room`: VARCHAR(100) NOT NULL
- `display_name`: VARCHAR(255) NOT NULL
- UNIQUE KEY `uk_location_bfr` (`building`, `floor`, `room`)

### 3. `complaints`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `reporter_id`: BIGINT NOT NULL (FK -> users.id)
- `location_id`: BIGINT NOT NULL (FK -> locations.id)
- `title`: VARCHAR(255) NOT NULL
- `description`: TEXT NOT NULL
- `image_path`: VARCHAR(500)
- `category`: VARCHAR(50) NOT NULL (User selection)
- `suggested_category`: VARCHAR(50) (Groq AI classification suggestion)
- `urgency`: VARCHAR(50) NOT NULL (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `tags`: JSON
- `classification_status`: VARCHAR(50) NOT NULL
- `classification_source`: VARCHAR(50)
- `status`: VARCHAR(50) NOT NULL (`REPORTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`)
- `priority_score`: INT NOT NULL DEFAULT 0
- `priority_level`: VARCHAR(50) NOT NULL DEFAULT 'LOW'
- `priority_breakdown`: JSON
- `is_recurring`: BOOLEAN NOT NULL DEFAULT FALSE
- `recurrence_index`: INT NOT NULL DEFAULT 0
- `escalation_level`: INT NOT NULL DEFAULT 0
- `created_at`, `updated_at`, `resolved_at`
- `version`: BIGINT NOT NULL DEFAULT 0 (Optimistic Locking)

### 4. `assignments`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `complaint_id`: BIGINT NOT NULL (FK -> complaints.id)
- `technician_id`: BIGINT NOT NULL (FK -> users.id)
- `assigned_by`: BIGINT NOT NULL (FK -> users.id)
- `assigned_at`: TIMESTAMP NOT NULL
- `unassigned_at`: TIMESTAMP
- `note`: VARCHAR(500)
- `is_active`: BOOLEAN NOT NULL DEFAULT TRUE

### 5. `complaint_history`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `complaint_id`: BIGINT NOT NULL (FK -> complaints.id)
- `actor_id`: BIGINT NOT NULL (FK -> users.id)
- `event_type`: VARCHAR(50) NOT NULL
- `from_status`: VARCHAR(50)
- `to_status`: VARCHAR(50) NOT NULL
- `note`: VARCHAR(1000)
- `created_at`: TIMESTAMP NOT NULL

### 6. `recurrence_index`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `location_id`: BIGINT NOT NULL (FK -> locations.id)
- `category`: VARCHAR(50) NOT NULL
- `count_7d`: INT DEFAULT 0
- `count_30d`: INT DEFAULT 0
- `count_90d`: INT DEFAULT 0
- `first_seen`, `last_seen`: TIMESTAMP
- `trend`: VARCHAR(20) DEFAULT 'STABLE'
- UNIQUE KEY `uk_recurrence_loc_cat` (`location_id`, `category`)

### 7. `llm_calls`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `complaint_id`: BIGINT (FK -> complaints.id)
- `model`: VARCHAR(100) NOT NULL
- `prompt_tokens`, `completion_tokens`: INT
- `duration_ms`: BIGINT
- `success`: BOOLEAN NOT NULL
- `raw_response`: TEXT
- `error_message`: TEXT
- `created_at`: TIMESTAMP NOT NULL
