import { useEffect, useId, useState } from 'preact/hooks';
import '../../styles/discrete-slider.css';

// Fixed bubble lanes for the maxed state: deterministic positions keep SSR
// and hydration identical while the right-to-left drift stays purely decorative.
// Every lane shares one crossing duration and an evenly spaced phase offset so
// bubbles enter as a steady stream instead of clumping.
const MAX_BUBBLE_DURATION = 4;
const MAX_BUBBLES = [
	{ y: 36, size: 3, opacity: .7, blur: .2 },
	{ y: 64, size: 2, opacity: .55, blur: .3 },
	{ y: 42, size: 4, opacity: .85, blur: .4 },
	{ y: 58, size: 2, opacity: .6, blur: .2 },
	{ y: 32, size: 3, opacity: .8, blur: .25 },
	{ y: 66, size: 4, opacity: .7, blur: .4 },
	{ y: 44, size: 2, opacity: .9, blur: .2 },
	{ y: 60, size: 3, opacity: .55, blur: .3 },
	{ y: 35, size: 4, opacity: .82, blur: .35 },
	{ y: 68, size: 2, opacity: .65, blur: .2 },
	{ y: 46, size: 3, opacity: .75, blur: .3 },
	{ y: 34, size: 2, opacity: .5, blur: .2 },
	{ y: 62, size: 4, opacity: .86, blur: .4 },
	{ y: 40, size: 3, opacity: .62, blur: .25 },
	{ y: 52, size: 2, opacity: .72, blur: .3 },
	{ y: 48, size: 3, opacity: .6, blur: .2 }
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
				{celebrateMax && MAX_BUBBLES.map((bubble, lane) => <span
					key={`${bubble.y}-${lane}`}
					class="discrete-slider-bubble"
					style={{
						top: `${bubble.y}%`,
						'--bubble-size': `${bubble.size}px`,
						'--bubble-opacity': bubble.opacity,
						'--bubble-delay': `${-(lane * MAX_BUBBLE_DURATION / MAX_BUBBLES.length).toFixed(3)}s`,
						'--bubble-duration': `${MAX_BUBBLE_DURATION}s`,
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
