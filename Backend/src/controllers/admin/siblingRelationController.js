// src/controllers/admin/siblingRelationController.js
const { listSiblingRelations } = require('../../services/siblingRelationService');

/**
 * GET /api/admin/sibling-relations
 * Query params: studentName?, relation_type?, schoolId?, page?, limit?
 * Response: { data: [...], total: number }
 */
exports.getSiblingRelations = async (req, res) => {
  try {
    const {
      studentName = '',
      relation_type,
      schoolId,
      page = '1',
      limit = '10',
    } = req.query;

    const filters = {
      studentName,
      relationType: relation_type,
      schoolId: schoolId ? parseInt(schoolId, 10) : undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const { data, total } = await listSiblingRelations(filters);
    return res.status(200).json({ data, total });
  } catch (err) {
    console.error('Error fetching sibling relations:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
};
