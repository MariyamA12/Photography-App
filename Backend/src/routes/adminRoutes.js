// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });


const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validate: validateUser } = require("../validators/userValidator");
const { validate } = require('../validators/eventValidator');
// Event validators & controller
const {
  createEventRules,
  updateEventRules,
  eventIdParamRule,
  getEventsRules,
  getParticipantsRules,
  validate: validateEvent,
} = require("../validators/eventValidator");
const {
  create: createEvent,
  list: listEvents,
  getById: getEventById,
  update: updateEvent,
  remove: deleteEvent,
  getParticipants,
  sendPhotographerNotification,
  sendParentsNotification,
} = require("../controllers/admin/eventController");

// School validators & controller
const {
  createSchoolRules,
  updateSchoolRules,
  idParamRule: schoolIdParam,
  getSchoolsRules,
} = require("../validators/schoolValidator");
const {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
} = require("../controllers/admin/schoolController");

// Student validators & controller
const {
  createStudentRules,
  updateStudentRules,
  idParamRule: studentIdParam,
  getStudentsRules,
} = require("../validators/studentValidator");
const {
  listStudents,
  getStudent,
  addStudent,
  editStudent,
  removeStudent,
} = require("../controllers/admin/studentController");

// Parent-Student validators & controller
const {
  createParentStudentRules,
  deleteParentStudentRules,
  getParentStudentRules,
  validate: validateParentStudent,
} = require("../validators/parentStudentValidator");
const {
  linkParentToStudent,
  unlinkParentFromStudent,
  getParentStudentLinks,
} = require("../controllers/admin/parentStudentController");

// Sibling-relations validators & controller
const {
  getSiblingRelationRules,
} = require("../validators/siblingRelationValidator");
const {
  getSiblingRelations,
} = require("../controllers/admin/siblingRelationController");

//Notifications
const {
  adminNotificationRules,
  validateNotification,
} = require("../validators/notificationValidator");
const {
  getNotifications: getAdminNotifications,
} = require("../controllers/admin/notificationController");

router.get(
  "/notifications",
  authMiddleware,
  roleMiddleware("admin"),
  adminNotificationRules,
  validateNotification,
  getAdminNotifications
);

// QR code imports
const {
 generateQrCodesRules,
getEventQRCodesRules,
downloadEventQRCodesRules
} = require('../validators/qrCodeValidator');
const {
  generateQrCodesForEvent,
 getEventQRCodes,
 downloadEventQRCodes
} = require('../controllers/admin/qrCodeController');

// attendance validator & controller
const {
  attendanceRules,
  validateAttendance,
} = require('../validators/attendanceValidator');
const {
  listAttendance,
  exportAttendance,
} = require('../controllers/admin/attendanceController');


//photo
const { dslrPhotoUploadRules, validateDslrUpload } = require("../validators/dslrPhotoUploadValidator");
const { uploadDslrPhotosController }          = require("../controllers/admin/photoController");

// Re-import for GET /photos & DELETE /photos/:photoId
const {
  listRules: photoListRules,
  validate:    validatePhoto,
} = require("../validators/photoValidator");
const {
  listPhotos,
  deletePhoto: deletePhotoController,
} = require("../controllers/admin/photoController");

//Purchases
const paymentController = require("../controllers/admin/paymentController");
const { savePayment, getPayments } = require("../controllers/admin/paymentController");
const { stripeWebhookHandler } = require("../controllers/admin/stripeWebhookController");

/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Admin-only Event management
 *   - name: Schools
 *     description: Admin-only School management
 *   - name: Students
 *     description: Admin-only Student management
 *   - name: ParentStudent
 *     description: Admin-only Parent ↔ Student mapping
 *   - name: SiblingRelations
 *     description: Admin-only inferred Sibling Relations
 *
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         event_date:
 *           type: string
 *           format: date
 *         school_id:
 *           type: integer
 *         photographer_id:
 *           type: integer
 *         created_by:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *     School:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         class_name:
 *           type: string
 *         school_id:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *     ParentStudent:
 *       type: object
 *       properties:
 *         parent_id:
 *           type: integer
 *         student_id:
 *           type: integer
 *         relationship_type:
 *           type: string
 *           enum: [biological, step]
 *     SiblingRelation:
 *       type: object
 *       properties:
 *         student1_id:
 *           type: integer
 *         student2_id:
 *           type: integer
 *         relation_type:
 *           type: string
 *           enum: [biological, step]
 */

/**
 * @swagger
 * /api/admin/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/events",
  authMiddleware,
  roleMiddleware("admin"),
  createEventRules,
  validateEvent,
  createEvent
);

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: List events with filters & pagination
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: photographer_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: event_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/events",
  authMiddleware,
  roleMiddleware("admin"),
  getEventsRules,
  validateEvent,
  listEvents
);

/**
 * @swagger
 * /api/admin/events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/events/:id",
  authMiddleware,
  roleMiddleware("admin"),
  eventIdParamRule,
  validateEvent,
  getEventById
);

/**
 * @swagger
 * /api/admin/events/{id}:
 *   patch:
 *     summary: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Updated event object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   $ref: '#/components/schemas\Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.patch(
  "/events/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateEventRules,
  validateEvent,
  updateEvent
);

/**
 * @swagger
 * /api/admin/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Event deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.delete(
  "/events/:id",
  authMiddleware,
  roleMiddleware("admin"),
  eventIdParamRule,
  validateEvent,
  deleteEvent
);

/**
 * @swagger
 * /api/admin/events/{id}/participants:
 *   get:
 *     summary: List students & parents involved in an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: studentName
 *         schema:
 *           type: string
 *       - in: query
 *         name: parentName
 *         schema:
 *           type: string
 *       - in: query
 *         name: relationType
 *         schema:
 *           type: string
 *           enum: [biological, step]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of event participants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       student_id:
 *                         type: integer
 *                       student_name:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       school_name:
 *                         type: string
 *                       parent_id:
 *                         type: integer
 *                       parent_name:
 *                         type: string
 *                       relationship_type:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get(
  "/events/:id/participants",
  authMiddleware,
  roleMiddleware("admin"),
  eventIdParamRule,
  getParticipantsRules,
  validateEvent,
  getParticipants
);

/**
 * @swagger
 * /api/admin/events/{id}/notify-photographer:
 *   post:
 *     summary: Immediately notify the assigned photographer
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Photographer notified successfully }
 *       400: { description: Already notified }
 *       404: { description: Event or photographer not found }
 */
router.post(
  "/events/:id/notify-photographer",
  authMiddleware,
  roleMiddleware("admin"),
  sendPhotographerNotification
);

/**
 * @swagger
 * /api/admin/events/{id}/notify-parents:
 *   post:
 *     summary: Immediately notify all parents
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Parents notified successfully }
 *       400: { description: Already notified }
 *       404: { description: Event or parents not found }
 */
router.post(
  "/events/:id/notify-parents",
  authMiddleware,
  roleMiddleware("admin"),
  sendParentsNotification
);

// ─── Schools Routes ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/schools:
 *   get:
 *     summary: List schools with filters & pagination
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of schools
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/School'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/schools",
  authMiddleware,
  roleMiddleware("admin"),
  getSchoolsRules,
  validateUser,
  getSchools
);

/**
 * @swagger
 * /api/admin/schools:
 *   post:
 *     summary: Create a new school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/School'
 *     responses:
 *       201:
 *         description: School created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 school:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/schools",
  authMiddleware,
  roleMiddleware("admin"),
  createSchoolRules,
  validateUser,
  createSchool
);

/**
 * @swagger
 * /api/admin/schools/{id}:
 *   get:
 *     summary: Get a single school by ID
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: School object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 school:
 *                   $ref: '#/components/schemas/School'
 *       404:
 *         description: School not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/schools/:id",
  authMiddleware,
  roleMiddleware("admin"),
  schoolIdParam,
  validateUser,
  getSchoolById
);

/**
 * @swagger
 * /api/admin/schools/{id}:
 *   put:
 *     summary: Update a school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/School'
 *     responses:
 *       200:
 *         description: Updated school object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 school:
 *                   $ref: '#/components/schemas/School'
 *       400:
 *         description: Validation error
 *       404:
 *         description: School not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/schools/:id",
  authMiddleware,
  roleMiddleware("admin"),
  schoolIdParam,
  updateSchoolRules,
  validateUser,
  updateSchool
);

/**
 * @swagger
 * /api/admin/schools/{id}:
 *   delete:
 *     summary: Delete a school
 *     tags: [Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: School deleted
 *       404:
 *         description: School not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/schools/:id",
  authMiddleware,
  roleMiddleware("admin"),
  schoolIdParam,
  validateUser,
  deleteSchool
);

// ─── Students Routes ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/students:
 *   get:
 *     summary: List students with filters & pagination
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/students",
  authMiddleware,
  roleMiddleware("admin"),
  getStudentsRules,
  validateUser,
  listStudents
);

/**
 * @swagger
 * /api/admin/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/students",
  authMiddleware,
  roleMiddleware("admin"),
  createStudentRules,
  validateUser,
  addStudent
);

/**
 * @swagger
 * /api/admin/students/{id}:
 *   get:
 *     summary: Get a single student by ID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/students/:id",
  authMiddleware,
  roleMiddleware("admin"),
  studentIdParam,
  validateUser,
  getStudent
);

/**
 * @swagger
 * /api/admin/students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Updated student object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put(
  "/students/:id",
  authMiddleware,
  roleMiddleware("admin"),
  studentIdParam,
  updateStudentRules,
  validateUser,
  editStudent
);

/**
 * @swagger
 * /api/admin/students/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Student deleted
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/students/:id",
  authMiddleware,
  roleMiddleware("admin"),
  studentIdParam,
  validateUser,
  removeStudent
);

// ─── Parent-Student Mapping Routes ────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/parent-student:
 *   get:
 *     summary: List parent–student links
 *     tags: [ParentStudent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parent–student relationships
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ParentStudent'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/parent-student",
  authMiddleware,
  roleMiddleware("admin"),
  getParentStudentRules,
  validateParentStudent,
  getParentStudentLinks
);

/**
 * @swagger
 * /api/admin/parent-student:
 *   post:
 *     summary: Link a parent to a student
 *     tags: [ParentStudent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParentStudent'
 *     responses:
 *       201:
 *         description: Link created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  "/parent-student",
  authMiddleware,
  roleMiddleware("admin"),
  createParentStudentRules,
  validateParentStudent,
  linkParentToStudent
);

/**
 * @swagger
 * /api/admin/parent-student/{parentId}/{studentId}:
 *   delete:
 *     summary: Unlink a parent from a student
 *     tags: [ParentStudent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Link removed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/parent-student/:parentId/:studentId",
  authMiddleware,
  roleMiddleware("admin"),
  deleteParentStudentRules,
  validateParentStudent,
  unlinkParentFromStudent
);

// ─── Sibling Relations Routes ────────────────────────────────────────────────

/**
 * @swagger
 * /api/admin/sibling-relations:
 *   get:
 *     summary: List inferred sibling relations with filters & pagination
 *     tags: [SiblingRelations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentName
 *         schema:
 *           type: string
 *       - in: query
 *         name: relation_type
 *         schema:
 *           type: string
 *           enum: [biological, step]
 *       - in: query
 *         name: schoolId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of sibling relations and total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SiblingRelation'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/sibling-relations",
  authMiddleware,
  roleMiddleware("admin"),
  getSiblingRelationRules,
  validateUser,
  getSiblingRelations
);

//Notifications=============================================
/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: List notifications sent by admin
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [preference_request,photographer_assignment]
 *       - in: query
 *         name: recipientRole
 *         schema:
 *           type: string
 *           enum: [parent,photographer]
 *       - in: query
 *         name: eventName
 *         schema:
 *           type: string
 *         description: Search by event name
 *       - in: query
 *         name: schoolName
 *         schema:
 *           type: string
 *         description: Search by school name
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
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 */

router.get(
  "/notifications",
  authMiddleware,
  roleMiddleware("admin"),
  adminNotificationRules,
  validateNotification,
  getAdminNotifications
);


// ─── QR Code Routes ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * tags:
 *   - name: QRCodes
 *     description: Admin-only QR Code generation and retrieval
 */

/**
 * @swagger
 * /api/admin/events/{eventId}/qrcodes/generate:
 *   post:
 *     summary: Generate all QR codes for an event
 *     tags: [QRCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *     responses:
 *       201:
 *         description: QR codes generated successfully
 *       400:
 *         description: QR codes already generated or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/events/:eventId/qrcodes/generate',
  authMiddleware,
  roleMiddleware('admin'),
  generateQrCodesRules,
  validate,
  generateQrCodesForEvent
);

/**
 * @swagger
 * /api/admin/events/{eventId}/qrcodes:
 *   get:
 *     summary: List QR codes for a specific event
 *     tags: [QRCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *       - in: query
 *         name: studentName
 *         schema:
 *           type: string
 *         description: Filter by student name (partial match)
 *       - in: query
 *         name: photoType
 *         schema:
 *           type: string
 *           enum: [individual, with_sibling, with_friend, group]
 *         description: Filter by type of photo
 *       - in: query
 *         name: isScanned
 *         schema:
 *           type: boolean
 *         description: Filter by scanned status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       photo_type:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       is_scanned:
 *                         type: boolean
 *                       scanned_at:
 *                         type: string
 *                         format: date-time
 *                       students:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/events/:eventId/qrcodes',
  authMiddleware,
  roleMiddleware('admin'),
  getEventQRCodesRules,
  validate,
  getEventQRCodes
);

/**
 * @swagger
 * /api/admin/events/{eventId}/qrcodes/download:
 *   get:
 *     summary: Download all QR code images as a ZIP
 *     tags: [QRCodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *     responses:
 *       200:
 *         description: ZIP file of QR code PNGs
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/events/:eventId/qrcodes/download',
  authMiddleware,
  roleMiddleware('admin'),
  downloadEventQRCodesRules,
  validate,
  downloadEventQRCodes
);
/**
 * @swagger
 * tags:
 *   - name: Attendance
 *     description: Admin-only Attendance reporting
 */

/**
 * @swagger
 * /api/admin/attendance:
 *   get:
 *     summary: List all attendance records with filters & pagination
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: event_id
 *         schema:
 *           type: integer
 *         description: Filter by event
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: integer
 *         description: Filter by school
 *       - in: query
 *         name: student_name
 *         schema:
 *           type: string
 *         description: Partial match student name
 *       - in: query
 *         name: photographer_id
 *         schema:
 *           type: integer
 *         description: Filter by photographer
 *       - in: query
 *         name: photo_type
 *         schema:
 *           type: string
 *           enum: [individual, with_sibling, with_friend, group]
 *       - in: query
 *         name: class_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: presence
 *         schema:
 *           type: string
 *           enum: [present, absent]
 *       - in: query
 *         name: is_random
 *         schema:
 *           type: boolean
 *         description: true = random photos only; false = QR-based only
 *       - in: query
 *         name: photo_name
 *         schema:
 *           type: string
 *         description: Partial match temp_photo_name
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       attendance_id:
 *                         type: integer
 *                       student_id:
 *                         type: integer
 *                       student_name:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       school_name:
 *                         type: string
 *                       event_name:
 *                         type: string
 *                       event_date:
 *                         type: string
 *                         format: date
 *                       status:
 *                         type: string
 *                       marked_at:
 *                         type: string
 *                         format: date-time
 *                       photo_type:
 *                         type: string
 *                       photo_name:
 *                         type: string
 *                       qrcode_id:
 *                         type: integer
 *                       photographer_name:
 *                         type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get(
  '/attendance',
  authMiddleware,
  roleMiddleware('admin'),
  attendanceRules,
  validateAttendance,
  listAttendance
);

/**
 * @swagger
 * /api/admin/attendance/export:
 *   get:
 *     summary: Export all matching attendance records as CSV
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       # (reuse all query params from /attendance)
 *       - in: query
 *         name: event_id
 *         schema:
 *           type: integer
 *       # … same as above …
 *     responses:
 *       200:
 *         description: CSV download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/attendance/export',
  authMiddleware,
  roleMiddleware('admin'),
  attendanceRules,
  validateAttendance,
  exportAttendance
);
/**
 * @swagger
 * tags:
 *   - name: Photos
 *     description: Admin-only photo upload & management
 */

/**
 * @swagger
 * /api/admin/photos:
 *   get:
 *     summary: List uploaded photos with filters & pagination
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: event_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event to list photos for
 *       - in: query
 *         name: searchName
 *         schema:
 *           type: string
 *         description: Partial match on original file name
 *       - in: query
 *         name: studentName
 *         schema:
 *           type: string
 *         description: Partial match on student name
 *       - in: query
 *         name: photoType
 *         schema:
 *           type: string
 *           enum: [individual, with_sibling, with_friend, group]
 *         description: Filter by photo type
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
 *         description: Paginated list of photos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       file_name:
 *                         type: string
 *                       file_url:
 *                         type: string
 *                       photo_type:
 *                         type: string
 *                       added_by:
 *                         type: integer
 *                       added_at:
 *                         type: string
 *                         format: date-time
 *                       student_ids:
 *                         type: array
 *                         items:
 *                           type: integer
 *                       student_names:
 *                         type: array
 *                         items:
 *                           type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/photos",
  authMiddleware,
  roleMiddleware("admin"),
  photoListRules,
  validatePhoto,
  listPhotos
);

// src/routes/adminRoutes.js

/**
 * POST /api/admin/events/:id/upload-dslr-photos
 * Upload all DSLR photos for an event and auto-map by timestamp
 */
router.post(
  "/events/:id/upload-dslr-photos",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("photos", 1000),
  dslrPhotoUploadRules,
  validateDslrUpload,
  uploadDslrPhotosController
);

/**
 * @swagger
 * tags:
 *   - name: Photos
 *     description: Admin-only photo upload & management
 */

/**
 * @swagger
 * /api/admin/photos/{photoId}:
 *   delete:
 *     summary: Delete an uploaded photo by its ID
 *     tags: [Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the photo to delete
 *     responses:
 *       204:
 *         description: Photo deleted successfully
 *       404:
 *         description: Photo not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/photos/:photoId",
  authMiddleware,
  roleMiddleware("admin"),
  deletePhotoController
);

// Save payment
router.post("/payments", savePayment);

// Get all payments
router.get("/payments", getPayments);

// Webhook route for Stripe
router.post(
  "/stripe/webhook", 
  express.raw({ type: "application/json" }), 
  stripeWebhookHandler
);

module.exports = router;