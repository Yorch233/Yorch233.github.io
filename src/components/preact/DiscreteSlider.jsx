import { useEffect, useId, useState } from 'preact/hooks';
import '../../styles/discrete-slider.css';

/** A controlled slider for an ordered set of discrete, possibly uneven values. */
export default function DiscreteSlider({
	options,
	value,
	onChange,
	label,
	formatValue = value => String(value),
	thumbContent = null,
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
	const ratio = step => (options.length > 1 ? step / (options.length - 1) : 0);
	// The rail spans stop to stop; the chip travels in the padded control space.
	const railPosition = step => `${ratio(step) * 100}%`;
	const controlPosition = step => `calc(var(--slider-thumb-half) + (100% - var(--slider-thumb-size)) * ${ratio(step)})`;
	return <div class={`discrete-slider ${className}`} data-disabled={isDisabled || undefined}>
		<div class="discrete-slider-heading">
			<label for={inputId}>{label}</label>
			<output for={inputId} aria-hidden="true">{formatValue(options[index].value)}</output>
		</div>
		<div class="discrete-slider-control">
			<div class="discrete-slider-track" aria-hidden="true">
				<span class="discrete-slider-fill" style={{ width: railPosition(index) }} />
				{options.map((option, step) => <span key={option.value} class="discrete-slider-dot" data-filled={step <= index || undefined} style={{ left: railPosition(step) }} />)}
			</div>
			<span class="discrete-slider-thumb" aria-hidden="true" style={{ left: controlPosition(index) }}>{thumbContent}</span>
			<input
				id={inputId}
				class="discrete-slider-input"
				type="range"
				min="0"
				max={options.length - 1}
				step="1"
				value={index}
				aria-valuetext={formatValue(options[index].value)}
				disabled={isDisabled}
				onInput={event => onChange(options[Number(event.currentTarget.value)].value)}
			/>
		</div>
		<div class="discrete-slider-labels" aria-hidden="true">
			{options.map((option, step) => <span key={option.value} data-selected={step === index || undefined} style={{ left: controlPosition(step) }}>{option.label}</span>)}
		</div>
	</div>;
}
