import { randomUUID } from 'node:crypto';
import { getRedisClient } from '@/lib/redis-client';

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

export async function createCaptchaChallengeShared(answer: string) {
  const id = randomUUID();
  const normalizedAnswer = answer.trim().toUpperCase();
  const client = await getRedisClient();
  await client.set(`captcha:${id}`, normalizedAnswer, { PX: CAPTCHA_TTL_MS });
  return id;
}

export async function verifyCaptchaChallengeShared(captchaId: string, userAnswer: string) {
  if (!captchaId || !userAnswer) return false;
  const client = await getRedisClient();
  const redisKey = `captcha:${captchaId}`;
  const record = await client.get(redisKey);
  if (!record) return false;
  await client.del(redisKey);
  return record === userAnswer.trim().toUpperCase();
}
