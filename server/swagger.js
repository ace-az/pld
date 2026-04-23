const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PLD Management API",
            version: "1.0.0",
            description: "API documentation for the PLD Management application.",
        },
        servers: [
            {
                url: "https://pld-backend-dfcx.onrender.com",
                description: "Deployed Render Server",
            },
            {
                url: "http://localhost:5000",
                description: "Local server",
            },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication and authorization' },
            { name: 'Profile', description: 'Profile management' },
            { name: 'Questions', description: 'Questions management' },
            { name: 'Students', description: 'Student management endpoints' },
            { name: 'Sessions', description: 'Session operations' },
            { name: 'Announcements', description: 'Announcements management' },
            { name: 'Register', description: 'Discord registration and verification together' },
            { name: 'Verify', description: 'Discord verification endpoints' },
            { name: 'AI', description: 'AI features' },
            { name: 'Admin', description: 'Admin operations' },
            { name: 'Users', description: 'User management' },
            { name: 'Majors', description: 'Majors management' },
            { name: 'Workshops', description: 'Workshop code editing and permission management' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
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
    apis: ["./routes/*.js"], // Automatically collect annotations from all route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
