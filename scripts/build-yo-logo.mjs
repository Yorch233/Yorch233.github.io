import { readFile, writeFile } from 'node:fs/promises';
import { yoLogoSvg } from '../src/lib/yo-logo.js';

await writeFile(new URL('../public/logo/yo.svg', import.meta.url), yoLogoSvg());
// Self-contained native SVG surface shared with the animated character.
await writeFile(new URL('../public/logo/yo-fluffy.svg', import.meta.url), yoLogoSvg('fluffy'));

// Embed the transparent PNG unchanged: no tile, background or corner mask.
// Keeping the PNG inline makes the favicon self-contained in browser tabs.
const cutout = await readFile(new URL('../public/logo/yo-cutout-v1-128.png', import.meta.url));
await writeFile(new URL('../public/logo/yo-cutout-v1.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,${cutout.toString('base64')}" /></svg>\n`);
