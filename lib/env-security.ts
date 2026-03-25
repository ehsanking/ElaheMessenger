const MIN_SECRET_LENGTH = 32;

const requireEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
};

const forbidWeakValue = (name: string, value: string, denied: string[]) => {
  if (denied.includes(value)) {
    throw new Error(`${name} uses a weak default value and must be rotated.`);
  }
};

const requireMinLength = (name: string, value: string, minLength = MIN_SECRET_LENGTH) => {
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters long.`);
  }
};

export const validateProductionEnvironment = () => {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const isProduction = appEnv === 'production';

  if (!isProduction) {
    return { appEnv, isProduction: false };
  }

  const jwtSecret = requireEnv('JWT_SECRET');
  const sessionSecret = requireEnv('SESSION_SECRET');
  const encryptionKey = requireEnv('ENCRYPTION_KEY');
  const adminPassword = requireEnv('ADMIN_PASSWORD');
  const postgresPassword = requireEnv('POSTGRES_PASSWORD');
  requireEnv('DATABASE_URL');
  requireEnv('APP_URL');
  requireEnv('ALLOWED_ORIGINS');
  requireEnv('POSTGRES_USER');
  requireEnv('POSTGRES_DB');
  // MinIO credentials are optional.  If MINIO_ENDPOINT is set, require
  // access key and secret; otherwise skip these checks.  This allows the
  // server to run without object storage configured (defaulting to local
  // filesystem storage).
  const minioEndpoint = process.env.MINIO_ENDPOINT;
  if (minioEndpoint) {
    requireEnv('MINIO_ACCESS_KEY');
    requireEnv('MINIO_SECRET_KEY');
  }
  requireEnv('ADMIN_USERNAME');

  requireMinLength('JWT_SECRET', jwtSecret);
  requireMinLength('SESSION_SECRET', sessionSecret);
  requireMinLength('ENCRYPTION_KEY', encryptionKey);
  requireMinLength('ADMIN_PASSWORD', adminPassword, 16);
  requireMinLength('POSTGRES_PASSWORD', postgresPassword, 16);
  if (minioEndpoint) {
    const minioSecret = process.env.MINIO_SECRET_KEY!;
    requireMinLength('MINIO_SECRET_KEY', minioSecret, 16);
  }

  forbidWeakValue('ADMIN_PASSWORD', adminPassword, ['admin', 'changeme', 'password']);
  forbidWeakValue('POSTGRES_PASSWORD', postgresPassword, ['pass', 'postgres', 'password']);
  if (minioEndpoint) {
    const minioSecret = process.env.MINIO_SECRET_KEY!;
    forbidWeakValue('MINIO_SECRET_KEY', minioSecret, ['supersecret', 'minioadmin', 'password']);
  }

  return { appEnv, isProduction: true };
};
