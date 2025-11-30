// src/controllers/admin/parentStudentController.js

const {
  createLink,
  deleteLink,
  listLinks,
} = require('../../services/parentStudentService');

/**
 * POST /api/admin/parent-student
 * Body: { parent_id, student_id, relationship_type }
 */
exports.linkParentToStudent = async (req, res) => {
  try {
    const parent_id = parseInt(req.body.parent_id, 10);
    const student_id = parseInt(req.body.student_id, 10);
    const relationship_type = req.body.relationship_type;

    const data = await createLink({ parent_id, student_id, relationship_type });
    return res.status(201).json({ data });
  } catch (err) {
    console.error('Error linking parent to student:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * DELETE /api/admin/parent-student/:parentId/:studentId
 */
exports.unlinkParentFromStudent = async (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId, 10);
    const studentId = parseInt(req.params.studentId, 10);

    await deleteLink(parentId, studentId);
    return res.status(204).send();
  } catch (err) {
    console.error('Error unlinking parent from student:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/parent-student
 * Query params: parentName?, studentName?, schoolId?, relationship_type?, page?, limit?
 * Response: { data: [...], total: number }
 */
exports.getParentStudentLinks = async (req, res) => {
  try {
    const {
      parentName = '',
      studentName = '',
      schoolId,
      relationship_type,
      page = '1',
      limit = '10',
    } = req.query;

    const filters = {
      parentName,
      studentName,
      schoolId: schoolId ? parseInt(schoolId, 10) : undefined,
      relationshipType: relationship_type,         // new filter
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const { data, total } = await listLinks(filters);
    return res.status(200).json({ data, total });
  } catch (err) {
    console.error('Error fetching parent-student links:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
};
