import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import YoCloud from './YoCloud.jsx';
import YoWelcome from './YoWelcome.jsx';
import CvDialog from './CvDialog.jsx';
import YoDialogue from './YoDialogue.jsx';
import YoActions from './YoActions.jsx';
import { useYoMachine } from './yoMachine.js';
import { AboutCard, NewsCard, PapersCard, AwardsCard, ContactCard, Icon } from './HomeCards.jsx';

const TOPICS = [
	{ id: 'publications', label: 'Publications', title: 'Publications', icon: 'file', line: "Let’s look at Qing's papers, code and demos.", Card: PapersCard },
	{ id: 'about', label: 'About Me', detail: 'Background & research interests', title: 'About Me', icon: 'user', line: "Come meet Qing and see what he's working on.", Card: AboutCard },
	{ id: 'news', label: 'News', title: 'News', icon: 'news', line: "Want to see what Qing's been up to?", Card: NewsCard },
	{ id: 'awards', label: 'Awards', title: 'Honors & Awards', icon: 'trophy', line: "A few highlights from Qing's journey.", Card: AwardsCard },
	{ id: 'contact', label: 'Contact', actionLabel: 'Contact me', title: 'Get in touch', icon: 'mail', line: "Here's how to reach Qing.", Card: ContactCard }
];
const topicFor = (id) => TOPICS.find((topic) => topic.id === id);
const GREETING = "I'm Yo, Qing's Bot. Let's meet Qing!";
const MOOD_LINES = {
	waiting: ['Take your time. I’m here when you need me.', 'No rush. I’ll keep watch.', 'Standing by whenever you need me.'],
	sleeping: ['Zzz. Dreaming of clearer sound.', 'Zzz. Five more minutes.', 'Shh. The little cloud is recharging.'],
	daydreaming: ['Hmm… what shall we explore next?', 'Just floating along on a tiny idea.', 'Cloud thoughts drift by slowly.'],
	thinking: ['A little thought is taking shape.', 'Hmm. Let me mull this over.', 'Quietly lining up some ideas.'],
	studying: ['One page at a time.', 'A few more notes, then a stretch.', 'Reading a little more.'],
	'writing-paper': ['A little reading, a little thinking, a little writing.', 'Finding the right words, one line at a time.', 'The draft grows slowly but surely.'],
	coding: ['Tap, tap. A little cloud at the keyboard.', 'Fixing one bug and finding two more.', 'The terminal is my weather today.'],
	hungry: ['Time for a tiny burger break.', 'My tummy is rumbling a little.', 'A small snack would really help.'],
	'eat-burger': ['One little bite. Mmm!', 'Nom nom. Best cloud meal ever.', 'Burgers make everything better.'],
	'drink-coffee': ['A quiet coffee break.', 'Sip. The clouds can wait.', 'Warm cup, calm cloud.'],
	boring: ['Maybe a little daydream?', 'Nothing to do. I’ll hum a tune.', 'It’s very quiet around here.'],
	embarrassed: ['A shy little cloud smile.', 'Oops. You saw that?', 'Hiding behind my glasses.']
};

function TopicButton({ topic, compact = false }) {
	const primary = !compact && topic.id === 'publications';
	return <a href={'#' + topic.id} class={'topic-pill' + (compact ? ' topic-pill--compact' : '') + (primary ? ' topic-pill--primary' : '')}
		data-topic={topic.id} data-yo-say={topic.line}>
		{!compact && <span class="topic-icon"><Icon id={topic.icon} state={primary ? 'active' : 'auto'} tone={primary ? 'inverse' : undefined} /></span>}
		<span class="topic-copy"><span class="topic-label">{!compact && topic.actionLabel ? topic.actionLabel : topic.label}</span>
		</span>
		<Icon class="topic-arrow" id="arrow-right" tone={primary ? 'inverse' : undefined} />
	</a>;
}

export default function MeetYo() {
	const [topic, setTopic] = useState(null);
	const [pointerHint, setPointerHint] = useState(null);
	const [focusHint, setFocusHint] = useState(null);
	const [note, setNote] = useState(null);
	const [welcomeOpen, setWelcomeOpen] = useState(false);
	const [cvOpen, setCvOpen] = useState(false);
	const modalOpen = welcomeOpen || cvOpen;
	const [companionHovered, setCompanionHovered] = useState(false);
	const [companionFocused, setCompanionFocused] = useState(false);
	const [awake, setAwake] = useState(false);
	const [compactScreen, setCompactScreen] = useState(false);
	const awakeRef = useRef(false);
	awakeRef.current = awake;
	// Freshly chosen states narrate themselves for at least two seconds before
	// content hints may take the bubble back.
	const stateLineUntil = useRef(0);
	const hover = awake && Date.now() >= stateLineUntil.current ? pointerHint ?? focusHint : null;
	const peeking = !awake;
	const companion = useRef(null);
	const { mood, react, reset, stopSpeech, waitingQuiet, onVisibilityChange } = useYoMachine({ reading: Boolean(topic), hidden: modalOpen || compactScreen, attentive: !compactScreen && (Boolean(hover) || companionHovered || companionFocused) });
	const noteTimer = useRef(0);
	const heading = useRef(null);
	const focusNext = useRef(false);
	const returnTopic = useRef('publications');
	const focusFrame = useRef(0);
	const hintPointer = useRef(null);
	useEffect(() => {
		const media = matchMedia('(max-width: 960px)');
		const update = () => setCompactScreen(media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	}, []);

	const clearFeedback = useCallback(() => {
		clearTimeout(noteTimer.current);
		setNote(null);
		setPointerHint(null);
		setFocusHint(null);
		reset();
	}, [reset]);
	const tuck = useCallback(() => {
		setAwake(false);
		setCompanionHovered(false);
		setCompanionFocused(false);
		clearFeedback();
		companion.current?.querySelector('.yo-cloud')?.focus({ preventScroll: true });
	}, [clearFeedback]);
	useEffect(() => {
		const escape = event => { if (event.key === 'Escape' && awake && !modalOpen && !document.querySelector('dialog[open]')) tuck(); };
		document.addEventListener('keydown', escape);
		return () => document.removeEventListener('keydown', escape);
	}, [awake, modalOpen, tuck]);
	const announce = useCallback((text, duration = 2400) => {
		clearTimeout(noteTimer.current);
		setNote(text);
		noteTimer.current = setTimeout(() => setNote(null), duration);
	}, []);
	const open = useCallback((id, writeHistory = true, focus = true) => {
		const destination = topicFor(id)?.id ?? null;
		const next = destination === 'about' ? null : destination;
		clearFeedback();
		focusNext.current = focus;
		if (next) returnTopic.current = next;
		if (writeHistory) {
			const hash = destination ? '#' + destination : '';
			if (location.hash !== hash) history.pushState(history.state, '', location.pathname + location.search + hash);
		}
		setTopic(next);
		// Also handles selecting the already-open section.
		cancelAnimationFrame(focusFrame.current);
		if (focus) focusFrame.current = requestAnimationFrame(() => {
			window.scrollTo({ top: 0, behavior: 'instant' });
			if (next) heading.current?.focus({ preventScroll: true });
			else if (destination === 'about') document.querySelector('.hero-name')?.focus({ preventScroll: true });
			else {
				const action = document.querySelector('.meet-greet [data-topic="' + returnTopic.current + '"]');
				const sectionLink = document.querySelector('.toplink[href="#' + returnTopic.current + '"]');
				const target = action ?? (sectionLink?.getClientRects().length ? sectionLink : document.querySelector('.brand'));
				target?.focus({ preventScroll: true });
			}
		});
	}, [clearFeedback]);

	useEffect(() => {
		const adopt = (focus = true) => {
			const hash = location.hash.slice(1);
			if (hash === 'main-content') return;
			const id = hash;
			open(id, false, focus);
		};
		const onHistory = () => adopt();
		const navigate = (event) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const link = event.target.closest?.('a');
			if (!link || link.target || link.hasAttribute('download')) return;
			const href = link.getAttribute('href');
			const id = href?.startsWith('#') ? href.slice(1) : null;
			if (!link.matches('.brand') && !topicFor(id)) return;
			event.preventDefault();
			open(link.matches('.brand') ? null : id);
		};
		adopt(false);
		window.addEventListener('hashchange', onHistory);
		window.addEventListener('popstate', onHistory);
		document.addEventListener('click', navigate);
		return () => {
			window.removeEventListener('hashchange', onHistory);
			window.removeEventListener('popstate', onHistory);
			document.removeEventListener('click', navigate);
			clearTimeout(noteTimer.current);
			cancelAnimationFrame(focusFrame.current);
		};
	}, [open]);

	useEffect(() => {
		document.querySelectorAll('.toplink').forEach((link) => {
			if (link.getAttribute('href') === '#' + (topic ?? 'about')) link.setAttribute('aria-current', 'location');
			else link.removeAttribute('aria-current');
		});
		if (topic && focusNext.current) heading.current?.focus({ preventScroll: true });
		focusNext.current = false;
	}, [topic]);
	useEffect(() => {
		const hint = (target) => {
			const element = target?.closest?.('[data-yo-say], .news a, .tip[data-tip]');
			if (!element) return null;
			if (element.hasAttribute('data-yo-say')) {
				// Once Yo is awake his own hover shows the current state's line;
				// the pat invitation only narrates while he peeks from the edge.
				if (awakeRef.current && element.classList.contains('meet-avatar')) return null;
				return element.getAttribute('data-yo-say');
			}
			if (element.matches('.tip')) return 'This competition is called ' + element.dataset.tip + '.';
			const href = element.getAttribute('href');
			if (href?.startsWith('https://arxiv.org/')) return 'Read the research preprint on arXiv.';
			if (href?.startsWith('https://github.com/')) return 'The implementation is open source. Take a peek on GitHub!';
			if (href === '/RSB/') return 'Want to hear the difference? Let’s try the RSB Demo.';
			if (href === '/CoF/') return 'Let’s explore the CoF Demo and its results.';
			if (href === '#publications') return "Let's find this paper in Publications.";
			return element.closest('[data-yo-say]')?.getAttribute('data-yo-say') ?? null;
		};
		let pointerTarget = null, focusTarget = null, scrollFrame = 0;
		const pointer = (event) => {
			if (event.pointerType === 'touch') return;
			hintPointer.current = { x: event.clientX, y: event.clientY };
			pointerTarget = event.target;
			setPointerHint(hint(pointerTarget));
		};
		const move = (event) => {
			if (event.pointerType === 'touch') return;
			hintPointer.current = { x: event.clientX, y: event.clientY };
			if (pointerTarget !== event.target) pointer(event);
		};
		const leave = (event) => {
			if (event.pointerType === 'touch') return;
			if (!event.relatedTarget) hintPointer.current = null;
			pointerTarget = event.relatedTarget;
			setPointerHint(hint(pointerTarget));
		};
		const focusHintFor = target => target?.matches?.(':focus-visible') ? hint(target) : null;
		const focus = (event) => { focusTarget = event.target; setFocusHint(focusHintFor(focusTarget)); };
		const blur = (event) => { focusTarget = event.relatedTarget; setFocusHint(focusHintFor(focusTarget)); };
		const press = () => { focusTarget = null; setFocusHint(null); };
		const refresh = () => {
			const point = hintPointer.current;
			pointerTarget = point ? document.elementFromPoint(point.x, point.y) : null;
			if (!focusTarget?.isConnected) focusTarget = null;
			setPointerHint(hint(pointerTarget));
			setFocusHint(focusHintFor(focusTarget));
		};
		const clear = () => { hintPointer.current = pointerTarget = focusTarget = null; refresh(); };
		const hidden = () => { if (document.hidden) clear(); };
		const scroll = () => {
			cancelAnimationFrame(scrollFrame);
			scrollFrame = requestAnimationFrame(refresh);
		};
		// Expanded content and copy feedback can change while a pointer stays still.
		const observer = new MutationObserver(refresh);
		observer.observe(document.querySelector('.layout'), { subtree: true, childList: true, attributes: true, attributeFilter: ['data-yo-say'] });
		document.addEventListener('pointerover', pointer);
		document.addEventListener('pointermove', move, { passive: true });
		document.addEventListener('pointerdown', press, { passive: true });
		document.addEventListener('pointerout', leave);
		document.addEventListener('focusin', focus);
		document.addEventListener('focusout', blur);
		document.addEventListener('visibilitychange', hidden);
		window.addEventListener('blur', clear);
		window.addEventListener('scroll', scroll, { passive: true, capture: true });
		return () => {
			cancelAnimationFrame(scrollFrame);
			hintPointer.current = null;
			observer.disconnect();
			document.removeEventListener('pointerover', pointer);
			document.removeEventListener('pointermove', move);
			document.removeEventListener('pointerdown', press);
			document.removeEventListener('pointerout', leave);
			document.removeEventListener('focusin', focus);
			document.removeEventListener('focusout', blur);
			document.removeEventListener('visibilitychange', hidden);
			window.removeEventListener('blur', clear);
			window.removeEventListener('scroll', scroll, true);
		};
	}, []);

	const pet = () => {
		if (!awake) {
			clearFeedback();
			setAwake(true);
			announce(topicFor(topic)?.line ?? GREETING, 4000);
			react('happy', 2200);
			return;
		}
		react('happy', 2200);
		announce('Hehe. That tickles!', 2200);
	};
	const selected = topicFor(topic);
	const Card = selected?.Card;
	// Each mood draws one random line on entry and keeps it for the whole state.
	const moodLine = useRef(null);
	if (moodLine.current?.mood !== mood) {
		const lines = MOOD_LINES[mood] ?? [GREETING];
		moodLine.current = { mood, text: lines[Math.floor(Math.random() * lines.length)] };
	}
	const line = note ?? hover ?? selected?.line ?? moodLine.current.text;
	const dialogueActive = awake && !compactScreen && !modalOpen && Boolean(note || hover || companionHovered || companionFocused);
	useEffect(() => {
		if (dialogueActive && !topic && !note && !MOOD_LINES[mood]) react('speaking', Math.max(2000, Math.min(3000, line.length * 24 + 680)), 2);
		if (!dialogueActive) stopSpeech();
	}, [line, dialogueActive, topic, note, react, stopSpeech]);

	return <section class={'meet' + (selected ? ' meet--chat' : '') + (topic === 'contact' ? ' meet--contact' : '')} data-welcoming={modalOpen ? 'true' : undefined} aria-label="Meet Qing Yao through Yo">
		<div class="meet-main">
			{selected ? <>
				<article class="meet-card" aria-labelledby="section-heading" key={topic} data-yo-say={selected.line}>
					<header class="meet-card-head">
						<div class="meet-card-heading"><h2 id="section-heading" ref={heading} tabIndex={-1}>{selected.title}</h2></div>
						<button class="meet-close" type="button" data-yo-say="Back to Qing's introduction. I'll come along!" onClick={() => open(null)}><Icon id="arrow-left" />Home</button>
					</header>
					<div class="card-body" role="region" aria-label={selected.title}>{Card && <Card />}</div>
				</article>
				<nav class="meet-more" aria-label="Other sections">
					<span class="meet-more-label" data-yo-say="There's more to explore. Pick another section below.">Explore more</span>
					<div class="topic-pills">
						{TOPICS.filter((item) => item.id !== selected.id && item.id !== 'about').map((item) => <TopicButton key={item.id} topic={item} compact />)}
					</div>
				</nav>
			</> : <div class="meet-greet">
				<section class="home-about" aria-label="About Me"><AboutCard welcome /></section>
				<section class="home-explore" aria-labelledby="home-explore-title">
					<h2 id="home-explore-title" data-yo-say="Want to look around? Qing’s papers, news, awards and contact details are right here.">Explore more</h2>
					<nav class="topic-chips" aria-label="Explore Qing's work">
						{TOPICS.filter((item) => item.id !== 'about').map((item) => <TopicButton key={item.id} topic={item} />)}
					</nav>
				</section>
			</div>}
		</div>
		<div ref={companion} class="meet-yo" inert={compactScreen} aria-hidden={compactScreen ? 'true' : undefined} data-peeking={peeking ? 'true' : 'false'} data-feedback={note || hover ? 'true' : undefined}
			onPointerEnter={() => setCompanionHovered(true)} onPointerLeave={() => setCompanionHovered(false)}
			onFocusIn={() => setCompanionFocused(true)} onFocusOut={event => { if (!event.currentTarget.contains(event.relatedTarget)) setCompanionFocused(false); }}>
			<div class="meet-bubble" id="home-yo-dialogue" aria-live="off" aria-hidden={!dialogueActive}><YoDialogue text={line} active={dialogueActive} /></div>
			<div class="meet-avatar" data-yo-say="That's me, Yo! Give this little cloud a gentle pat.">
				<YoCloud peek={peeking} label={peeking ? "Yo, Qing's Bot. Hi! Click to say hello." : "Yo, Qing Yao's mascot. Pet the little cloud."} mood={peeking ? 'idle' : mood} focus={Boolean(topic)} quiet={peeking || Boolean(topic) || modalOpen || waitingQuiet || compactScreen} onPet={pet} onVisibilityChange={onVisibilityChange} ariaExpanded={dialogueActive} ariaControls="home-yo-dialogue">
					{peeking && <span class="yo-peek-hi meet-yo-hi" aria-hidden="true">Hi</span>}
				</YoCloud>
			</div>
			{dialogueActive && <button type="button" class="yo-dialogue-close" onClick={tuck} aria-label="Say bye to Yo" aria-controls="home-yo-dialogue">
				<svg class="yo-bye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
					<g transform="rotate(-12 12 12)">
						<path d="M15.1 11.6V5.8a1.7 1.7 0 0 0-3.4 0v4.8" />
						<path d="M11.7 10.9V3.9a1.7 1.7 0 0 0-3.4 0v7" />
						<path d="M8.3 11.2V6.4a1.7 1.7 0 0 0-3.4 0v8.3" />
						<path d="M15.1 7.8a1.7 1.7 0 0 1 3.4 0v5.9a6.8 6.8 0 0 1-6.8 6.8h-1c-2.4 0-4-.9-5.2-2.1l-2.6-2.6a1.7 1.7 0 0 1 2.4-2.4l2.8 2.7" />
					</g>
				</svg>
				<span class="yo-bye-label" aria-hidden="true">Bye</span>
			</button>}
			<YoActions triggerVisible={dialogueActive} onAction={next => {
				setAwake(true);
				clearTimeout(noteTimer.current);
				setNote(null);
				stateLineUntil.current = Date.now() + 2000;
				setPointerHint(null);
				react(next);
			}} />
		</div>
		<span class="sr-only" role="status">{note}</span>
		<YoWelcome onOpenChange={setWelcomeOpen} />
		<CvDialog onOpenChange={setCvOpen} />
	</section>;
}
