// Patch the swagger mount line in all 9 service app.ts files using @ts-expect-error
// to bypass the swagger-ui-express vs modern Express type mismatch.
const fs = require('fs');
const path = require('path');

const SERVICES = ['auth', 'user', 'product', 'cart', 'order', 'payment', 'notification', 'search', 'admin'];

for (const svc of SERVICES) {
  const p = path.join(__dirname, '..', 'services', svc, 'src', 'app.ts');
  let s = fs.readFileSync(p, 'utf8');

  const re = /^[ \t]*\/\/ ?swagger-ui-express.*\n[ \t]*app\.use\('\/api\/docs',[^\n]*\);/m;
  if (re.test(s)) {
    console.log(`already patched: ${svc}`);
    continue;
  }
  // Replace any line containing /api/docs.
  const before = "  app.use('/api/docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec));";
  const after = `  // @ts-expect-error — swagger-ui-express types lag Express 4.22
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));`;
  if (s.includes(before)) {
    s = s.replace(before, after);
    fs.writeFileSync(p, s);
    console.log(`patched: ${svc}`);
  } else {
    console.error(`unexpected /api/docs line in ${svc}`);
    process.exit(1);
  }
}
