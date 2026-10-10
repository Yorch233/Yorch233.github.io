/* Shared cloud mascot geometry for Yo.astro, YoCloud and the loader. */

/* whisker/eyebrow strokes (baked in every renderer; exported so the copies
   cannot drift apart again). NOTE: the third subpath is the glasses' bridge
   arch joining the glasses. */
export const WHISKER_D =
	'M63 124.9 Q56 121.3 48 122.2 M137 124.9 Q144 121.3 152 122.2 M95.5 119.6 Q100 115.2 104.5 119.6';

/* The character's square bounding box: cloud silhouette and hanging bow.
   `viewBox` is the art box plus a 3px margin on every side. */
export const YO_BOX = {
	art: { left: 26.56, right: 173.44, top: 40.35, bottom: 187.24 }, // 146.89 × 146.89
	viewBox: '23.56 37.35 152.89 152.89'
};

export const REF_FACE = {
	cy: 124.9,
	left: 78,
	right: 122,
	lensR: 16.5,
	stroke: 4.6,
	ink: '#17181c',
	lens: '#fdf6e3',
	pupilR: 7.8,
	pdx: -3.8,
	pdy: -3,
	hlR: 2.2
};

/* fine glasses details (2px level): inner top-lens reflection arcs, hinge
   dots where the temple arms meet the rims, and nose pads under the bridge */
export const GLASS = {
	hlL: 'M 68.6 119.04 A 13.6 13.6 0 0 1 87.2 117.98',
	hlR: 'M 112.6 119.04 A 13.6 13.6 0 0 1 131.2 117.98',
	hinge: [[62.9, 123.5], [137.1, 123.5]],
	pads: [
		{ cx: 95.4, cy: 131.9, rx: 1.7, ry: 3, rot: -10 },
		{ cx: 104.6, cy: 131.9, rx: 1.7, ry: 3, rot: 10 }
	]
};

/* the bow hangs off the base edge — its bottom closes the square bbox */
export const BOW = {
	rotate: 'rotate(-4 100 177.9)',
	left: 'M 96.5 177.9 Q 81.5 166.9 72.5 171.4 Q 70 177.9 72.5 184.4 Q 81.5 188.9 96.5 177.9 Z',
	right: 'M 103.5 177.9 Q 118.5 166.9 127.5 171.4 Q 130 177.9 127.5 184.4 Q 118.5 188.9 103.5 177.9 Z',
	knot: { x: 93, y: 171.4, w: 14, h: 13, rx: 4 },
	/* 2px-level cloth detail: wing folds, stitches, knot highlight */
	foldL: 'M80.5 172.4 Q76.5 176.4 78.8 181.4',
	foldR: 'M119.5 172.4 Q123.5 176.4 121.2 181.4',
	stitches: [[80.5, 176.4], [85, 179.9], [119.5, 176.4], [115, 179.9]],
	knotHl: 'M95.4 173.3 L95.4 182.1'
};

// A small satin-blue bow sits below Fluffy's glasses, on the lower cloud.
export const FLUFFY_BOW = {
	transform: 'translate(100 153) scale(.78) translate(-100 -177.9)',
	colors: ['#7daeff', '#3a75d0', '#214c9b']
};

/* Dots eyes are small black beans, like the soft toy reference.
   Coordinates are face-group coords; the face lift applies on top. */
export const DOT_EYE = {
	rx: 5.2,
	ry: 8.2
};
/* happy eyes: ^ arcs at the lens centers (the flat-reference idle look) */
export const happyArcs = () =>
	`M${REF_FACE.left - 7.5} ${REF_FACE.cy + 3} Q${REF_FACE.left} ${REF_FACE.cy - 6} ${REF_FACE.left + 7.5} ${REF_FACE.cy + 3} M${REF_FACE.right - 7.5} ${REF_FACE.cy + 3} Q${REF_FACE.right} ${REF_FACE.cy - 6} ${REF_FACE.right + 7.5} ${REF_FACE.cy + 3}`;

/* Homepage cloud: broad domes with smaller side puffs. Gesture hands
   share its surface; face and bow offsets preserve the current look. */
export const YO_CLOUD = {
	core: [100, 126, 42],
	lobes: [[58, 96, 24], [96, 76, 28], [136, 92, 25], [44, 130, 17], [158, 126, 17]],
	hands: [[33, 134], [167, 125]],
	faceDy: -10,
	bowDy: -24.9,
	phone: [148, 94],
	shadowRx: 58
};
