import { NextResponse } from 'next/server';
import { generateCaptchaText, generateCaptchaSvg } from '@/lib/captcha';
import { createCaptchaChallenge } from '@/lib/captcha-store';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/captcha
 * Returns a captcha ID and SVG image (base64-encoded data URI).
 */
export async function GET() {
  try {
    const text = generateCaptchaText(5);
    const svg = generateCaptchaSvg(text);

    const captchaId = createCaptchaChallenge(text);

    // Convert SVG to base64 data URI
    const svgBase64 = Buffer.from(svg).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

    return NextResponse.json(
      {
        success: true,
        captchaId,
        image: dataUri,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    logger.error('Captcha generation error.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to generate captcha' }, { status: 500 });
  }
}
