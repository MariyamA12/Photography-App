// src/controllers/photographer/schoolController.js
const { getSchools: getSchoolsService } = require('../../services/schoolService');

exports.getSchools = async (req, res, next) => {
  try {
    // you may accept the same query params (search, sort, page, limit)
    const schools = await getSchoolsService(req.query);
    // for consistency with photographer endpoints we just return the array
    res.status(200).json(schools);
  } catch (err) {
    console.error('Photographer getSchools error:', err);
    next(err);
  }
};
