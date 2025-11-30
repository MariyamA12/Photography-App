// src/controllers/admin/schoolController.js
const {
  getSchools: getSchoolsService,
  getSchoolById: getSchoolByIdService,
  createSchool: createSchoolService,
  updateSchool: updateSchoolService,
  deleteSchool: deleteSchoolService,
} = require('../../services/schoolService');
const logger = require('../../utils/logger');

async function getSchools(req, res, next) {
  try {
    const schools = await getSchoolsService(req.query);
    res.json({ success: true, data: schools });
  } catch (err) {
    logger.error('getSchools error:', err);
    next(err);
  }
}

async function getSchoolById(req, res, next) {
  try {
    const id = +req.params.id;
    const school = await getSchoolByIdService(id);
    res.json({ success: true, data: school });
  } catch (err) {
    logger.error('getSchoolById error:', err);
    next(err);
  }
}

async function createSchool(req, res, next) {
  try {
    const school = await createSchoolService(req.body);
    res.status(201).json({ success: true, data: school });
  } catch (err) {
    logger.error('createSchool error:', err);
    next(err);
  }
}

async function updateSchool(req, res, next) {
  try {
    const id = +req.params.id;
    const school = await updateSchoolService(id, req.body);
    res.json({ success: true, data: school });
  } catch (err) {
    logger.error('updateSchool error:', err);
    next(err);
  }
}

async function deleteSchool(req, res, next) {
  try {
    const id = +req.params.id;
    await deleteSchoolService(id);
    res.status(204).end();
  } catch (err) {
    logger.error('deleteSchool error:', err);
    next(err);
  }
}

module.exports = {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
};
