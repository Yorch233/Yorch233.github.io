/* Shared mascot geometry for Yo.astro and YoCloud. */

/* The character's square bounding box: cloud silhouette and hanging bow.
   `viewBox` is the art box plus a 3px margin on every side. */
export const YO_BOX = {
	viewBox: '23.56 37.35 152.89 152.89'
};

export const REF_FACE = {
	cy: 124.9
};

/* the bow hangs off the base edge — its bottom closes the square bbox */
export const BOW = {
	left: 'M 96.5 177.9 Q 81.5 166.9 72.5 171.4 Q 70 177.9 72.5 184.4 Q 81.5 188.9 96.5 177.9 Z',
	right: 'M 103.5 177.9 Q 118.5 166.9 127.5 171.4 Q 130 177.9 127.5 184.4 Q 118.5 188.9 103.5 177.9 Z',
	knot: { x: 93, y: 171.4, w: 14, h: 13, rx: 4 },
	/* 2px-level cloth detail: wing folds and knot highlight */
	foldL: 'M80.5 172.4 Q76.5 176.4 78.8 181.4',
	foldR: 'M119.5 172.4 Q123.5 176.4 121.2 181.4',
	knotHl: 'M95.4 173.3 L95.4 182.1'
};

// A small satin-blue bow sits below Fluffy's glasses, on the lower cloud.
export const FLUFFY_BOW = {
	transform: 'translate(100 153) scale(.78) translate(-100 -177.9)',
	colors: ['#7daeff', '#3a75d0', '#214c9b']
};

/* Shared placement of the homepage mascot’s hands, face and shadow. */
export const YO_CLOUD = {
	hands: [[33, 134], [167, 125]],
	faceDy: -10,
	shadowRx: 58
};
