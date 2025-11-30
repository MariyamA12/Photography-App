-- 004_create_sibling_relations_table.sql
CREATE TABLE IF NOT EXISTS sibling_relations (
  student1_id    INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student2_id    INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relation_type  VARCHAR(20) NOT NULL
    CHECK (relation_type IN ('biological','step')),
  PRIMARY KEY (student1_id, student2_id),
  CHECK (student1_id < student2_id)
);
