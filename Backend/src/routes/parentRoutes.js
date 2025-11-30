const Stripe = require('stripe');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getEventsForParent } = require('../services/eventService');
const { getNotifications: getParentNotifications } = require('../controllers/parent/notificationController');
const { validatePhotoPreference } = require('../validators/photoPreferenceValidator');
const { createPreference } = require('../controllers/parent/photoPreferenceController');
const { getParentProfile, updateParentProfile, changeParentPassword } = require('../controllers/parent/profileController');
const { createCheckoutSession } = require("../controllers/parent/purchaseController");
const { getPastOrders } = require('../controllers/parent/ordersController');
const {
  parentPhotoRules,
  validateParentPhotos,
} = require("../validators/parentPhotoValidator");
const { listPhotosForParent }    = require("../controllers/parent/photoController");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Parent
 *     description: Parent-specific endpoints for viewing events and notifications
 */

/**
 * @swagger
 * /parent/events:
 *   get:
 *     summary: List events for the logged-in parent
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of events related to the parent's children
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get(
  '/events',
  authMiddleware,
  roleMiddleware('parent'),
  async (req, res) => {
    try {
      const events = await getEventsForParent(req.user.userId);
      res.status(200).json(events);
    } catch (err) {
      console.error('Fetch parent events error:', err);
      res.status(err.status || 500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /parent/notifications:
 *   get:
 *     summary: List notifications for the logged-in parent
 *     tags: [Parent]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [preference_request]
 *         description: Filter by notification type
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated notifications list
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
 *                       eventId:
 *                         type: integer
 *                       eventName:
 *                         type: string
 *                       type:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       message:
 *                         type: string
 *                       sentAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 */
router.get(
  '/notifications',
  authMiddleware,
  roleMiddleware('parent'),
  getParentNotifications
);
/**
 * @swagger
 * /parent/photo-preferences:
 *   post:
 *     summary: Submit photo preference for a single student
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_id:
 *                 type: integer
 *               student_id:
 *                 type: integer
 *               preference_type:
 *                 type: string
 *                 enum: [individual, with_sibling, with_friend, group]
 *               extra_student_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *             required:
 *               - event_id
 *               - student_id
 *               - preference_type
 *     responses:
 *       201:
 *         description: Photo preference created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PhotoPreference'
 */
router.post(
  '/photo-preferences',
  authMiddleware,
  roleMiddleware('parent'),
  validatePhotoPreference,
  createPreference
);

/**
 * @swagger
 * /parent/profile:
 *   get:
 *     summary: Get parent profile with children details
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Parent profile with children information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 children:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       class_name:
 *                         type: string
 *                       school_name:
 *                         type: string
 *                       relationship_type:
 *                         type: string
 *                         enum: [biological, step]
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Parent only
 */
router.get(
  '/profile',
  authMiddleware,
  roleMiddleware('parent'),
  getParentProfile
);

/**
 * @swagger
 * /parent/profile:
 *   put:
 *     summary: Update parent profile information
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 parent:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Parent only
 */
router.put(
  '/profile',
  authMiddleware,
  roleMiddleware('parent'),
  updateParentProfile
);

/**
 * @swagger
 * /parent/change-password:
 *   post:
 *     summary: Change parent password
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or current password incorrect
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Parent only
 */
router.post(
  '/change-password',
  authMiddleware,
  roleMiddleware('parent'),
  changeParentPassword
);

/**
 * @swagger
 * tags:
 *   - name: ParentPhotos
 *     description: Parent-only access to their children's photos
 */

/**
 * @swagger
 * /parent/photos:
 *   get:
 *     summary: List photos of logged-in parent's children
 *     tags: [ParentPhotos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: event_name
 *         schema:
 *           type: string
 *         description: Partial match on event name
 *       - in: query
 *         name: photo_type
 *         schema:
 *           type: string
 *           enum: [individual, with_sibling, with_friend, group]
 *       - in: query
 *         name: student_name
 *         schema:
 *           type: string
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to_date
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
 *                       added_at:
 *                         type: string
 *                         format: date-time
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
 */
router.get(
  "/photos",
  authMiddleware,
  roleMiddleware("parent"),
  parentPhotoRules,
  validateParentPhotos,
  listPhotosForParent
);

router.post(
  "/create-checkout-session", 
  createCheckoutSession
);

// GET /api/orders?userId=123
router.get(
  '/:userId', getPastOrders
);

module.exports = router;
