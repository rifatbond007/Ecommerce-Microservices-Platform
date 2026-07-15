import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || '3009';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Admin Service',
      version: '1.0.0',
      description: 'Dashboard, manage users/products/orders/settings.',
    },
    servers: [{ url: `http://localhost:${PORT}/api/v1` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Email is required' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.ts', './src/routes/*.ts'],
});
