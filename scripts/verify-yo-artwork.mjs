import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { yoLogoSvg } from '../src/lib/yo-logo.js';

const artwork = yoLogoSvg('fluffy');
assert(!/<image\b|data:image|fluffy-body\.webp/.test(artwork), 'Yo must be entirely SVG.');
const reference = process.argv[2];
if (!reference) throw new Error('Usage: node scripts/verify-yo-artwork.mjs /path/to/reference.png');
const results = [];
for (const width of [120, 240, 800]) {
  const original = await sharp(await readFile(reference)).resize(width, width).ensureAlpha().raw().toBuffer();
  const actual = await sharp(Buffer.from(artwork)).resize(width, width).ensureAlpha().raw().toBuffer();
  let error = 0, squared = 0, intersection = 0, union = 0;
  for (let i = 0; i < original.length; i += 4) {
    const a = original[i + 3] > 128, b = actual[i + 3] > 128;
    if (a && b) intersection++;
    if (a || b) union++;
    for (let c = 0; c < 4; c++) {
      const x = c === 3 ? original[i+c] : original[i+c] * original[i+3] / 255;
      const y = c === 3 ? actual[i+c] : actual[i+c] * actual[i+3] / 255;
      error += Math.abs(x-y); squared += (x-y)**2;
    }
  }
  const meanAbsoluteError = error / original.length, silhouetteIoU = intersection / union;
  assert(meanAbsoluteError < (width === 800 ? 1.5 : 3), `Yo differs from the approved reference at ${width}px.`);
  assert(silhouetteIoU > .98, `Yo silhouette differs from the reference at ${width}px.`);
  results.push({width, meanAbsoluteError, silhouetteIoU, psnr:10*Math.log10(255**2/(squared/original.length))});
}
const output = new URL('../tmp/yo-vector-v2/', import.meta.url);
await mkdir(output, {recursive:true});
await writeFile(new URL('fidelity.json', output), JSON.stringify(results,null,2)+'\n');
if (process.env.SCREENSHOT_DIR) {
  await mkdir(process.env.SCREENSHOT_DIR, {recursive:true});
  await sharp(Buffer.from(artwork)).resize(800,800).png().toFile(process.env.SCREENSHOT_DIR+'/yo-pure-svg.png');
}
console.log(JSON.stringify(results,null,2));
