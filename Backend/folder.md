backend/
├── sql/                         # (Optional) Prisma schema/migrations (if used)
│   ├── 001_create_users_table.sql
│   └── 002_...
│
├── src/
│   ├── app.js                      # Express app setup
│   ├── server.js                   # Server entry point
│
│   ├── config/                     # Config files (DB, Firebase, AWS)
│   │   ├── db.js                   # PostgreSQL connection
│   │   ├── firebase.js             # Firebase Admin SDK config
│   │   └── azureBlob.js                   # azure config
        ___ migrate.js              #migrations of sql
│
│   ├── controllers/                # Route controllers
│   │   ├── admin/
│   │   │   └── eventController.js
│   │   ├── parent/
│   │   │   └── purchaseController.js
│   │   ├── photographer/
│   │   │   └── attendanceController.js
│   │   └── userController.js       # Login, registration, refresh token
│
│   ├── services/                   # Business logic services
│   │   ├── authService.js
│   │   ├── eventService.js
│   │   ├── userService.js
│   │   ├── purchaseService.js
│   │   ├── s3Service.js
│   │   └── notificationService.js
│
│   ├── routes/                     # Express route definitions
│   │   ├── adminRoutes.js
│   │   ├── parentRoutes.js
│   │   ├── photographerRoutes.js
│   │   └── userRoutes.js
│
│   ├── models/                     # Database query clients/utilities
│   │   └── prismaClient.js         # (if using Prisma)
│
│   ├── validators/                 # Zod/Joi validation schemas
│   │   ├── userValidator.js
│   │   ├── eventValidator.js
│   │   └── purchaseValidator.js
│
│   ├── middlewares/               # Middleware (auth, roles, errors)
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── errorHandler.js
│
│   ├── jobs/                       # Background/cron jobs
│   │   └── notificationJob.js
│
│   └── utils/                      # Helper functions
│       ├── logger.js
│       ├── fileValidator.js
│       └── generateQRCode.js
│
├── .env                            # Environment variables (DB, keys, etc.)
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
