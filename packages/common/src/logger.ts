import winston from 'winston';

export interface CreateLoggerOptions {
  /** Service name stamped on every line, e.g. "order". */
  service: string;
  /** Defaults to LOG_LEVEL, then "info" in production and "debug" elsewhere. */
  level?: string;
  /** "json" for log shippers, "pretty" for terminals. Defaults to json in production. */
  format?: 'json' | 'pretty';
}

const pretty = (service: string) =>
  winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack, service: _svc, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${service}] ${level}: ${message}${metaStr}${stack ? `\n${stack}` : ''}`;
    })
  );

export function createLogger({ service, level, format }: CreateLoggerOptions): winston.Logger {
  const isProd = process.env.NODE_ENV === 'production';
  const resolvedFormat = format ?? (isProd ? 'json' : 'pretty');

  return winston.createLogger({
    level: level ?? process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
    defaultMeta: { service },
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      resolvedFormat === 'json' ? winston.format.json() : pretty(service)
    ),
    transports: [new winston.transports.Console()],
  });
}

export type Logger = winston.Logger;
