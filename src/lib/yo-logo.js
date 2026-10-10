import { fluffySurface } from './yo-fluffy-svg.js';
import { BOW, FLUFFY_BOW, DOT_EYE, REF_FACE, YO_BOX, YO_CLOUD } from './yo-fluff.js';
import { blueMaterialDefs } from './yo-material.js';

// Version the URL so browsers replace their cached favicon and watermarks.
export const YO_LOGO_URLS = {
	blue: '/logo/yo.svg?v=cartoon-blue-20261003',
	fluffy: '/logo/yo-fluffy.svg?v=fluffy-svg-faithful-20261007'
};
export const YO_LOGO_URL = YO_LOGO_URLS.fluffy;

/* Static artwork matches YoCloud's resting pose. Only internal, fixed
   geometry enters this markup; each inline instance supplies a unique ID. */
export function yoLogoArtwork(id, mood = 'idle', form = 'blue') {
	const paint = (name) => `url(#${id}-${name})`;
	const circle = ([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" />`;
	const ink = '#222326';
	if (form === 'fluffy') return `<defs>
	<radialGradient id="${id}-eye" cx="30%" cy="24%" r="75%">
		<stop offset="0" stop-color="#303239" /><stop offset="1" stop-color="#1c1e24" />
	</radialGradient>
	<radialGradient id="${id}-shadow">
		<stop offset="0" stop-color="#5275a7" /><stop offset="1" stop-color="#5275a7" stop-opacity="0" />
	</radialGradient>
	<linearGradient id="${id}-bow" x2="0" y2="1">
		${FLUFFY_BOW.colors.map((color, i) => `<stop offset="${[0, .4, 1][i]}" stop-color="${color}" />`).join('')}
	</linearGradient>
</defs>
<ellipse class="yo-shadow" cx="100" cy="181" rx="${YO_CLOUD.shadowRx}" ry="9" fill="${paint('shadow')}" opacity=".24" />
<g class="yo-body">${fluffySurface(id)}</g>
<g transform="translate(0 ${YO_CLOUD.faceDy})">
	<path d="M98 124 Q100 119 102 124" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round" />
	${[82, 118].map((cx) => `<circle cx="${cx}" cy="${REF_FACE.cy}" r="16" fill="#fff" fill-opacity=".05" stroke="${ink}" stroke-width="3.2" />`).join('\n\t')}
	<path d="M66 124 L61 122 M134 124 L139 122" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round" />
	<g class="yo-eyes">
		${mood === 'happy' ? `<path d="M74 126 Q82 115 90 126 M110 126 Q118 115 126 126" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" />` : `<g class="yo-pupils">${[82, 118].map((cx) => `<ellipse cx="${cx}" cy="${REF_FACE.cy}" rx="4.5" ry="6.5" fill="${paint('eye')}" />`).join('')}</g>`}
	</g>
</g>
<g class="yo-bow" transform="${FLUFFY_BOW.transform}" fill="${paint('bow')}">
	<path d="${BOW.left}" /><path d="${BOW.right}" />
	<rect x="${BOW.knot.x}" y="${BOW.knot.y}" width="${BOW.knot.w}" height="${BOW.knot.h}" rx="${BOW.knot.rx}" />
	<g fill="none" stroke="#c9dfff" stroke-width="1.2" stroke-linecap="round" opacity=".65"><path d="${BOW.foldL}" /><path d="${BOW.foldR}" /><path d="${BOW.knotHl}" /></g>
</g>`;
	return `<defs>
	${blueMaterialDefs(id)}
	<radialGradient id="${id}-eye" cx="30%" cy="24%" r="75%">
		<stop offset="0" stop-color="#303239" /><stop offset="1" stop-color="#1c1e24" />
	</radialGradient>
	<radialGradient id="${id}-shadow">
		<stop offset="0" stop-color="#5275a7" /><stop offset="1" stop-color="#5275a7" stop-opacity="0" />
	</radialGradient>
	<linearGradient id="${id}-bow" x2="0" y2="1">
		<stop offset="0" stop-color="#44464a" /><stop offset=".4" stop-color="#292b2e" /><stop offset="1" stop-color="#18191b" />
	</linearGradient>
</defs>
<ellipse class="yo-shadow" cx="100" cy="181" rx="${YO_CLOUD.shadowRx}" ry="9" fill="${paint('shadow')}" opacity=".24" />
<g class="yo-body" filter="${paint('goo')}" fill="${paint('body')}">
	${circle(YO_CLOUD.core)}
	${YO_CLOUD.lobes.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${paint('dome')}" />`).join('\n\t')}
</g>
<g transform="translate(0 ${YO_CLOUD.faceDy})">
	<path d="M95 124 Q100 119 105 124" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round" />
	${[REF_FACE.left, REF_FACE.right].map((cx) => `<circle cx="${cx}" cy="${REF_FACE.cy}" r="17" fill="#fff" fill-opacity=".05" stroke="${ink}" stroke-width="3.2" />`).join('\n\t')}
	<path d="M61 124 L56 122 M139 124 L144 122" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round" />
	<g class="yo-eyes">
		${mood === 'happy' ? `<path d="M70 126 Q78 115 86 126 M114 126 Q122 115 130 126" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round" />` : `<g class="yo-pupils">${[REF_FACE.left, REF_FACE.right].map((cx) => `<ellipse cx="${cx}" cy="${REF_FACE.cy}" rx="${DOT_EYE.rx}" ry="${DOT_EYE.ry}" fill="${paint('eye')}" />`).join('')}</g>`}
	</g>
</g>
<g transform="translate(0 ${YO_CLOUD.bowDy})" fill="${paint('bow')}">
	<path d="${BOW.left}" /><path d="${BOW.right}" />
	<rect x="${BOW.knot.x}" y="${BOW.knot.y}" width="${BOW.knot.w}" height="${BOW.knot.h}" rx="${BOW.knot.rx}" />
</g>`;
}

export function yoLogoSvg(form = 'blue') {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${YO_BOX.viewBox}">\n${yoLogoArtwork('yo-logo', 'idle', form)}\n</svg>\n`;
}
