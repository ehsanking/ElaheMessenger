import { randomUUID } from 'node:crypto';

type CaptchaRecord = {
  answer: string;
  expiresAt: number;
};

const CAPTCHA_TTL_MS = 5 * 60 * 1000;
const captchaStore = new Map<string, CaptchaRecord>();

const purgeExpiredCaptchas = () => {
  const now = Date.now();
  for (const [id, record] of captchaStore.entries()) {
    if (record.expiresAt <= now) {
      captchaStore.delete(id);
    }
  }
};

export const createCaptchaChallenge = (answer: string) => {
  purgeExpiredCaptchas();

  const id = randomUUID();
  captchaStore.set(id, {
    answer: answer.trim().toUpperCase(),
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
  });

  return id;
};

export const verifyCaptchaChallenge = (captchaId: string, userAnswer: string) => {
  if (!captchaId || !userAnswer) return false;

  purgeExpiredCaptchas();

  const record = captchaStore.get(captchaId);
  if (!record) return false;

  // Always delete on first verification attempt (valid/invalid)
  captchaStore.delete(captchaId);

  return record.answer === userAnswer.trim().toUpperCase();
};
