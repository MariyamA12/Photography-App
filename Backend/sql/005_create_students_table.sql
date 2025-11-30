-- 002_create_students_table.sql

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
