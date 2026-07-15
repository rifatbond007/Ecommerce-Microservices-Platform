import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || '3000';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'API Gateway',
      version: '1.0.0',
      description:
        'Reverse proxy + JWT verification + rate limit. Routes every `/api/v1/*` request to the upstream microservice. The full per-service Swagger UIs are listed at the `/docs` index.',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
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
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Route /api/v1/foo not found' },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts', './src/routes/*.ts'],
});

/**
 * Aggregator page — links to every per-service swagger UI.
 * The actual specs are served from each service's `/api/docs`.
 */
export const SERVICE_DOCS = [
  { name: 'Auth',          url: '/docs/auth',          port: 3001 },
  { name: 'User',          url: '/docs/user',          port: 3002 },
  { name: 'Product',       url: '/docs/product',       port: 3003 },
  { name: 'Cart',          url: '/docs/cart',          port: 3004 },
  { name: 'Order',         url: '/docs/order',         port: 3005 },
  { name: 'Payment',       url: '/docs/payment',       port: 3006 },
  { name: 'Notification',  url: '/docs/notification',  port: 3007 },
  { name: 'Search',        url: '/docs/search',        port: 3008 },
  { name: 'Admin',         url: '/docs/admin',         port: 3009 },
];