import { useEffect, useId, useState } from 'preact/hooks';
import '../../styles/discrete-slider.css';

// Fixed bubble field for the maxed state: deterministic positions keep SSR
// and hydration identical while the drift stays purely decorative.
const MAX_BUBBLES = [
	{ x: 6, y: 36, size: 3, opacity: .7, delay: '-.2s', duration: '3.8s', blur: .2 },
	{ x: 10, y: 64, size: 2, opacity: .55, delay: '-1.4s', duration: '3.2s', blur: .3 },
	{ x: 15, y: 42, size: 4, opacity: .85, delay: '-2.1s', duration: '4.4s', blur: .4 },
	{ x: 21, y: 58, size: 2, opacity: .6, delay: '-.8s', duration: '3.5s', blur: .2 },
	{ x: 27, y: 32, size: 3, opacity: .8, delay: '-1.9s', duration: '4.1s', blur: .25 },
	{ x: 33, y: 66, size: 4, opacity: .7, delay: '-.5s', duration: '3.7s', blur: .4 },
	{ x: 39, y: 44, size: 2, opacity: .9, delay: '-2.6s', duration: '4.6s', blur: .2 },
	{ x: 45, y: 60, size: 3, opacity: .55, delay: '-1.1s', duration: '3.4s', blur: .3 },
	{ x: 51, y: 35, size: 4, opacity: .82, delay: '-2.3s', duration: '4.2s', blur: .35 },
	{ x: 57, y: 68, size: 2, opacity: .65, delay: '-.7s', duration: '3.1s', blur: .2 },
	{ x: 63, y: 46, size: 3, opacity: .75, delay: '-1.7s', duration: '4.5s', blur: .3 },
	{ x: 70, y: 34, size: 2, opacity: .5, delay: '-2.9s', duration: '3.6s', blur: .2 },
	{ x: 77, y: 62, size: 4, opacity: .86, delay: '-.4s', duration: '4.0s', blur: .4 },
	{ x: 84, y: 40, size: 3, opacity: .62, delay: '-1.2s', duration: '3.3s', blur: .25 },
	{ x: 90, y: 66, size: 2, opacity: .72, delay: '-2.5s', duration: '4.3s', blur: .3 },
	{ x: 95, y: 34, size: 3, opacity: .6, delay: '-.9s', duration: '3.9s', blur: .2 }
];

/** A controlled slider for an ordered set of discrete, possibly uneven values. */
export default function DiscreteSlider({
	options,
	value,
	onChange,
	label,
	ariaLabel,
	formatValue = value => String(value),
	caption = '',
	celebrateMax = false,
	id,
	class: className = '',
	disabled = false
}) {
	const generatedId = useId();
	const [ready, setReady] = useState(false);
	useEffect(() => setReady(true), []);
	if (!options.length) return null;
	const isDisabled = !ready || disabled || options.length === 1;
	const inputId = id || `discrete-slider-${generatedId}`;
	const index = Math.max(0, options.findIndex(option => option.value === value));
	const atMax = celebrateMax && index === options.length - 1;
	const ratio = step => (options.length > 1 ? step / (options.length - 1) : 0);
	// The rail runs the full control width while the thumb's center travels
	// between the rail caps; dots and labels share that same travel.
	const controlPosition = step => `calc(var(--slider-thumb-half) + (100% - var(--slider-thumb-size)) * ${ratio(step)})`;
	return <div class={`discrete-slider ${className}`} data-disabled={isDisabled || undefined} data-max={atMax || undefined}>
		{label ? <div class="discrete-slider-heading">
			<label for={inputId}>{label}</label>
			<output for={inputId} aria-hidden="true">{formatValue(options[index].value)}</output>
		</div> : null}
		<div class="discrete-slider-control">
			<div class="discrete-slider-track" aria-hidden="true">
				<span class="discrete-slider-fill" style={{ width: controlPosition(index) }}>
					<span class="discrete-slider-glow" />
				</span>
				{options.map((option, step) => <span key={option.value} class="discrete-slider-dot" data-filled={step <= index || undefined} style={{ left: controlPosition(step) }} />)}
				{celebrateMax && MAX_BUBBLES.map(bubble => <span
					key={`${bubble.x}-${bubble.y}`}
					class="discrete-slider-bubble"
					style={{
						left: `${bubble.x}%`,
						top: `${bubble.y}%`,
						'--bubble-size': `${bubble.size}px`,
						'--bubble-opacity': bubble.opacity,
						'--bubble-delay': bubble.delay,
						'--bubble-duration': bubble.duration,
						'--bubble-blur': `${bubble.blur}px`
					}}
				/>)}
			</div>
			<span class="discrete-slider-thumb" aria-hidden="true" style={{ left: controlPosition(index) }} />
			<input
				id={inputId}
				class="discrete-slider-input"
				type="range"
				min="0"
				max={options.length - 1}
				step="1"
				value={index}
				aria-label={ariaLabel}
				aria-valuetext={formatValue(options[index].value)}
				disabled={isDisabled}
				onInput={event => onChange(options[Number(event.currentTarget.value)].value)}
			/>
		</div>
		<div class="discrete-slider-labels" aria-hidden="true">
			{options.map((option, step) => <span key={option.value} data-selected={step === index || undefined} style={{ left: controlPosition(step) }}>{option.label}</span>)}
		</div>
		{caption ? <div class="discrete-slider-caption" aria-hidden="true">{caption}</div> : null}
	</div>;
}
