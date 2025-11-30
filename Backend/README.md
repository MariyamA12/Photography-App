# Backend – Node.js Server for Project
This is the backend codebase for the project. It serves a unified API for the web admin panel, parent portal, and mobile photographer app. The backend is built with Node.js, Express, and PostgreSQL using the `pg` library.

---

## Features

- RESTful API built with Express.js
- PostgreSQL integration using `pg`
- Secure environment variable handling with `.env`
- Role-based routing structure (Admin, Parent, Photographer)
- Structured folder architecture for scalability
- Middleware for logging, authentication, error handling
- Ready for S3, Firebase Admin SDK, and Stripe integrations

---

## Folder Structure

```

backend/
├── prisma/                  # For optional raw SQL migrations
├── src/
│   ├── config/              # Configs for DB, Firebase, S3
│   ├── controllers/         # Role-specific route logic
│   ├── services/            # Business logic for each module
│   ├── routes/              # API route definitions
│   ├── models/              # DB clients or model utilities
│   ├── validators/          # Zod or Joi validators
│   ├── middlewares/         # Auth, role check, error handling
│   ├── jobs/                # Scheduled background jobs
│   ├── utils/               # Common helper functions
│   ├── app.js               # Express app setup
│   └── server.js            # Server entry point
├── .env                     # Environment configuration (not committed)
├── .gitignore               # Ignores node\_modules, .env, etc.
├── package.json             # NPM scripts and dependencies
└── README.md

````

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Backend
````

### 2. Install dependencies

```bash
npm install
```

### 3. Create the `.env` file

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
APP_NAME=Roz and Kristy Photo System
```

### 4. Run the server

```bash
npm run dev
```

Server will be available at:

```
http://localhost:5000
```

You can test the base API route:

```
GET /api/test
```

Expected response:

```json
{
  "message": "Server is running successfully.",
  "appName": "Roz and Kristy Photo System"
}
```

---

## NPM Scripts

| Command       | Description                   |
| ------------- | ----------------------------- |
| `npm run dev` | Start the server with nodemon |
| `npm start`   | Start the server (production) |

---

## Technologies Used

* Node.js
* Express.js
* PostgreSQL
* pg (PostgreSQL client)
* dotenv
* cors, morgan, body-parser
* jsonwebtoken, bcrypt
* firebase-admin
* aws-sdk
* zod
* nodemon

---

## Contribution

* Use feature branches for changes
* Write clean and modular code
* Keep role-specific logic in respective route/controller folders
