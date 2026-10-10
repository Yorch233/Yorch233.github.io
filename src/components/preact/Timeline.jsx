import { useId } from 'preact/hooks';
import '../../styles/timeline.css';

export default function Timeline({ items, renderItem, id, title = 'Timeline', className = '' }) {
	const headingId = useId();
	return <section class={'timeline ' + className} aria-labelledby={headingId}>
		<header class="timeline-heading">
			<h3 id={headingId}>{title}</h3>
			<span>Newest first</span>
		</header>
		<ol id={id} class="timeline-list news">
			{items.map((item, index) => <li class={'timeline-item' + (index === 0 ? ' is-latest' : '')} key={item.id || item.date + index} data-yo-say={item.yoHint}>
				<div class="timeline-date date"><time dateTime={item.dateTime || (/^\d{4}$/.test(item.date) ? item.date : undefined)}>{item.date}</time></div>
				<span class="timeline-marker" aria-hidden="true" />
				<div class="timeline-content">
					{index === 0 && <span class="timeline-latest">Latest update</span>}
					{renderItem(item, index)}
				</div>
			</li>)}
		</ol>
	</section>;
}
