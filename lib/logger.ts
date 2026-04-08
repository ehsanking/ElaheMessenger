import pino, { type Logger as PinoLogger } from 'pino';

type LogContext = Record<string, unknown>;

type LoggerApi = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  child: (bindings?: LogContext) => LoggerApi;
};

const resolveLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel === 'trace' || envLevel === 'debug' || envLevel === 'info' || envLevel === 'warn' || envLevel === 'error' || envLevel === 'fatal') {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

const createBaseLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return pino({
      level: resolveLogLevel(),
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino({
    level: resolveLogLevel(),
  });
};

const withRequestIdFirst = (context?: LogContext): LogContext | undefined => {
  if (!context) return undefined;
  const requestId = typeof context.requestId === 'string' ? context.requestId : undefined;
  if (!requestId) return context;

  const rest = { ...context };
  delete rest.requestId;
  return {
    requestId,
    ...rest,
  };
};

const bindLogger = (base: PinoLogger): LoggerApi => {
  const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: LogContext) => {
    const payload = withRequestIdFirst(context);
    if (payload) {
      base[level](payload, message);
      return;
    }
    base[level](message);
  };

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
    child: (bindings = {}) => bindLogger(base.child(withRequestIdFirst(bindings) ?? {})),
  };
};

export const logger = bindLogger(createBaseLogger());
