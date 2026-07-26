-- =====================================================================
-- Database Schema (MySQL syntax)
-- =====================================================================

DROP TABLE IF EXISTS attendance_logs;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS biometric_devices;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

-- =====================================================================
-- USERS  (both admins/teachers and students live here, split by `role`)
-- =====================================================================
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(120)        NOT NULL,
    email           VARCHAR(150)        NOT NULL UNIQUE,
    password_hash   VARCHAR(255)        NOT NULL,
    role            VARCHAR(20)         NOT NULL CHECK (role IN ('admin', 'student')),
    student_code    VARCHAR(30)         UNIQUE,        -- e.g. "BSCS-2023-014", NULL for admins
    fingerprint_id  INTEGER             UNIQUE,        -- id stored on the AS608 sensor, NULL until enrolled
    cgpa            DECIMAL(3,2)        DEFAULT 0.00,
    earned_credits  INTEGER             DEFAULT 0,
    remaining_credits INTEGER           DEFAULT 0,
    created_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- COURSES
-- =====================================================================
CREATE TABLE courses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    course_code     VARCHAR(20)         NOT NULL UNIQUE,
    title           VARCHAR(150)        NOT NULL,
    credit_hours    INTEGER             NOT NULL DEFAULT 3,
    seat_limit      INTEGER             NOT NULL DEFAULT 40,
    teacher_id      INTEGER             REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- ENROLLMENTS  (student <-> course)
-- =====================================================================
CREATE TABLE enrollments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INTEGER             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id       INTEGER             NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at     TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_id)
);

-- =====================================================================
-- MARKS  (quiz / assignment / mid / final per student per course)
-- =====================================================================
CREATE TABLE marks (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INTEGER             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id       INTEGER             NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    quiz            DECIMAL(5,2)        DEFAULT 0,
    assignment      DECIMAL(5,2)        DEFAULT 0,
    mid             DECIMAL(5,2)        DEFAULT 0,
    final           DECIMAL(5,2)        DEFAULT 0,
    -- weighted total, kept in sync by the controller (10/10/30/50 split)
    total_percentage DECIMAL(5,2)       DEFAULT 0,
    updated_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (student_id, course_id)
);

-- =====================================================================
-- BIOMETRIC DEVICES  (ESP32 stations, one per classroom typically)
-- =====================================================================
CREATE TABLE biometric_devices (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    device_key      VARCHAR(100)        NOT NULL UNIQUE, -- shared secret the ESP32 sends
    room_label      VARCHAR(80),
    course_id       INTEGER             REFERENCES courses(id) ON DELETE SET NULL,
    last_seen_at    TIMESTAMP,
    status          VARCHAR(10)         NOT NULL DEFAULT 'offline' CHECK (status IN ('online','offline'))
);

-- =====================================================================
-- ATTENDANCE LOGS  (one row per scan)
-- =====================================================================
CREATE TABLE attendance_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INTEGER             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id       INTEGER             NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    device_id       INTEGER             REFERENCES biometric_devices(id) ON DELETE SET NULL,
    status          VARCHAR(10)         NOT NULL DEFAULT 'present' CHECK (status IN ('present','late')),
    scanned_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_student_course ON attendance_logs(student_id, course_id);
CREATE INDEX idx_marks_student_course ON marks(student_id, course_id);

-- =====================================================================
-- DUMMY DATA
-- Password for every seeded user is: Passw0rd!   (bcrypt hash below)
-- Hash generated with bcrypt, 10 rounds:
-- =====================================================================
INSERT INTO users (name, email, password_hash, role, student_code, fingerprint_id, cgpa, earned_credits, remaining_credits) VALUES
('Ms. Ayesha Khan',  'teacher@school.edu',  '$2b$10$C2h8m1n0y8ZC0Vw3o2mYje9y0mYhq6h1KxYQqZTdC0vXWkQeE0zXG', 'admin',   NULL,        NULL, NULL, NULL, NULL),
('Bilal Ahmed',      'bilal@school.edu',    '$2b$10$C2h8m1n0y8ZC0Vw3o2mYje9y0mYhq6h1KxYQqZTdC0vXWkQeE0zXG', 'student', 'BSCS-24-01', 1,   3.42, 45, 75),
('Hina Malik',       'hina@school.edu',     '$2b$10$C2h8m1n0y8ZC0Vw3o2mYje9y0mYhq6h1KxYQqZTdC0vXWkQeE0zXG', 'student', 'BSCS-24-02', 2,   3.85, 45, 75),
('Usman Tariq',      'usman@school.edu',    '$2b$10$C2h8m1n0y8ZC0Vw3o2mYje9y0mYhq6h1KxYQqZTdC0vXWkQeE0zXG', 'student', 'BSCS-24-03', 3,   2.61, 45, 75);

INSERT INTO courses (course_code, title, credit_hours, seat_limit, teacher_id) VALUES
('MATH-101', 'Calculus & Analytic Geometry', 3, 40, 1),
('ENG-101',  'English Composition',          3, 40, 1),
('URD-101',  'Urdu Adab',                    2, 40, 1);

INSERT INTO enrollments (student_id, course_id) VALUES
(2,1),(2,2),(3,1),(3,3),(4,2),(4,3);

INSERT INTO marks (student_id, course_id, quiz, assignment, mid, final, total_percentage) VALUES
(2,1, 8,9,25,42, 84),
(2,2, 7,8,20,30, 65),
(3,1, 9,10,28,45, 92),
(3,3, 8,9,26,40, 83),
(4,2, 4,5,12,20, 41),
(4,3, 5,6,15,22, 48);

INSERT INTO biometric_devices (device_key, room_label, course_id, status) VALUES
('ESP32-DEVKEY-ROOM-A1', 'Room A1', 1, 'offline'),
('ESP32-DEVKEY-ROOM-B2', 'Room B2', 2, 'offline');

-- MySQL notes:
--  * Replace SERIAL with INT AUTO_INCREMENT PRIMARY KEY
--  * Replace NUMERIC with DECIMAL
--  * Replace TIMESTAMP DEFAULT CURRENT_TIMESTAMP as-is (supported in MySQL 5.6.5+)
