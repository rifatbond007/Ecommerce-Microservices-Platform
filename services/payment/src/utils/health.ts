import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/payment';

export interface HealthCheckResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export interface HealthDeps {
  /** Prisma client to ping via $queryRaw`SELECT 1`. */
  prisma?: PrismaClient;
  /**
   * Optional Redis check. Either an object with an async ping() method,
   * or a synchronous isAvailable() that returns boolean (e.g. the
   * gateway's `isRedisAvailable()` helper).
   */
  redis?: { ping(): Promise<unknown> } | { isAvailable(): boolean };
}

export interface HealthChecksOptions {
  serviceName: string;
  deps?: HealthDeps;
  /** Per-check timeout in ms. Default 1500. */
  timeoutMs?: number;
}

export interface HealthHandlers {
  liveness: (req: Request, res: Response) => void;
  readiness: (req: Request, res: Response) => Promise<void>;
  /** Alias of readiness — kept for /health probes that already exist. */
  health: (req: Request, res: Response) => Promise<void>;
}

/**
 * Reads inbound `X-Request-Id`, generates a UUID if missing, and stamps it
 * on the response header and the request object. Mirrors the gateway's
 * request-id middleware in services/gateway/src/app.ts:32-38.
 */
function propagateRequestId(req: Request, res: Response): string {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
  (req as Request & { id?: string }).id = id;
  res.setHeader('X-Request-Id', id);
  return id;
}

/** Race a promise against a timeout so a hanging dep can't hang the probe. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

async function checkPrisma(prisma: PrismaClient, timeoutMs: number): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, timeoutMs, 'database');
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkRedis(redis: NonNullable<HealthDeps['redis']>, timeoutMs: number): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    if ('isAvailable' in redis) {
      return { ok: !!redis.isAvailable(), latencyMs: Date.now() - started };
    }
    await withTimeout(redis.ping(), timeoutMs, 'redis');
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Build the three health handlers. Wire them in app.ts as:
 *
 *   const { liveness, readiness, health } = createHealthChecks({
 *     serviceName: 'payment',
 *     deps: { prisma },
 *   });
 *   app.get('/live',  liveness);
 *   app.get('/ready', readiness);
 *   app.get('/health', health); // alias of readiness
 */
export function createHealthChecks(opts: HealthChecksOptions): HealthHandlers {
  const { serviceName, deps = {}, timeoutMs = 1500 } = opts;

  async function probe(_req: Request, res: Response): Promise<void> {
    propagateRequestId(_req, res);

    const checks: Record<string, HealthCheckResult> = {};

    const runners: Promise<void>[] = [];
    if (deps.prisma) {
      runners.push(
        checkPrisma(deps.prisma, timeoutMs).then((r) => { checks.database = r; })
      );
    }
    if (deps.redis) {
      runners.push(
        checkRedis(deps.redis, timeoutMs).then((r) => { checks.redis = r; })
      );
    }
    await Promise.all(runners);

    const allOk = Object.values(checks).every((c) => c.ok);
    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ok' : 'degraded',
      service: serviceName,
      uptime: process.uptime(),
      checks,
    });
  }

  function liveness(req: Request, res: Response): void {
    propagateRequestId(req, res);
    res.status(200).json({ status: 'ok', service: serviceName });
  }

  return {
    liveness,
    readiness: probe,
    health: probe,
  };
}
