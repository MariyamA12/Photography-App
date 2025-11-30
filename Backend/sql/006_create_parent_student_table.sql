-- sql/004_create_parent_student_table.sql
CREATE TABLE IF NOT EXISTS parent_student (
  parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) CHECK (relationship_type IN ('biological', 'step')) NOT NULL,
  PRIMARY KEY (parent_id, student_id)
);
