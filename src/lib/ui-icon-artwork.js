import { uiBrandArtwork } from './ui-brand-artwork.js';

// Original 24px SVG drawings; the Yo glyph simplifies the fixed Fluffy mascot.
// Active uses meaningful blue/pale-blue planes; inactive uses restrained gray outlines.
const secondary = 'fill="var(--ui-icon-secondary)" data-icon-tone="secondary"';
const primary = 'fill="currentColor"';
const p = d => `<path ${primary} d="${d}"/>`;
const s = d => `<path ${secondary} d="${d}"/>`;
const path = d => `<path d="${d}"/>`;
const rect = (x, y, w, h, r = 1.3, tone = primary) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${tone}/>`;
const circle = (x, y, r, tone = primary) => `<circle cx="${x}" cy="${y}" r="${r}" ${tone}/>`;
const outline = body => `<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
const stroke = (d, tone = 'currentColor', width = 1.8) => `<path fill="none" stroke="${tone}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${tone.includes('secondary') ? ' data-icon-tone="secondary"' : ''} d="${d}"/>`;
const pair = (line, filled) => ({ line: outline(line), filled });
const cloud = 'M6.3 20a4.3 4.3 0 0 1-.4-8.6 6 6 0 0 1 11.8-.2A4.4 4.4 0 0 1 18 20Z';
const speaker = 'M3.5 9H7l6-5v16l-6-5H3.5Z';
const speakerFilled = p('M3.5 9H7l5.2-4.4a.8.8 0 0 1 1.3.6v13.6a.8.8 0 0 1-1.3.6L7 15H3.5A1.5 1.5 0 0 1 2 13.5v-3A1.5 1.5 0 0 1 3.5 9Z');
const arrowLine = 'M3.5 12h17M13.5 5l7 7-7 7';
const arrowFill = rect(3, 10.4, 14, 3.2, 1.6) + s('M12.8 4.8a1.4 1.4 0 0 1 2 0l6.2 6.2a1.4 1.4 0 0 1 0 2l-6.2 6.2a1.4 1.4 0 1 1-2-2L18 12l-5.2-5.2a1.4 1.4 0 0 1 0-2Z');
// Preserve brand paths while matching the optical margin of the 24px family.
const brandInset = body => `<g transform="translate(2 2) scale(.833333)">${body}</g>`;
const rotate = (body, angle) => `<g transform="rotate(${angle} 12 12)">${body}</g>`;
// Keep the small mascot mark legible without filters, textures or SVG IDs.
const yoSilhouette = 'M5.4 18.3c-2 0-3.7-1.4-3.7-3.5 0-1.8 1.2-3.4 3-3.8C4.6 8.7 6.3 7 8.3 7c.5-2.5 2.1-4 4.2-4 2.9 0 4.6 2.4 4.7 4.9 2.4-.2 4.2 1.6 4.3 3.7 1.3.7 1.8 1.9 1.8 3.2 0 2-1.6 3.5-3.6 3.5Z';
const yoGlasses = '<g fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"><circle cx="8.5" cy="12.6" r="3"/><circle cx="15.5" cy="12.6" r="3"/><path d="M11.5 12.6q.5-.8 1 0M5.5 12l-1-.3m14 .3 1-.3"/></g>';
const yoEyes = '<g fill="currentColor" stroke="none"><ellipse cx="8.5" cy="12.7" rx=".7" ry="1"/><ellipse cx="15.5" cy="12.7" rx=".7" ry="1"/></g>';
const yoBow = 'M11.3 19.2 8.5 18v3.5l2.8-1.2m1.4-1.1 2.8-1.2v3.5l-2.8-1.2';

export const uiIconArtwork = {
 'speech-enhancement': pair(path('M2 7h2l1.5-3L8 10l2-6 2.5 6 2-5 2 4L18 7h4M2 17h4l2-3 3 7 3-10 3 6h5'),
  stroke('M2 7h2l1.5-3L8 10l2-6 2.5 6 2-5 2 4L18 7h4', 'var(--ui-icon-secondary)', 1.5) + stroke('M2 17h4l2-3 3 7 3-10 3 6h5', 'currentColor', 2)),
 'diffusion-models': pair([circle(2.5, 7, .7, ''), circle(3.5, 12, .7, ''), circle(2.5, 17, .7, ''), circle(6.5, 5, .7, ''), circle(6.5, 19, .7, ''), circle(8, 9, 1.3, ''), circle(8, 15, 1.3, ''), circle(11, 12, 1.8, ''), circle(19, 12, 4, '')].join(''),
  [circle(2.5, 7, .9, secondary), circle(3.5, 12, .9, secondary), circle(2.5, 17, .9, secondary), circle(6.5, 5, .9, secondary), circle(6.5, 19, .9, secondary), circle(8, 9, 1.3, secondary), circle(8, 15, 1.3, secondary)].join('') + circle(11, 12, 1.8) + circle(19, 12, 4)),
 'masked-diffusion': pair([3, 9, 15].flatMap(y => [2, 8, 14].filter(x => y !== 3 || x !== 14).map(x => rect(x, y, 4.5, 4.5, 1, ''))).join('') + '<g transform="rotate(12 19.5 4.5)"><rect x="17" y="2" width="5" height="5" rx="1"/></g>',
  [3, 9, 15].flatMap(y => [2, 8, 14].filter(x => y !== 3 || x !== 14).map(x => rect(x, y, 4.5, 4.5, 1, secondary))).join('') + '<g transform="rotate(12 19.5 4.5)">' + rect(17, 2, 5, 5, 1) + '</g>'),
 denoising: pair([circle(3, 8, 1, ''), circle(6, 5, 1, ''), circle(3, 16, 1, ''), circle(6, 19, 1, ''), circle(6.5, 12, 1.2, '')].join('') + path('M10 9v6M14 3v18M18 6v12M22 10v4'),
  [circle(3, 8, 1, secondary), circle(6, 5, 1, secondary), circle(3, 16, 1, secondary), circle(6, 19, 1, secondary), circle(6.5, 12, 1.2, secondary)].join('') + rect(8.8, 8, 2.4, 8, 1.2) + rect(12.8, 2, 2.4, 20, 1.2) + rect(16.8, 5, 2.4, 14, 1.2) + rect(20.8, 9, 2.4, 6, 1.2)),
 dereverberation: pair(path('M2.5 10v4M6.5 6v12M10.5 2v20M14.5 8v8M18.5 6v12M22 9v6'),
  rect(1.3, 9, 2.4, 6, 1.2) + rect(5.3, 5, 2.4, 14, 1.2) + rect(9.3, 1, 2.4, 22, 1.2) + rect(13.3, 7, 2.4, 10, 1.2) + rect(17.5, 5, 2, 14, 1, secondary) + rect(21, 8, 2, 8, 1, secondary)),
 pdf: pair(path('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6') + stroke('M7 18c3-2 6-8 5-9-2-2-2 4 2 6 5 3 5-2 0-1-5 1-8 5-7 4Z', 'currentColor', 1.15),
  p('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z') + s('M14 3v4a2 2 0 0 0 2 2h4Z') + stroke('M7 18c3-2 6-8 5-9-2-2-2 4 2 6 5 3 5-2 0-1-5 1-8 5-7 4Z', 'var(--ui-icon-secondary)', 1.3)),
 arxiv: pair(path('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 11l8 7m0-7-8 7'),
  p('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z') + s('M14 3v4a2 2 0 0 0 2 2h4Z') + stroke('M8 11l8 7m0-7-8 7', 'var(--ui-icon-secondary)', 2.1)),
 // Keep the familiar standard brand silhouette in both interaction states.
 github: { line: brandInset(uiBrandArtwork.github), filled: brandInset(circle(12, 12.15, 11.8, secondary) + uiBrandArtwork.github) },
 orcid: { line: brandInset(uiBrandArtwork.orcid), filled: brandInset(circle(12, 12, 11.8, secondary) + uiBrandArtwork.orcid) },
 huggingface: { line: brandInset(uiBrandArtwork.huggingface), filled: brandInset(circle(12.025, 11.508, 10.3, secondary) + uiBrandArtwork.huggingface) },
 modelscope: pair(path('m12 2 6 3.5v7L12 16l-6-3.5v-7Zm-6 3.5L12 9l6-3.5M12 9v7M6 9l-5 3v7l6 3.5 5-3m-11-7 6 3.5 5-3M7 16v6.5m11-13.5 5 3v7l-6 3.5-5-3m11-7L17 16l-5-3.5M17 16v6.5'),
  p('m6 9-5 3v7l6 3.5 5-3v-7Z') + s('m6 9 6 3.5-5 3.5-6-4Z') + p('m12 2 6 3.5v7L12 16l-6-3.5v-7Z') + s('m12 2 6 3.5L12 9 6 5.5Z') + p('m18 9 5 3v7l-6 3.5-5-3v-7Z') + s('m18 9 5 3-6 4-5-3.5Z') + s('m17 16 6-4v7l-6 3.5Z')),
 dataset: pair('<ellipse cx="12" cy="5" rx="8" ry="3"/>' + path('M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 10c0 1.7 3.6 3 8 3s8-1.3 8-3M4 15c0 1.7 3.6 3 8 3s8-1.3 8-3'),
  p('M4 5h16v14c0 1.7-3.6 3-8 3s-8-1.3-8-3Z') + '<ellipse cx="12" cy="5" rx="8" ry="3" '+secondary+'/>' + stroke('M4 10c0 1.7 3.6 3 8 3s8-1.3 8-3M4 15c0 1.7 3.6 3 8 3s8-1.3 8-3', 'var(--ui-icon-secondary)', 1.2)),
 'sampling-budget': pair(path('M3 12h6m6 0h6') + circle(12, 12, 3, '') + path('M3 9.5v5M21 9.5v5'),
  rect(2, 11, 20, 2, 1, secondary) + rect(2, 9, 2, 6, 1, secondary) + rect(20, 9, 2, 6, 1, secondary) + circle(12, 12, 3.5)),
 refresh: pair(path('M20 9a8.5 8.5 0 0 0-15-3L3 9m0-5v5h5M4 15a8.5 8.5 0 0 0 15 3l2-3m0 5v-5h-5'),
  stroke('M20 9a8.5 8.5 0 0 0-15-3L3 9', 'currentColor', 3) + p('M2 3.8v6h6Z') + stroke('M4 15a8.5 8.5 0 0 0 15 3l2-3', 'var(--ui-icon-secondary)', 3) + s('M22 20.2v-6h-6Z')),
 loading: pair(path('M21 12a9 9 0 1 1-9-9'),
  '<path '+secondary+' fill-rule="evenodd" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 3a7 7 0 1 1-7 7 7 7 0 0 1 7-7Z"/>' + p('M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7Z')),
 yo: pair('<g stroke-width="1.35">' + path(yoSilhouette) + '</g>' + yoGlasses + yoEyes + '<g stroke-width="1.2">' + path(yoBow) + '<rect x="11.2" y="19" width="1.6" height="1.6" rx=".4"/></g>',
  s(yoSilhouette) + yoGlasses + yoEyes + stroke(yoBow, 'currentColor', 1.6) + rect(11.1, 18.9, 1.8, 1.8, .5)),
 home: pair(path('M3 10.2 12 3l9 7.2M5 9v11h5v-6h4v6h5V9'),
  p('M5 9.4 12 4l7 5.4V20a1 1 0 0 1-1 1h-4v-6h-4v6H6a1 1 0 0 1-1-1Z') + s('M2.8 9.6 11.2 3a1.3 1.3 0 0 1 1.6 0l8.4 6.6a1.4 1.4 0 0 1-1.7 2.2L12 5.9l-7.5 5.9a1.4 1.4 0 0 1-1.7-2.2Z')),
 user: pair(circle(12, 7, 3.8, '') + path('M4 20a8 8 0 0 1 16 0Z'),
  circle(12, 6.9, 4.1) + s('M3.6 19.6a8.4 8.4 0 0 1 16.8 0 .9.9 0 0 1-.9.9h-15a.9.9 0 0 1-.9-.9Z')),
 file: pair(path('M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6M8 12h8M8 16h6'),
  p('M14 2.5H6a2.5 2.5 0 0 0-2.5 2.5v14A2.5 2.5 0 0 0 6 21.5h12a2.5 2.5 0 0 0 2.5-2.5V9Z') + s('M14 2.5V7a2 2 0 0 0 2 2h4.5Z') + stroke('M8 12h8M8 16h6', 'var(--ui-icon-secondary)')),
 news: pair(path('M6 5h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8h3Zm0 3v11M10 9h7M14 13h3M14 17h3M9 13h2v4H9Z'),
  rect(6, 4, 15, 17, 2) + s('M3 8h2v11a1 1 0 0 1-2 0Z') + rect(9, 8, 9, 1.8, .8, secondary) + rect(9, 12, 3.7, 6, .8, secondary) + rect(14, 12.2, 4, 1.6, .8, secondary) + rect(14, 16, 4, 1.6, .8, secondary)),
 announcement: pair(path('M4 12c3-1.2 5.5-4 7-7M4 16c3-1 6.6-.4 10 1M4 12a2.1 2.1 0 0 0 0 4M6.5 16l2 5h1l-1.4-5.3M17 6l3-3M18 10h4M18 14l4 1.5M17 18l2 3') + '<ellipse cx="12.5" cy="11" rx="2.5" ry="6.3" transform="rotate(-18 12.5 11)"/>',
  p('M6.1 15.1 8 21.3q.3.8 1 .5l.7-.4-1.4-6.5Z') +
  '<path fill="currentColor" opacity=".72" d="M3.8 11.9C6.6 10.8 9 8 10.5 5.4c.6-1.1 1.4-1.2 2.3-.3 2.2 2.2 3.8 7.6 2.6 10.8-.4 1.2-1.1 1.6-2.3 1.1-3.2-1.4-6.2-1.9-8.8-1.3C2 16.3 1.4 12.9 3.8 11.9Z"/>' +
  '<ellipse cx="12.5" cy="11" rx="2" ry="5.8" transform="rotate(-18 12.5 11)" fill="currentColor"/>' +
  '<path fill="currentColor" opacity=".48" d="m11.1 9.7 2.3.4.9 2-2 2.1Z"/>' +
  s('m16.1 6.5 4-4.1.9 2.4-4.1 3.1Zm1.2 2.9 5.7-.4-.2 1.9-5.4-.4Zm.5 3.3 5.2 1.1-.5 2.5-5.3-2.4Zm-1.5 3.8 3.7 3.6-1.7 1.6-3-4.2Z')),
 trophy: pair(path('M6 3h12v5a6 6 0 0 1-12 0ZM6 5H3v2a4 4 0 0 0 4 4m11-6h3v2a4 4 0 0 1-4 4M12 14v4M8 21v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1Z'),
  stroke('M6 5H3v2a4 4 0 0 0 4 4m11-6h3v2a4 4 0 0 1-4 4', 'var(--ui-icon-secondary)', 2.4) + p('M6 2.8h12V8a6 6 0 0 1-12 0Z') + rect(10.7, 13, 2.6, 5, .7) + p('M8 18h8l1 3H7Z')),
 mail: pair('<rect x="3" y="5" width="18" height="14" rx="2"/>' + path('m3.8 6.5 7 5.6a2 2 0 0 0 2.4 0l7-5.6'),
  rect(2.5, 4.5, 19, 15, 2.4) + s('M4.9 4.5h14.2a2.4 2.4 0 0 1 2.3 1.7l-8.2 6.5a2 2 0 0 1-2.4 0L2.6 6.2a2.4 2.4 0 0 1 2.3-1.7Z')),
 cv: pair('<rect x="2.5" y="4.5" width="19" height="15" rx="2"/>' + circle(7.6, 9, 1.8, '') + path('M4.8 15a2.8 2.8 0 0 1 5.6 0ZM13.5 8h4.5M13.5 12h4.5M13.5 16h3'),
  rect(2.5, 4.5, 19, 15, 2.4) + circle(7.5, 9, 2, secondary) + s('M4.6 15.6a2.9 2.9 0 0 1 5.8 0Z') + stroke('M13.5 8h4.5M13.5 12h4.5M13.5 16h3', 'var(--ui-icon-secondary)')),
 cap: pair(path('m2 8 10-5 10 5-10 5ZM6 10v6a10 10 0 0 0 12 0v-6M21 9v8m0 0-1 3h2Z'),
  s('M6 9h12v7a10 10 0 0 1-12 0Z') + p('m2 7.5 9.4-4.7a1.3 1.3 0 0 1 1.2 0L22 7.5 12 12.8Z') + stroke('M21 8v9', 'currentColor', 1.6) + circle(21, 18, 1.3)),
 people: pair(circle(8, 7, 3.2, '') + circle(17, 9, 2.6, '') + path('M2 20a6 6 0 0 1 12 0Zm12-5a5 5 0 0 1 8 4v1h-6'),
  circle(17, 9, 2.9, secondary) + s('M13 16a5 5 0 0 1 9 3v1H13Z') + circle(8, 7, 3.5) + p('M1.7 19.7a6.3 6.3 0 0 1 12.6 0V21H1.7Z')),
 pin: pair(path('M18.5 9.5C18.5 14 12 19 12 19S5.5 14 5.5 9.5a6.5 6.5 0 0 1 13 0Z') + circle(12, 9.3, 2.1, '') + path('M7 18c-3 1-3 3 5 3s8-2 5-3'),
  '<ellipse cx="12" cy="20" rx="6.5" ry="1.7" '+secondary+'/>' + p('M19 9.4c0 4.7-7 10-7 10s-7-5.3-7-10a7 7 0 0 1 14 0Z') + circle(12, 9, 2.4, secondary)),
 wave: pair(path('M3 10v4M7.5 7v10M12 4v16M16.5 7v10M21 10v4'),
  rect(1.8, 9, 2.4, 6, 1.2, secondary) + rect(6.3, 6, 2.4, 12, 1.2) + rect(10.8, 3, 2.4, 18, 1.2) + rect(15.3, 6, 2.4, 12, 1.2) + rect(19.8, 9, 2.4, 6, 1.2, secondary)),
 cube: pair(path('m12 2.8 9 5.1v8.2l-9 5.1-9-5.1V7.9Zm-9 5.1 9 5.2 9-5.2M12 13.1v8.1'),
  s('m12 2.8 9 5.1-9 5.2-9-5.2Z') + p('m3 9.3 8.2 4.8v7.1L3 16.5Z') + s('m13 14.1 8-4.8v7.2l-8 4.7Z')),
 nodes: pair(path('m10.1 6.8-4.2 8.4M13.9 6.8l4.2 8.4M8 18h8') + circle(12, 4.8, 2.8, '') + circle(5.2, 18, 2.8, '') + circle(18.8, 18, 2.8, ''),
  stroke('m10.1 6.8-4.2 8.4M13.9 6.8l4.2 8.4M8 18h8', 'var(--ui-icon-secondary)', 2.2) + circle(12, 4.8, 3.1) + circle(5.2, 18, 3.1) + circle(18.8, 18, 3.1)),
 layers: pair(path('m12 3 10 5-10 5L2 8Zm-8.5 9 8.5 4.3 8.5-4.3M3.5 16l8.5 4.3 8.5-4.3'),
  s('m3 15.5 9 4.5 9-4.5 1.5 1.8L12 22 1.5 17.3Z') + s('m3 10.5 9 4.5 9-4.5 1.5 1.8L12 17 1.5 12.3Z') + p('m12 2 10.5 5.3L12 12.5 1.5 7.3Z')),
 external: pair(path('M13 3h8v8M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5'),
  stroke('M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5', 'currentColor', 2.5) + stroke('M13 3h8v8M21 3l-9 9', 'var(--ui-icon-secondary)', 2.6)),
 terminal: pair(rect(3, 4, 18, 16, 2.5, '') + path('m7 9 3 3-3 3m6 0h4'),
  rect(3, 4, 18, 16, 2.5, secondary) + stroke('m7 9 3 3-3 3m6 0h4', 'currentColor', 2)),
 quotes: pair(path('M4 6h6v6c0 4-2 6-5 7v-3c1.5-.7 2-1.7 2-3H4Zm10 0h6v6c0 4-2 6-5 7v-3c1.5-.7 2-1.7 2-3h-3Z'),
  p('M4 6h6v6c0 4-2 6-5 7v-3c1.5-.7 2-1.7 2-3H4Z') + s('M14 6h6v6c0 4-2 6-5 7v-3c1.5-.7 2-1.7 2-3h-3Z')),
 code: pair(path('m8 5-6 7 6 7m8-14 6 7-6 7'),
  stroke('m8 5-6 7 6 7', 'currentColor', 2.8) + stroke('m16 5 6 7-6 7', 'var(--ui-icon-secondary)', 2.8)),
 copy: pair(path('M9 6V4a2 2 0 0 1 2-2h7l3 3v11a2 2 0 0 1-2 2h-1M14 7H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V11Zm0 0v4h4M7 14h7M7 18h5'),
  s('M9 6V4a2 2 0 0 1 2-2h7l3 3v11a2 2 0 0 1-2 2H9Z') + p('M14 7H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V11Z') + s('M14 7v4h4Z') + stroke('M7 14h7M7 18h5', 'var(--ui-icon-secondary)', 1.6)),
 download: pair(path('M12 2v12m-5-5 5 5 5-5M6 16a2.5 2.5 0 0 0 0 5h12a2.5 2.5 0 0 0 0-5h-1l-5 2.5L7 16Z'),
  s('M6 16a2.5 2.5 0 0 0 0 5h12a2.5 2.5 0 0 0 0-5h-1l-5 2.5L7 16Z') + p('M10.5 2.5a1.5 1.5 0 0 1 3 0V10H17l-5 5.5L7 10h3.5Z')),
 check: pair(circle(12, 12, 9, '') + path('m7.5 12 3 3 6-6'),
  circle(12, 12, 9.5) + stroke('m7.5 12 3 3 6-6', 'var(--ui-icon-secondary)', 2.6)),
 search: pair(circle(10, 10, 6.8, '') + path('m15 15 6 6'),
  s('m15.6 14.3 6.1 6.1a1.8 1.8 0 0 1-2.6 2.5l-6-6Z') + '<path fill="currentColor" fill-rule="evenodd" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 2.7a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Z"/>'),
 settings: pair(path('M3 5h10m4 0h4M3 12h3m4 0h11M3 19h11m4 0h3') + circle(15, 5, 2, '') + circle(8, 12, 2, '') + circle(16, 19, 2, ''),
  stroke('M3 5h18M3 19h18', 'currentColor', 2.2) + stroke('M3 12h18', 'var(--ui-icon-secondary)', 2.2) + circle(15, 5, 2.8, secondary) + circle(8, 12, 2.8) + circle(16, 19, 2.8, secondary)),
 menu: pair(path('M3 5h18M3 12h18M3 19h18'),
  rect(3, 3.8, 18, 2.4, 1.2) + rect(3, 10.8, 18, 2.4, 1.2, secondary) + rect(3, 17.8, 18, 2.4, 1.2)),
 close: pair(path('m5 5 14 14M19 5 5 19'),
  stroke('M19 5 5 19', 'var(--ui-icon-secondary)', 2.8) + stroke('m5 5 14 14', 'currentColor', 2.8)),
 plus: pair(path('M12 4v16M4 12h16'),
  rect(10.6, 3, 2.8, 18, 1.4) + rect(3, 10.6, 18, 2.8, 1.4, secondary)),
 maximize: pair(path('M14 4h6v6M20 4l-6 6M4 14v6h6M4 20l6-6'),
  stroke('M14 4h6v6M20 4l-6 6', 'currentColor', 2.5) + stroke('M4 14v6h6M4 20l6-6', 'var(--ui-icon-secondary)', 2.5)),
 minimize: pair(path('M14 4v6h6M14 10l6-6M4 14h6v6M10 14l-6 6'),
  stroke('M14 4v6h6M14 10l6-6', 'currentColor', 2.5) + stroke('M4 14h6v6M10 14l-6 6', 'var(--ui-icon-secondary)', 2.5)),
 minus: pair(path('M4 12h16'),
  rect(3, 10.4, 18, 3.2, 1.6) + s('M4.6 10.4H12v1.6H3a1.6 1.6 0 0 1 1.6-1.6Z')),
 play: pair(path('M6 3.8v16.4L20 12Z'),
  p('M5.5 4.6a1.3 1.3 0 0 1 2-1.1l12.2 7.4a1.3 1.3 0 0 1 0 2.2L7.5 20.5a1.3 1.3 0 0 1-2-1.1Z') + s('M7.5 3.5 19.7 11a1.3 1.3 0 0 1 .6 1H5.5V4.6a1.3 1.3 0 0 1 2-1.1Z')),
 pause: pair('<rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/>',
  rect(4.5, 3, 5, 18, 1.5) + rect(14.5, 3, 5, 18, 1.5, secondary)),
 replay: pair(path('M13 3v5l5-2.5ZM11 4a8.5 8.5 0 1 0 9 8'),
  stroke('M11 4a8.5 8.5 0 1 0 9 8', 'currentColor', 2.8) + s('M12 1.8v7.5L18.4 6Z')),
 audio: pair(path(speaker + 'M17 8a7 7 0 0 1 0 8m3-12a12 12 0 0 1 0 16'),
  speakerFilled + stroke('M17 8a7 7 0 0 1 0 8m3-12a12 12 0 0 1 0 16', 'var(--ui-icon-secondary)', 2.2)),
 'volume-low': pair(path(speaker + 'M18 8a7 7 0 0 1 0 8'),
  speakerFilled + stroke('M18 8a7 7 0 0 1 0 8', 'var(--ui-icon-secondary)', 2.2)),
 'volume-off': pair(path('M13 7V4L8 8M5 9H3.5v6H7l6 5v-8M3 3l18 18'),
  speakerFilled + stroke('M2.5 2.5l19 19', 'var(--ui-icon-secondary)', 2.8)),
 spectrogram: pair('<rect x="3" y="3" width="18" height="18" rx="2"/>' + path('M9 4v16M15 4v16M4 9h16M4 15h16'),
  rect(3, 3, 18, 18, 2) + [6, 10.5, 15].flatMap((y, i) => [6, 10.5, 15].map((x, j) => rect(x, y, 3, 3, .7, (i + j) % 2 === 0 ? secondary : 'fill="white"'))).join('')),
 'bar-chart': pair(path('M2.5 21.5h19') + '<rect x="4" y="13" width="3" height="6" rx=".6"/><rect x="10.5" y="8" width="3" height="11" rx=".6"/><rect x="17" y="3" width="3" height="16" rx=".6"/>',
  rect(3.5, 13, 4, 7, 1, secondary) + rect(10, 8, 4, 12, 1, secondary) + rect(16.5, 3, 4, 17, 1) + rect(2, 21, 20, 1.5, .75)),
 'line-chart': pair(path('M4 17v4h16V5M4 17C8 17 8 11 12 10S18 8 20 4') + circle(4, 17, 1.7, '') + circle(12, 10, 1.7, '') + circle(20, 4, 1.7, ''),
  s('M4 17C8 17 8 11 12 10S18 8 20 4v17H4Z') + stroke('M4 17C8 17 8 11 12 10S18 8 20 4', 'currentColor', 1.8) + circle(4, 17, 2.2) + circle(12, 10, 2.2) + circle(20, 4, 2.2)),
 sun: pair(circle(12, 12, 4.3, '') + path('M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'),
  circle(12, 12, 5) + stroke('M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', 'var(--ui-icon-secondary)', 2.3)),
 moon: pair(path('M20.5 15a9 9 0 1 1-11-12.1 9.7 9.7 0 0 0 11 12.1Z'),
  p('M20.8 14.6A9.5 9.5 0 1 1 10.2 2.5a9.4 9.4 0 0 0 10.6 12.1Z') + s('M10.2 2.5a9.4 9.4 0 0 0 10.6 12.1 7 7 0 0 1-10.6-12.1Z')),
 cloud: pair(path('M10 6a5 5 0 0 1 9 3 4 4 0 0 1 1 7') + path(cloud),
  s('M7.5 9a5.8 5.8 0 0 1 11.3-.9 4.3 4.3 0 0 1 1 8.4H8Z') + p(cloud)),
 sparkle: pair(path('M9 5c1 5 3 7 7 8-4 1-6 3-7 8-1-5-3-7-7-8 4-1 6-3 7-8ZM19 2c.5 2.5 1.5 3.5 4 4-2.5.5-3.5 1.5-4 4-.5-2.5-1.5-3.5-4-4 2.5-.5 3.5-1.5 4-4Z'),
  p('M9 5c1 5 3 7 7 8-4 1-6 3-7 8-1-5-3-7-7-8 4-1 6-3 7-8Z') + s('M19 2c.5 2.5 1.5 3.5 4 4-2.5.5-3.5 1.5-4 4-.5-2.5-1.5-3.5-4-4 2.5-.5 3.5-1.5 4-4Z')),
 'arrow-right': pair(path(arrowLine), arrowFill),
 'arrow-left': pair(rotate(path(arrowLine), 180), rotate(arrowFill, 180)),
 'arrow-up': pair(rotate(path(arrowLine), -90), rotate(arrowFill, -90)),
 'arrow-down': pair(rotate(path(arrowLine), 90), rotate(arrowFill, 90)),
};

// Small particle rings and tile gaps need a lighter outline at the native grid.
for (const id of ['speech-enhancement', 'diffusion-models', 'masked-diffusion']) {
 uiIconArtwork[id].line = uiIconArtwork[id].line.replace('stroke-width="1.7"', 'stroke-width="1.2"');
}
