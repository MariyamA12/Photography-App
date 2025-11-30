const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../../services/studentService');
const logger = require('../../utils/logger');

async function listStudents(req, res, next) {
  try {
    // parse pagination/filter params, including schoolId
    const { page, limit, search, sort, schoolName, className, schoolId } = req.query;
    const result = await getStudents({ page, limit, search, sort, schoolName, className, schoolId });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('listStudents error:', err);
    next(err);
  }
}

async function getStudent(req, res, next) {
  try {
    const id = +req.params.id;
    const student = await getStudentById(id);
    res.json({ success: true, data: student });
  } catch (err) {
    logger.error('getStudent error:', err);
    next(err);
  }
}

async function addStudent(req, res, next) {
  try {
    const student = await createStudent(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    logger.error('addStudent error:', err);
    next(err);
  }
}

async function editStudent(req, res, next) {
  try {
    const id = +req.params.id;
    const student = await updateStudent(id, req.body);
    res.json({ success: true, data: student });
  } catch (err) {
    logger.error('editStudent error:', err);
    next(err);
  }
}

async function removeStudent(req, res, next) {
  try {
    const id = +req.params.id;
    await deleteStudent(id);
    res.status(204).end();
  } catch (err) {
    logger.error('removeStudent error:', err);
    next(err);
  }
}

module.exports = {
  listStudents,
  getStudent,
  addStudent,
  editStudent,
  removeStudent,
};
