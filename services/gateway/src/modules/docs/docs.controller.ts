import { Request, Response, NextFunction } from 'express';
import httpProxy from 'http-proxy';
import { SERVICE_DOCS } from '../../config/swagger';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { InternalServerError } from '../../utils/errors';

const docsProxy = httpProxy.createProxyServer({
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
});

docsProxy.on('error', (err, _req, res) => {
  logger.error('Docs proxy error:', err);
  const response = res as Response;
  if (!response.headersSent) {
    response.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Upstream docs unavailable' },
    });
  }
});

/**
 * Aggregator Swagger UI — links to per-service UIs (proxied through the
 * gateway at `/docs/<name>` so it works in any environment, not just dev).
 */
export const docsIndexHandler = (_req: Request, res: Response) => {
  const base = `http://localhost:${config.port}`;
  const items = SERVICE_DOCS.map(
    (s) =>
      `<li><a href="${s.url}">${s.name}</a></li>`
  ).join('');
  res.send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>API Docs — Gateway</title>
<style>
  body { font: 14px/1.5 -apple-system, system-ui, sans-serif; max-width: 720px; margin: 40px auto; color: #111; }
  h1 { letter-spacing: -0.01em; }
  ul { line-height: 2; }
  code { font-family: ui-monospace, Menlo, monospace; background: #f6f6f6; padding: 1px 6px; border-radius: 4px; }
  header { border-bottom: 1px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px; }
  footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px; }
  a { color: #0066cc; text-decoration: none; } a:hover { text-decoration: underline; }
</style>
</head>
<body>
<header>
  <h1>API Docs</h1>
  <p>Per-service OpenAPI / Swagger UIs for the e-commerce platform.</p>
  <p>Gateway base URL: <code>${base}</code></p>
  <p>Swagger UI here: <a href="/api/docs">/api/docs</a> (gateway-only).</p>
</header>
<h2>Services</h2>
<ul>${items}</ul>
<h2>Try it</h2>
<p>Open any link above to browse and call endpoints. Click <code>Authorize</code> and paste a JWT — the gateway validates it via <code>Authorization: Bearer &lt;token&gt;</code> then forwards identity as <code>x-user-id</code>.</p>
<footer>Generated Swagger UI per-service. See <code>services/&lt;name&gt;/src/config/swagger.ts</code>.</footer>
</body>
</html>`);
};

/**
 * Proxy to upstream Swagger UI for `<service>`. Works in any environment —
 * routes through the gateway's internal network address, not a dev-only
 * localhost port.
 */
export const docsProxyHandler = (req: Request, res: Response, next: NextFunction) => {
  const name = req.params.name;
  const entry = SERVICE_DOCS.find((s) => s.url === `/docs/${name}`);
  if (!entry) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Unknown service doc: ${name}` },
    });
    return;
  }
  // Build the upstream target from the configured service URL.
  const upstream = config.services[entry.serviceName as keyof typeof config.services];
  if (!upstream) {
    next(new InternalServerError(`No upstream configured for service: ${entry.serviceName}`));
    return;
  }
  docsProxy.web(req, res, { target: upstream }, (err) => {
    if (err) {
      logger.error(`Docs proxy error for ${entry.serviceName}:`, err);
      next(err);
    }
  });
};