// Fix each service's src/app.ts: remove duplicate import block, then add the swagger imports + mount.
// Usage: node scripts/fix-app-imports.js
const fs = require('fs');
const path = require('path');

const SERVICES = ['auth', 'user', 'product', 'cart', 'order', 'payment', 'notification', 'search', 'admin'];

const IMPORT_LINES = [
  "import swaggerUi from 'swagger-ui-express';",
  "import { swaggerSpec } from './config/swagger';",
];

for (const svc of SERVICES) {
  const p = path.join(__dirname, '..', 'services', svc, 'src', 'app.ts');
  let s = fs.readFileSync(p, 'utf8');

  // 1. Detect if swagger is already wired.
  const alreadyHasSwagger = s.includes("from './config/swagger'") || s.includes("'/api/docs'");
  if (alreadyHasSwagger) {
    console.log(`skip (already wired): ${svc}`);
    continue;
  }

  // 2. Drop duplicate import blocks: keep only the first contiguous block of `^import` lines at the top.
  const lines = s.split('\n');
  const firstImport = lines.findIndex(l => /^import /.test(l));
  let lastImport = firstImport;
  for (let i = firstImport + 1; i < lines.length; i++) {
    if (/^import /.test(lines[i])) lastImport = i;
    else break;
  }
  const importBlock = lines.slice(firstImport, lastImport + 1);
  const beforeImports = lines.slice(0, firstImport);
  const afterImports = lines.slice(lastImport + 1);

  // Dedup the import block by exact-line.
  const seen = new Set();
  const dedup = importBlock.filter(l => {
    if (seen.has(l)) return false;
    seen.add(l);
    return true;
  });

  const newFile = [
    ...beforeImports,
    ...dedup,
    ...IMPORT_LINES,
    ...afterImports,
  ].join('\n');

  // 3. Insert mount line before app.use('/api/v1...
  const re = /app\.use\(['"]\/api\/v1[^'"]*['"]/;
  const m = newFile.match(re);
  if (!m) {
    console.error(`could not find /api/v1 mount in ${p}`);
    process.exit(1);
  }
  const idx = m.index;
  const mount = "\n  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));\n\n  ";
  const final = newFile.slice(0, idx) + mount + newFile.slice(idx);

  fs.writeFileSync(p, final);
  console.log(`patched: ${svc}`);
}
