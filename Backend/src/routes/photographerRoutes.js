// src/routes/photographerRoutes.js

const express = require('express');
const {
  photographerLogin,
  getPhotographerProfile,
  photographerRefresh,
  photographerLogout,
} = require('../controllers/photographerController');
const {
  photographerLoginRules,
  eventIdParamRule,
  validate,
} = require('../validators/photographerValidator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getEventsByPhotographer } = require('../services/eventService');
const {
  getNotifications: getPhotographerNotifications,
} = require('../controllers/photographer/notificationController');
const { getEventDetails } = require('../controllers/photographer/eventController');
const { syncEvent, syncUploadData, }          = require('../controllers/photographer/eventSyncController');
const { query } = require('express-validator');
const { listParticipants } = require('../controllers/photographer/participantController');
const { listQRCodes     } = require('../controllers/photographer/qrCodeController');
const { body, param, validationResult } = require('express-validator');
const { getSchools: getPhotographerSchools } = require('../controllers/photographer/schoolController');
const { getFilteredEvents } = require('../services/eventService');
const { finishEvent } = require('../controllers/photographer/eventController');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Photographer
 *     description: Photographer-specific endpoints for login, token rotation, logout, profile, and resource access
 */

/**
 * @swagger
 * /api/photographer/login:
 *   post:
 *     summary: Photographer login
 *     tags: [Photographer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login successful; returns accessToken, refreshToken and user info
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post(
  '/login',
  photographerLoginRules,
  validate,
  photographerLogin
);

/**
 * @swagger
 * /api/photographer/profile:
 *   get:
 *     summary: Get authenticated photographer's profile
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized or invalid token
 *       403:
 *         description: Forbidden (wrong role)
 */
router.get(
  '/profile',
  authMiddleware,
  roleMiddleware('photographer'),
  getPhotographerProfile
);

/**
 * @swagger
 * /api/photographer/refresh:
 *   post:
 *     summary: Rotate refresh token and issue new tokens
 *     tags: [Photographer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens rotated successfully
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post(
  '/refresh',
  photographerRefresh
);

/**
 * @swagger
 * /api/photographer/logout:
 *   post:
 *     summary: Logout photographer and revoke refresh token
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/logout',
  authMiddleware,
  photographerLogout
);

/**
 * @swagger
 * /api/photographer/events:
 *   get:
 *     summary: List events assigned to the photographer with filters & paging
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: school_id
 *         schema: { type: integer }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc,desc]
 *           default: asc
 *       - in: query
 *         name: includeExpired
 *         schema: { type: boolean, default: false }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated, filtered list of events
 */
router.get(
  '/events',
  authMiddleware,
  roleMiddleware('photographer'),
  // optional basic validation
  query('search').optional().isString().trim(),
  query('school_id').optional().isInt({ gt: 0 }),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('sort').optional().isIn(['asc','desc']),
  query('includeExpired').optional().isBoolean(),
  query('page').optional().isInt({ gt: 0 }),
  query('limit').optional().isInt({ gt: 0 }),
  validate,
  async (req, res) => {
    try {
      const {
        search,
        school_id,
        start_date,
        end_date,
        sort = 'asc',
        includeExpired = 'false',
        page = '1',
        limit = '10',
      } = req.query;

      // Build options for service
      const opts = {
        photographer_id: req.user.userId,
        search,
        school_id:       school_id ? parseInt(school_id, 10) : undefined,
        start_date,
        end_date,
        sort_asc:        sort === 'asc',
        includeExpired:  includeExpired === 'true',
        page:            parseInt(page, 10),
        limit:           parseInt(limit, 10),
      };

      const { data, total, page: p, limit: l } =
        await getFilteredEvents(opts);

      return res.status(200).json({ data, total, page: p, limit: l });
    } catch (err) {
      console.error('Photographer getFilteredEvents error:', err);
      return res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/photographer/events/{id}:
 *   get:
 *     summary: Get details of a specific event assigned to the authenticated photographer
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *       403:
 *         description: Forbidden (not your event)
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get(
  '/events/:id',
  authMiddleware,
  roleMiddleware('photographer'),
  eventIdParamRule,
  validate,
  getEventDetails
);

/**
 * @swagger
 * /api/photographer/qr-scan:
 *   post:
 *     summary: QR code scanning endpoint (placeholder)
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrData:
 *                 type: string
 *     responses:
 *       200:
 *         description: QR scan access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/qr-scan',
  authMiddleware,
  roleMiddleware('photographer'),
  (req, res) =>
    res
      .status(200)
      .json({ message: 'QR scan access granted (photographer only)' })
);

/**
 * @swagger
 * /api/photographer/attendance:
 *   post:
 *     summary: Mark student attendance (placeholder)
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *               eventId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ['present', 'absent']
 *     responses:
 *       200:
 *         description: Attendance access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/attendance',
  authMiddleware,
  roleMiddleware('photographer'),
  (req, res) =>
    res
      .status(200)
      .json({ message: 'Attendance access granted (photographer only)' })
);

/**
 * @swagger
 * /api/photographer/upload-photo:
 *   post:
 *     summary: Upload student photos (placeholder)
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *               studentId:
 *                 type: string
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Photo upload access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/upload-photo',
  authMiddleware,
  roleMiddleware('photographer'),
  (req, res) =>
    res
      .status(200)
      .json({ message: 'Photo upload access granted (photographer only)' })
);

/**
 * @swagger
 * /api/photographer/notifications:
 *   get:
 *     summary: List notifications for the logged-in photographer
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [photographer_assignment]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated notifications list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/notifications',
  authMiddleware,
  roleMiddleware('photographer'),
  getPhotographerNotifications
);

/**
 * @swagger
 * /api/photographer/events/{id}/sync:
 *   get:
 *     summary: Download all event data for offline sync
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: All event data (students, QR codes, preferences)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: Forbidden (not your event)
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get(
  '/events/:id/sync',
  authMiddleware,
  roleMiddleware('photographer'),
  eventIdParamRule,
  validate,
  syncEvent
);
/**
 * @swagger
 * /api/photographer/events/{id}/participants:
 *   get:
 *     summary: List event participants with paging & filters
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *       - in: query
 *         name: studentName
 *         schema:
 *           type: string
 *         description: Filter by student name (ILIKE)
 *       - in: query
 *         name: parentName
 *         schema:
 *           type: string
 *         description: Filter by parent name (ILIKE)
 *       - in: query
 *         name: relationType
 *         schema:
 *           type: string
 *           enum: [biological, step]
 *         description: Filter by biological or step relationship
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (≥1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of participants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Participant'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.get(
  '/events/:id/participants',
  authMiddleware,
  roleMiddleware('photographer'),
  eventIdParamRule,
  query('studentName').optional().isString().trim(),
  query('parentName') .optional().isString().trim(),
  query('relationType').optional().isIn(['biological','step']),
  query('page')       .optional().isInt({ gt: 0 }),
  query('limit')      .optional().isInt({ gt: 0 }),
  validate,
  listParticipants
);
/**
 * @swagger
 * /api/photographer/events/{id}/qrcodes:
 *   get:
 *     summary: List event QR-codes with paging & filters
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *       - in: query
 *         name: photoType
 *         schema:
 *           type: string
 *           enum: [individual, with_sibling, with_friend, group]
 *         description: Filter by photo type
 *       - in: query
 *         name: isScanned
 *         schema:
 *           type: boolean
 *         description: Filter by scanned status
 *       - in: query
 *         name: studentName
 *         schema:
 *           type: string
 *         description: Filter by student name within QR-codes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of QR codes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QRCode'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.get(
  '/events/:id/qrcodes',
  authMiddleware,
  roleMiddleware('photographer'),
  eventIdParamRule,
  query('photoType').optional().isIn(['individual','with_sibling','with_friend','group']),
  query('isScanned') .optional().isBoolean(),
  query('studentName').optional().isString().trim(),
  query('page')       .optional().isInt({ gt: 0 }),
  query('limit')      .optional().isInt({ gt: 0 }),
  validate,
  listQRCodes
);

/**
 * @swagger
 * /api/photographer/events/{id}/sync-upload:
 *   post:
 *     summary: Upload local photo sessions and attendance
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessions]
 *             properties:
 *               sessions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [session_id, photo_type, timestamp]
 *                   properties:
 *                     session_id:   { type: string }
 *                     qrcode_id:    { type: integer, nullable: true }
 *                     photo_type:
 *                       type: string
 *                       enum: [individual, with_sibling, with_friend, group, random]
 *                     student_ids:
 *                       type: array
 *                       items: { type: integer }
 *                     temp_photo_name: { type: string }
 *                     timestamp:       { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Sync successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:         { type: string }
 *                 totalSessions:   { type: integer }
 *                 totalAttendance: { type: integer }
 *                 qrcodesMarked:   { type: integer }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  '/events/:id/sync-upload',
  authMiddleware,
  roleMiddleware('photographer'),
  param('id').isInt({ gt: 0 }),
  body('sessions').isArray({ min: 1 }),
  body('sessions.*.session_id').isString().notEmpty(),
  body('sessions.*.photo_type').isIn([
    'individual','with_sibling','with_friend','group','random'
  ]),
  body('sessions.*.student_ids').isArray(),
  body('sessions.*.timestamp').isISO8601(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  syncUploadData
);

/**
 * @swagger
 * /api/photographer/schools:
 *   get:
 *     summary: List all schools (for photographers)
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Array of schools
 */
router.get(
  '/schools',
  authMiddleware,
  roleMiddleware('photographer'),
  getPhotographerSchools
);

/**
 * @swagger
 * /api/photographer/events/{id}/finish:
 *   patch:
 *     summary: Mark event as finished
 *     tags: [Photographer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event marked finished
 *       403:
 *         description: Forbidden (not your event)
 *       404:
 *         description: Event not found
 */
router.patch(
  '/events/:id/finish',
  authMiddleware,
  roleMiddleware('photographer'),
  eventIdParamRule,
  validate,
  finishEvent
);


module.exports = router;
