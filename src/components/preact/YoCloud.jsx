import { useEffect, useId, useLayoutEffect, useMemo, useRef } from 'preact/hooks';
import { REF_FACE, BOW, FLUFFY_BOW, YO_BOX, DOT_EYE, YO_CLOUD as shape } from '../../lib/yo-fluff.js';
import '../../styles/yo-cloud.css';
import { blueMaterialDefs } from '../../lib/yo-material.js';
import { bluePuffMotion } from '../../lib/yo-flow.js';
import { yoPose, YO_PROPS } from '../../lib/yo-pose.js';
import YoProps from './YoProps.jsx';
import { fluffySurface } from '../../lib/yo-fluffy-svg.js';

const INK = '#222326';
const CLOSED = new Set(['sleepy', 'sleeping']);
const GESTURES = new Set(['happy', 'surprised', 'thinking', 'boring', 'hungry', 'speaking', 'embarrassed']);
const curve = (x) => Math.max(-1, Math.min(1, x));
const ease = (x) => { const value = Math.max(0, Math.min(1, x)); return value * value * (3 - 2 * value); };

/* One SVG and one animation loop. Face, bow and paws travel with a single
   body group; continuous gaze lives in refs instead of Preact state.
   Paint IDs remain unique alongside the page's other mascot artwork. */
export default function YoCloud({
	form = 'fluffy',
	label = 'Pet Yo, the little cloud',
	mood = 'idle',
	gaze = null,
	focus = false,
	quiet = false,
	peek = false,
	children,
	class: className = '',
	onPet,
	onVisibilityChange,
	ariaExpanded,
	ariaControls,
	ariaDescribedBy
}) {
	const fluffy = form === 'fluffy';
	const eyeCenters = fluffy ? [82, 118] : [REF_FACE.left, REF_FACE.right];
	const lensRadius = fluffy ? 16 : 17;
	const id = 'yo-' + useId().replace(/:/g, '');
	const bodyArtwork = useMemo(() => fluffySurface(id), [id]);
	const paint = (name) => 'url(#' + id + '-' + name + ')';
	const svg = useRef(null);
	const body = useRef(null);
	const eyes = useRef(null);
	const face = useRef(null);
	const pupils = useRef([]);
	const shadow = useRef(null);
	const paw = useRef(null);
	const leftPaw = useRef(null);
	const puffs = useRef([]);
	const heart = useRef(null);
	const props = useRef({});
	const mouth = useRef(null);
	const blush = useRef(null);
	const initialHands = useRef(!quiet && GESTURES.has(mood) ? 1 : 0);
	const live = useRef({ mood, gaze, focus, quiet, onVisibilityChange, actionAge: 0, propAge: 0, prop: null, propWeight: 0, faceDy: shape.faceDy, point: null, pointAt: -10000, rect: null, x: 0, y: 0, lean: 0, hands: initialHands.current, lastFrame: 0, petAt: -10000, render: null, sync: null });
	const eyeStyle = mood === 'happy' ? 'arcs' : CLOSED.has(mood) ? 'lids' : 'dots';

	useLayoutEffect(() => {
		if (live.current.mood !== mood) { live.current.waking = live.current.mood === 'sleeping'; live.current.actionAge = 0; }
		Object.assign(live.current, { mood, gaze, focus, quiet, onVisibilityChange, faceDy: shape.faceDy });
		// Re-arm the sole frame loop after discrete changes as well as quiet-mode
		// changes; media/visibility events can otherwise leave a canceled frame.
		live.current.sync?.();
	}, [mood, gaze, focus, quiet, onVisibilityChange]);

	useEffect(() => {
		const element = svg.current;
		if (!element) return undefined;
		const propParts = new Map();
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		const startedAt = performance.now();
		let motionTime = 0;
		let freedom = 0;
		let nextBlink = startedAt + 1200;
		let blinkAt = -10000;
		let blinkCount = 0;
		let nextLook = startedAt + 2200;
		let lookAt = -10000;
		let lookCount = 0;
		let raf = 0;
		let visible = true;
		const measure = () => { live.current.rect = element.getBoundingClientRect(); };
		const move = (event) => {
			if (event.pointerType === 'touch' || live.current.quiet || live.current.mood === 'hidden' || reduce.matches || document.hidden || !visible) return;
			live.current.point = { x: event.clientX, y: event.clientY };
			live.current.pointAt = performance.now();
			live.current.rect = null; // Measure once in the next frame.
			if (performance.now() - live.current.lastFrame > 200) live.current.sync?.();
		};
		const render = (time, settled = false) => {
			const current = live.current;
			const constrained = reduce.matches || current.quiet || current.mood === 'hidden' || document.hidden || !visible;
			const still = settled || constrained;
			element.dataset.motion = still ? 'static' : 'running';
			const elapsed = Math.max(0, Math.min(50, time - current.lastFrame));
			current.lastFrame = time;
			if (!still) motionTime += elapsed;
			element.dataset.clock = String(motionTime);
			const t = motionTime / 1000;
			if (!still) current.actionAge += elapsed;
			const pose = yoPose(current.mood, current.actionAge, constrained);
			const calm = CLOSED.has(current.mood) ? 0.3 : 1;
			const float = still ? 0 : pose.lift + Math.sin(t * .9) * 1.3 * calm;
			const drift = still ? 0 : Math.sin(t * .7) * 1.2 * calm;
			const age = time - current.petAt;
			const pet = !still && age >= 0 && age < 800 ? Math.sin(age / 800 * Math.PI * 2) * Math.exp(-age / 290) * 0.04 : 0;
			const scale = (still ? 1 : 1 + Math.sin(t * .9) * .012 * calm + pet) * pose.scale;
			shadow.current?.setAttribute('opacity', String((0.24 - float * 0.014) * pose.opacity));
			shadow.current?.setAttribute('transform', 'translate(100 181) scale(' + (1 - float * .008) + ' 1) translate(-100 -181)');
			const pointer = current.gaze ?? current.point;
			const pointerActive = Boolean(current.gaze) || (pointer && time - current.pointAt < 1800);
			if (pointer && !current.rect) measure();
			const rect = current.rect;
			let dx = current.focus ? 0.7 : 0;
			let dy = 0.1;
			if (pointerActive && rect?.width > 0 && !still) {
				dx = curve((pointer.x - (rect.left + rect.width * 0.5)) / (rect.width * 0.7)) * 2.5;
				dy = curve((pointer.y - (rect.top + rect.height * 0.51)) / (rect.height * 0.7)) * 2.1;
			}
			// Brief looks between interactions keep Yo curious without taking
			// over the pointer. Unequal gaps avoid a metronomic idle cycle.
			if (!still && !CLOSED.has(current.mood) && time >= nextLook) {
				lookAt = time;
				lookCount += 1;
				nextLook = time + 4200 + (Math.sin(lookCount * 2.1) + 1) * 850;
			}
			const lookAge = time - lookAt;
			const looking = !still && !pointerActive && !CLOSED.has(current.mood)
				? ease(lookAge / 350) * ease((2200 - lookAge) / 500) : 0;
			dx += Math.sin(lookCount * 2.4) * 2.1 * looking;
			dy += (Math.cos(lookCount * 1.7) * 1.2 - .3) * looking;
			if (current.mood !== 'idle') { dx = pose.x; dy = pose.y; }
			if (current.mood === 'listening') dy -= .6;
			if (CLOSED.has(current.mood)) { dx = 0; dy = .5; }
			const follow = still ? 1 : 1 - Math.exp(-elapsed / 75);
			current.x += (dx - current.x) * follow;
			current.y += (dy - current.y) * follow;
			const lean = pose.tilt;
			current.lean += (lean - current.lean) * follow;
			const sway = still ? 0 : (Math.sin(t * 1.23) * 1.9 * calm + current.x * .7 + current.lean);
			body.current?.setAttribute('transform', 'translate(' + (100 + drift) + ' ' + (130 + float) + ') rotate(' + sway + ') scale(' + scale + ' ' + (2 - scale) + ') translate(-100 -130)');
			// Presence scales the whole cloud and all accessories together.
			if (['appearing','disappearing','hidden'].includes(current.mood)) body.current?.setAttribute('transform', `translate(100 130) scale(${pose.scale}) translate(-100 -130)`);
			body.current?.setAttribute('opacity', String(pose.opacity));
			// Only the little right tail drifts away; the body keeps flowing.
			// Keep the face anchored; attention eases the tail back into place.
			const flowTarget = !still && ['idle', 'spacey'].includes(current.mood) ? 1 : 0;
			freedom += (flowTarget - freedom) * (still ? 1 : 1 - Math.exp(-elapsed / 450));
			shape.lobes.forEach(([cx, cy], i) => {
				const room = current.rect?.width < 160 ? .45 : 1;
				const motion = bluePuffMotion(t, i, still ? 0 : (.4 + .6 * freedom) * calm, freedom * room);
				const { x, y, scale: swell, stretch } = motion;
				puffs.current[i]?.setAttribute('transform', 'translate(' + (cx + x) + ' ' + (cy + y) + ') scale(' + (swell + stretch) + ' ' + (swell - stretch) + ') translate(' + (-cx) + ' ' + (-cy) + ')');
			});
			face.current?.setAttribute('transform', 'translate(' + (current.x * .4) + ' ' + (current.faceDy + current.y * .3) + ')');
			pupils.current.forEach((pupil) => pupil?.setAttribute('transform', 'translate(' + current.x + ' ' + current.y + ')'));
			if (!still && !CLOSED.has(current.mood) && time >= nextBlink) {
				blinkAt = time;
				blinkCount += 1;
				nextBlink = time + 2200 + (Math.sin(blinkCount * 2.3) + 1) * 650;
			}
			const blinkAge = time - blinkAt;
			const lidAge = blinkCount % 3 === 0 && blinkAge >= 240 ? blinkAge - 240 : blinkAge;
			let blink = !still && !CLOSED.has(current.mood) && lidAge >= 0 && lidAge < 160
				? 1 - Math.sin(lidAge / 160 * Math.PI) ** 2 * .93 : 1;
			if (current.waking && !still) blink *= Math.max(.03, ease(current.actionAge / 500));
			eyes.current?.setAttribute('transform', 'translate(0 ' + REF_FACE.cy + ') scale(1 ' + blink + ') translate(0 ' + (-REF_FACE.cy) + ')');
			const wave = still ? 0 : Math.sin(t * 3.6) * 7 - 10;
			const showHands = GESTURES.has(current.mood) ? (constrained ? .75 : pose.gesture) : 0;
			current.hands += (showHands - current.hands) * (constrained ? 1 : 1 - Math.exp(-elapsed / 180));
			if (Math.abs(showHands - current.hands) < .001) current.hands = showHands;
			[ leftPaw.current, paw.current ].forEach((hand, i) => {
				const [cx, cy] = shape.hands[i];
				let tuck = ((1 - current.hands) * 12 - current.hands * 4) * (i ? -1 : 1);
				let lift = current.hands * (i ? 9 : 3);
				if (i && ['thinking', 'boring', 'embarrassed'].includes(current.mood)) { tuck = -40 * current.hands; lift = current.mood === 'embarrassed' ? 10 * current.hands : -8 * current.hands; }
				if (current.mood === 'hungry') { tuck = (i ? -42 : 44) * current.hands; lift = -22 * current.hands; }
				const size = .2 + current.hands * .8;
				hand?.setAttribute('opacity', String(i === 0 && ['thinking','boring','embarrassed','speaking'].includes(current.mood) ? 0 : current.hands));
				hand?.setAttribute('transform', 'translate(' + (cx + tuck) + ' ' + (cy - lift) + ') rotate(' + (i ? wave : still ? 0 : pet * 60) + ') scale(' + size + ') translate(' + (-cx) + ' ' + (-cy) + ')');
			});
			mouth.current?.setAttribute('opacity', String(pose.mouth));
			mouth.current?.setAttribute('ry', String(still ? 2 : 1.5 + pose.mouth * (1 + Math.sin(current.actionAge / 230))));
			blush.current?.setAttribute('opacity', String(pose.blush));
			// Retract one prop before introducing the next. Never overlap rigs.
			const targetProp = YO_PROPS.includes(current.mood) ? current.mood : null;
			const hidden = ['appearing','disappearing','hidden'].includes(current.mood);
			if (hidden) { current.propWeight = 0; current.prop = null; }
			if (constrained) { current.prop = hidden ? null : targetProp; current.propWeight = current.prop ? 1 : 0; }
			else if (current.prop !== targetProp && current.propWeight > 0) current.propWeight = Math.max(0, current.propWeight - elapsed / 300);
			else { if (current.prop !== targetProp) { current.prop = targetProp; current.propAge = 0; } current.propWeight = current.prop ? Math.min(1, current.propWeight + elapsed / 300) : 0; }
			if (!still) current.propAge += elapsed;
			for (const name of YO_PROPS) {
				const element = props.current[name];
				const weight = name === current.prop ? current.propWeight : 0;
				element?.setAttribute('display', weight > 0 ? 'inline' : 'none');
				element?.setAttribute('opacity', String(weight));
				element?.setAttribute('transform', `translate(100 177) scale(${.8 + weight * .2}) translate(-100 -177) translate(0 ${(1-weight)*8})`);
			}
			const propPose = yoPose(current.prop, current.propAge, still);
			const phase = propPose.phase;
			const prop = props.current[current.prop];
			const attr = (selector, name, value) => {
				const key = current.prop + selector;
				if (!propParts.has(key)) propParts.set(key, prop?.querySelector(selector));
				propParts.get(key)?.setAttribute(name, String(value));
			};
			if (current.prop === 'studying') attr('[data-yo-page]', 'transform', `translate(100 167) scale(${still ? 1 : 1 - Math.sin(phase*Math.PI)*.95} 1) translate(-100 -167)`);
			if (current.prop === 'writing-paper') attr('[data-yo-pen]', 'transform', `translate(${still ? 0 : Math.sin(phase*Math.PI*2)*12} ${still ? 0 : phase > .6 && phase < .9 ? -5 : 0})`);
			if (current.prop === 'coding') {
				attr('[data-yo-key-left]', 'transform', `translate(0 ${still ? 0 : Math.sin(current.propAge/130)*1.5})`);
				attr('[data-yo-key-right]', 'transform', `translate(0 ${still ? 0 : -Math.sin(current.propAge/130)*1.5})`);
			}
			if (current.prop === 'eat-burger') {
				prop?.setAttribute('transform', `translate(100 177) scale(${.8 + current.propWeight*.2}) translate(-100 -177) translate(0 ${-propPose.gesture*20 + (1-current.propWeight)*8})`);
				attr('[data-yo-bite]', 'opacity', phase >= .45 ? 1 : 0);
			}
			if (current.prop === 'drink-coffee') {
				prop?.setAttribute('transform', `translate(110 168) rotate(${-propPose.gesture*12}) scale(${.8 + current.propWeight*.2}) translate(-110 -168) translate(0 ${-propPose.gesture*20})`);
				attr('[data-yo-steam]', 'opacity', still ? .3 : .3 + .3*Math.sin(phase*Math.PI));
			}
			if (current.prop === 'teaching') {
				const node = phase < .375 ? 129 : phase < .625 ? 145 : 162;
				attr('[data-yo-pointer] path', 'd', `M108 163 L${node} 151`);
				const retract = still ? 0 : ease((phase - .8) / .2);
				prop?.setAttribute('opacity', String(current.propWeight * (1 - retract)));
				prop?.setAttribute('transform', `translate(145 173) scale(${1 - retract*.2}) translate(-145 -173) translate(0 ${retract*6})`);
				attr('[data-yo-pointer]', 'opacity', 1 - retract);
			}
			heart.current?.setAttribute('opacity', String(!still && age >= 0 && age < 1100 ? 1 - age / 1100 : 0));
			heart.current?.setAttribute('transform', 'translate(0 ' + (age >= 0 && age < 1100 ? -age / 1100 * 16 : 0) + ')');
		};
		live.current.render = render;
		const frameTick = (time) => {
			raf = 0;
			if (!visible || document.hidden || reduce.matches || live.current.quiet || live.current.mood === 'hidden') return;
			render(time);
			raf = requestAnimationFrame(frameTick);
		};
		const sync = () => {
			cancelAnimationFrame(raf);
			raf = 0;
			live.current.point = null;
			live.current.rect = null;
			nextBlink = performance.now() + 1200;
			nextLook = performance.now() + 2200;
			render(performance.now(), true);
			if (visible && !document.hidden && !reduce.matches && !live.current.quiet && live.current.mood !== 'hidden') raf = requestAnimationFrame(frameTick);
		};
		live.current.sync = sync;
		measure();
		const resize = new ResizeObserver(measure);
		resize.observe(element);
		const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; live.current.onVisibilityChange?.(visible); sync(); });
		observer.observe(element);
		window.addEventListener('pointermove', move, { passive: true });
		document.addEventListener('visibilitychange', sync);
		reduce.addEventListener('change', sync);
		sync();
		return () => {
			cancelAnimationFrame(raf);
			resize.disconnect();
			observer.disconnect();
			window.removeEventListener('pointermove', move);
			document.removeEventListener('visibilitychange', sync);
			reduce.removeEventListener('change', sync);
			live.current.render = null;
			live.current.sync = null;
		};
	}, []);

	const pet = () => {
		live.current.petAt = performance.now();
		onPet?.();
	};
	return <button type="button" class={'yo-cloud yo-cloud--' + form + ' yo-cloud-mood-' + mood + ' ' + className} data-form={form} data-mood={mood} data-peek={peek ? 'true' : 'false'} data-quiet={quiet ? 'true' : 'false'}
		inert={['hidden','disappearing'].includes(mood)} aria-hidden={mood === 'hidden' ? 'true' : undefined} aria-label={label} aria-keyshortcuts="Shift+F10 ContextMenu" aria-expanded={ariaExpanded} aria-controls={ariaControls} aria-describedby={ariaDescribedBy} onClick={pet}>
		<svg ref={svg} class="yo-cloud-stage" viewBox={YO_BOX.viewBox} aria-hidden="true" focusable="false">
			<defs>
				<linearGradient id={id + '-prop-blue'} x2="0" y2="1"><stop stop-color="#b7d8ff" /><stop offset="1" stop-color="#6d9ddc" /></linearGradient>
				<linearGradient id={id + '-prop-silver'} x2="0" y2="1"><stop stop-color="#f3f8ff" /><stop offset="1" stop-color="#b6cce6" /></linearGradient>
				{!fluffy && <g dangerouslySetInnerHTML={{ __html: blueMaterialDefs(id) }} />}
				{fluffy && <>
					<radialGradient id={id + '-fluff'} cx="35%" cy="24%" r="80%">
						<stop offset="0" stop-color="#fff" /><stop offset=".6" stop-color="#f7f7ff" /><stop offset="1" stop-color="#c1caf7" />
					</radialGradient>
					<radialGradient id={id + '-blush'}>
						<stop offset="0" stop-color="#ffabbc" stop-opacity=".65" /><stop offset="1" stop-color="#ffabbc" stop-opacity="0" />
					</radialGradient>
				</>}
				<radialGradient id={id + '-eye'} cx="30%" cy="24%" r="75%">
					<stop offset="0" stop-color="#303239" /><stop offset="1" stop-color="#1c1e24" />
				</radialGradient>
				<radialGradient id={id + '-shadow'}>
					<stop offset="0" stop-color="#5275a7" /><stop offset="1" stop-color="#5275a7" stop-opacity="0" />
				</radialGradient>
				<linearGradient id={id + '-bow'} x2="0" y2="1">
					<stop offset="0" stop-color={fluffy ? FLUFFY_BOW.colors[0] : "#44464a"} /><stop offset=".4" stop-color={fluffy ? FLUFFY_BOW.colors[1] : "#292b2e"} /><stop offset="1" stop-color={fluffy ? FLUFFY_BOW.colors[2] : "#18191b"} />
				</linearGradient>
			</defs>
			<ellipse ref={shadow} cx="100" cy="181" rx={shape.shadowRx} ry="9" fill={paint('shadow')} opacity=".24" />
			<g transform={peek ? 'translate(80 0) rotate(-14 100 130)' : undefined}>
			<g class="yo-cloud-body" ref={body} transform="translate(100 130) rotate(0) scale(1 1) translate(-100 -130)">
				<g filter={fluffy ? undefined : paint('goo')} fill={paint(fluffy ? 'fluff' : 'body')}>
					{/* Hands grow within the same cloud surface; the body covers
					    their roots, leaving just a small, soft gesture at the edge. */}
					{fluffy ? <g class="yo-cloud-fluff" dangerouslySetInnerHTML={{ __html: bodyArtwork }} /> : <>
					<circle cx={shape.core[0]} cy={shape.core[1]} r={shape.core[2]} />
					{shape.lobes.map(([cx, cy, r], i) => <g class="yo-cloud-puff" key={i} ref={(element) => { puffs.current[i] = element; }}>
						<circle cx={cx} cy={cy} r={r} fill={paint('dome')} />
					</g>)}
					</>}
				</g>
				<g class="yo-cloud-face" ref={face} transform={'translate(0 ' + shape.faceDy + ')'}>
					<g ref={blush} opacity="0">{[eyeCenters[0] - 10, eyeCenters[1] + 10].map((cx) => <ellipse key={cx} cx={cx} cy="133" rx="12" ry="8" fill={paint('blush')} />)}</g>
					<path d={`M${eyeCenters[0] + lensRadius} 124 Q100 119 ${eyeCenters[1] - lensRadius} 124`} fill="none" stroke={INK} stroke-width="2.8" stroke-linecap="round" />
					{eyeCenters.map((cx) => <circle key={cx} cx={cx} cy={REF_FACE.cy} r={lensRadius} fill="#fff" fill-opacity=".05" stroke={INK} stroke-width="3.2" />)}
					<path d={`M${eyeCenters[0] - lensRadius} 124 L${eyeCenters[0] - lensRadius - 5} 122 M${eyeCenters[1] + lensRadius} 124 L${eyeCenters[1] + lensRadius + 5} 122`} fill="none" stroke={INK} stroke-width="2.8" stroke-linecap="round" />
					<g class="yo-cloud-eyes" ref={eyes}>
						{eyeStyle === 'arcs' ? <path d={eyeCenters.map((cx) => `M${cx - 8} 126 Q${cx} 115 ${cx + 8} 126`).join(' ')} fill="none" stroke={INK} stroke-width="3" stroke-linecap="round" />
							: eyeStyle === 'lids' ? <path d={eyeCenters.map((cx) => `M${cx - 8} 125 Q${cx} 131 ${cx + 8} 125`).join(' ')} fill="none" stroke={INK} stroke-width="3" stroke-linecap="round" />
							: eyeCenters.map((cx, i) => <g key={cx} data-yo-eye="dots" ref={(element) => { pupils.current[i] = element; }}>
								<ellipse cx={cx} cy={REF_FACE.cy} rx={fluffy ? 4.5 : DOT_EYE.rx} ry={mood === 'boring' ? 3.5 : fluffy ? 6.5 : DOT_EYE.ry} fill={paint('eye')} />
							</g>)}
					</g>
					<ellipse ref={mouth} cx="100" cy="144" rx="2.6" ry="2" fill={INK} opacity="0" />
				</g>
				{shape.hands.map(([cx, cy], i) => <g class="yo-cloud-paw" key={i} opacity={initialHands.current} ref={i === 1 ? paw : leftPaw} fill={paint('fluff')}>
					<ellipse cx={cx} cy={cy} rx={i ? 8 : 7} ry={i ? 10 : 8} />
				</g>)}
				<g class="yo-cloud-bow" transform={fluffy ? FLUFFY_BOW.transform : 'translate(0 ' + shape.bowDy + ')'} fill={paint('bow')}>
					<path d={BOW.left} /><path d={BOW.right} />
					<rect x={BOW.knot.x} y={BOW.knot.y} width={BOW.knot.w} height={BOW.knot.h} rx="4" />
					{fluffy && <g fill="none" stroke="#c9dfff" stroke-width="1.2" stroke-linecap="round" opacity=".65"><path d={BOW.foldL} /><path d={BOW.foldR} /><path d={BOW.knotHl} /></g>}
				</g>
				{/* Foreground props include their gripping hands and occlude the wardrobe. */}
				<YoProps id={id} paint={paint} register={(name, element) => { props.current[name] = element; }} />
			</g>
			</g>
			{mood === 'sleeping' && <path d="M146 76 H155 L146 84 H155 M158 63 H169 L158 73 H169" fill="none" stroke={INK} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />}
			<g ref={heart} opacity="0"><path d="M144 83 C129 72 142 62 147 71 C152 62 165 72 150 83 L147 86 Z" fill="#f3a8bc" /></g>
			{peek && <g class="yo-cloud-grip" fill={paint('fluff')} stroke="#b9cce6" stroke-width=".6">
				<path d="M177 128 H172 Q163 128 163 136 Q163 144 172 144 H177 Z" />
				<path d="M171 133 H177 M171 138 H177" fill="none" stroke-opacity=".6" />
			</g>}
		</svg>
		{children}
	</button>;
}
