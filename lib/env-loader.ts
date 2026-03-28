import fs from 'fs';
import path from 'path';

export type EnvPolicy = 'local-dev' | 'docker-compose';

export type LoadedEnv = {
  policy: EnvPolicy;
  primaryPath: string;
  secondaryPath: string;
  values: Record<string, string>;
};

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf8');
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = val;
  }

  return result;
}

export function getEnvPaths(rootDir: string, policy: EnvPolicy): {
  primaryPath: string;
  secondaryPath: string;
} {
  const envPath = path.join(rootDir, '.env');
  const envLocalPath = path.join(rootDir, '.env.local');

  if (policy === 'docker-compose') {
    return { primaryPath: envPath, secondaryPath: envLocalPath };
  }

  return { primaryPath: envLocalPath, secondaryPath: envPath };
}

export function loadEnvWithPolicy(rootDir: string, policy: EnvPolicy): LoadedEnv {
  const { primaryPath, secondaryPath } = getEnvPaths(rootDir, policy);

  const secondary = parseEnvFile(secondaryPath);
  const primary = parseEnvFile(primaryPath);

  // Precedence: process.env > primary(policy) > secondary(other file)
  const values = {
    ...secondary,
    ...primary,
    ...Object.fromEntries(
      Object.entries(process.env).filter(([, value]) => typeof value === 'string') as Array<[string, string]>
    ),
  };

  for (const [key, value] of Object.entries(values)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  return {
    policy,
    primaryPath,
    secondaryPath,
    values,
  };
}
