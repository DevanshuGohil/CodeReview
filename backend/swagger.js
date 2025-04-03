const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CodeReview API Documentation',
            version: '1.0.0',
            description: 'API documentation for the CodeReview application',
            contact: {
                name: 'API Support',
                url: 'https://codereview.com',
                email: 'support@codereview.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js', './models/*.js'] // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
    swaggerUi,
    swaggerDocs
}; 