const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "School Photography API",
      version: "1.0.0",
      description:
        "API documentation for the School Photography Management System",
      contact: {
        name: "API Support",
        email: "support@schoolphotography.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      //   {
      //     url: "http://localhost:5000",
      //     description: "Development server",
      //   },
      {
        url: "http://localhost:5000/api",
        description: "Development server (with /api prefix)",
      },
      //   {
      //     url:
      //       process.env.NODE_ENV === "production"
      //         ? "https://your-production-domain.com"
      //         : "http://localhost:5000",
      //     description:
      //       process.env.NODE_ENV === "production"
      //         ? "Production server"
      //         : "Local server",
      //   },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for authentication",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in HTTP-only cookie",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User ID",
            },
            name: {
              type: "string",
              description: "User full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            role: {
              type: "string",
              enum: ["admin", "parent", "photographer"],
              description: "User role in the system",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            password: {
              type: "string",
              description: "User password",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Success message",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
            accessToken: {
              type: "string",
              description: "JWT access token",
            },
            refreshToken: {
              type: "string",
              description: "JWT refresh token",
            },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: {
              type: "string",
              description: "User full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            password: {
              type: "string",
              description: "User password",
            },
            role: {
              type: "string",
              enum: ["admin", "parent", "photographer"],
              description: "User role",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: [
    "./src/routes/*.js",
    "./src/controllers/*.js",
    "./src/controllers/*/*.js",
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
