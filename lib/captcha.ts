/**
 * SVG Image Captcha Generator
 * Generates distorted text rendered as SVG — no external dependencies.
 */

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomColor(): string {
  const r = randomInt(20, 150);
  const g = randomInt(20, 150);
  const b = randomInt(20, 150);
  return `rgb(${r},${g},${b})`;
}

function lightColor(): string {
  const r = randomInt(200, 255);
  const g = randomInt(200, 255);
  const b = randomInt(200, 255);
  return `rgb(${r},${g},${b})`;
}

/**
 * Generates a random alphanumeric captcha text (avoids ambiguous chars).
 */
export function generateCaptchaText(length = 5): string {
  // Exclude ambiguous characters: 0/O, 1/l/I, etc.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += chars[randomInt(0, chars.length - 1)];
  }
  return text;
}

/**
 * Generates an SVG captcha image as a string.
 */
export function generateCaptchaSvg(text: string): string {
  const width = 220;
  const height = 70;
  const fontSize = 36;

  // Background
  const bgColor = lightColor();

  // Build character elements with individual transforms
  const charElements: string[] = [];
  const charWidth = width / (text.length + 1);

  for (let i = 0; i < text.length; i++) {
    const x = charWidth * (i + 0.5) + randomInt(-5, 5);
    const y = height / 2 + randomInt(-5, 8);
    const rotation = randomInt(-25, 25);
    const color = randomColor();
    const size = fontSize + randomInt(-4, 4);
    const fontFamily = ['serif', 'sans-serif', 'monospace', 'cursive'][randomInt(0, 3)];

    charElements.push(
      `<text x="${x}" y="${y}" font-size="${size}" font-family="${fontFamily}" ` +
      `fill="${color}" font-weight="${randomInt(400, 900)}" ` +
      `transform="rotate(${rotation} ${x} ${y})">${escapeXml(text[i])}</text>`
    );
  }

  // Noise lines
  const lines: string[] = [];
  for (let i = 0; i < 6; i++) {
    const x1 = randomInt(0, width);
    const y1 = randomInt(0, height);
    const x2 = randomInt(0, width);
    const y2 = randomInt(0, height);
    const color = randomColor();
    const strokeWidth = randomInt(1, 3);
    lines.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
      `stroke="${color}" stroke-width="${strokeWidth}" opacity="0.5"/>`
    );
  }

  // Noise curves (bezier)
  const curves: string[] = [];
  for (let i = 0; i < 3; i++) {
    const x1 = randomInt(0, width);
    const y1 = randomInt(0, height);
    const cx1 = randomInt(0, width);
    const cy1 = randomInt(0, height);
    const cx2 = randomInt(0, width);
    const cy2 = randomInt(0, height);
    const x2 = randomInt(0, width);
    const y2 = randomInt(0, height);
    const color = randomColor();
    curves.push(
      `<path d="M${x1} ${y1} C${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}" ` +
      `fill="none" stroke="${color}" stroke-width="${randomInt(1, 2)}" opacity="0.6"/>`
    );
  }

  // Noise dots
  const dots: string[] = [];
  for (let i = 0; i < 40; i++) {
    const cx = randomInt(0, width);
    const cy = randomInt(0, height);
    const r = randomInt(1, 3);
    const color = randomColor();
    dots.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.4"/>`);
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${bgColor}"/>`,
    ...lines,
    ...curves,
    ...charElements,
    ...dots,
    `</svg>`,
  ].join('');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
