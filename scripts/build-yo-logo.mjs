import { readFile, writeFile } from 'node:fs/promises';
import { yoLogoSvg } from '../src/lib/yo-logo.js';
import sharp from 'sharp';

// Self-contained native SVG surface shared with the animated character.
await writeFile(new URL('../public/logo/yo-fluffy.svg', import.meta.url), yoLogoSvg());

// Embed the transparent PNG unchanged: no tile, background or corner mask.
// Keeping the PNG inline makes the favicon self-contained in browser tabs.
const cutout = await readFile(new URL('../public/logo/yo-cutout-v1-128.png', import.meta.url));
await writeFile(new URL('../public/logo/yo-cutout-v1.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,${cutout.toString('base64')}" /></svg>\n`);

// Qing's cartoon portrait is the site identity; Yo keeps his own artwork.
const portrait = new URL('../public/profile/profile-refined.webp', import.meta.url);
const circle = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="256" fill="white" /></svg>');
const croppedPortrait = await sharp(await readFile(portrait)).resize(512, 512).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer();
const avatar = await sharp(croppedPortrait).resize(128, 128).png().toBuffer();
await writeFile(new URL('../public/logo/qing-avatar-128.png', import.meta.url), avatar);
await writeFile(new URL('../public/logo/qing-avatar.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,${avatar.toString('base64')}" /></svg>\n`);
await sharp(croppedPortrait).resize(180, 180).png().toFile(new URL('../public/logo/qing-avatar-180.png', import.meta.url).pathname);
