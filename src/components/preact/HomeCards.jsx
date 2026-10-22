import { useId, useRef, useState } from 'preact/hooks';
import profile from '../../data/profile.json';
import { publications } from '../../data/publications.js';
import UiIcon from './UiIcon.jsx';
import CitationDialog from './CitationDialog.jsx';
import Timeline from './Timeline.jsx';
import DemoLink from './DemoLink.jsx';

export const Icon = UiIcon;
const rich = (text) => ({ __html: text });
const renderBio = (text) => text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
	? <strong key={index}>{part.slice(2, -2)}</strong>
	: part);
const bioHints = [
	'Qing works on generative speech enhancement and aims for clear, faithful audio.',
	'He explores continuous diffusion like Schrödinger bridges and discrete models that work with audio codec tokens.',
	'He wants speech to sound natural, stay faithful and work efficiently across different acoustic conditions.'
];
const EmailLink = () => <a class="profile-email" data-yo-say="This is Qing's email address. Send him a note any time." href={'mailto:' + profile.contact.email}><Icon id="mail" /><span>{profile.contact.email}</span></a>;
const GithubLink = () => <a class="profile-github" aria-label="GitHub: Yorch233" data-yo-say="Explore Qing's projects and open-source work on GitHub." href={profile.contact.github} target="_blank" rel="noopener"><Icon id="github" /><span>Yorch233</span></a>;
const HuggingFaceLink = () => <a class="profile-huggingface" aria-label="Hugging Face: Yorch233" data-yo-say="Visit Qing's Hugging Face profile for models and research resources." href={profile.contact.huggingFace} target="_blank" rel="noopener"><Icon id="huggingface" /><span>Yorch233</span></a>;
const OrcidLink = ({ className }) => <a class={className} data-yo-say="You can find Qing's research record through his ORCID." href={'https://orcid.org/' + profile.contact.orcid} target="_blank" rel="noopener"><Icon id="orcid" /><span>ORCID: {profile.contact.orcid}</span></a>;
const interestHints = {
	'Speech Enhancement': 'A little less noise, a little more clarity. Qing researches clearer, more natural speech.',
	'Diffusion Generative Modeling': 'Qing looks at how diffusion models can bring clearer speech back from a noisy recording.',
	'Masked Diffusion Models': 'Qing is also exploring masked diffusion models to help clean up speech.'
};
const paperHints = {
	RSB: 'RSB aims to make speech clearer while keeping it close to the original and natural to hear. It also works on the mistakes that can pile up over several sampling steps.',
	CoF: 'CoF gives diffusion and flow models extra training on the paths they generate themselves. The idea is to help them handle the states they meet when you actually use them.'
};
const interestArtwork = {
	'Speech Enhancement': '/research-icons/v1/speech-enhancement-128.png',
	'Diffusion Generative Modeling': '/research-icons/v1/diffusion-generative-128.png',
	'Masked Diffusion Models': '/research-icons/v1/masked-diffusion-128.png'
};
const compactInterestLabels = {
	'Speech Enhancement': ['Speech', 'Enhancement'],
	'Diffusion Generative Modeling': ['Generative', 'Diffusion'],
	'Masked Diffusion Models': ['Masked', 'Diffusion']
};

export function AboutCard({ welcome = false }) {
	const biography = <>{profile.bio.map((paragraph, index) => <p class={index === 0 ? 'lede' : 'about-copy'} data-yo-say={bioHints[index]} key={`bio-${index}`}>{renderBio(paragraph)}</p>)}</>;
	const meta = <div class="meta profile-meta">
		{welcome && <span class="profile-meta-item profile-education" data-yo-say={'Qing is at ' + profile.contact.institution + '.'}><Icon id="cap" /><span class="profile-meta-copy"><small class="profile-meta-label">Affiliation</small><span class="profile-meta-value">{profile.contact.institution}</span></span></span>}
		<span class="profile-meta-item" data-yo-say={'Hello from ' + profile.location + '! This is where Qing is based.'}><Icon id="pin" /><span class="profile-meta-copy"><small class="profile-meta-label">Location</small><span class="profile-meta-value">{profile.location}</span></span></span>
		<span class="profile-meta-item" data-yo-say={profile.advisor + ' is Qing\'s advisor.'}><Icon id="people" /><span class="profile-meta-copy"><small class="profile-meta-label">Advisor</small><span class="profile-meta-value">{profile.advisor}</span></span></span>
	</div>;
	return <>
		{welcome ? <div class="profile-overview">
			<div class="profile-portrait" data-yo-say="That's Qing! I'm the little cloud keeping him company."><img class="hero-avatar" src={profile.avatar} alt="" width="320" height="320" decoding="async" /></div>
			<div class="profile-story">
				<p class="hero-kicker" data-yo-say="Start here: meet Qing and get to know his research."><span aria-hidden="true">—</span> About Me</p>
			<h1 class="hero-name" tabIndex={-1} data-yo-say="This is Qing Yao! He's a PhD student working on speech and generative models.">{profile.name}</h1>
				{meta}{biography}
				<div class="profile-identifiers" aria-label="Email, GitHub, Hugging Face and ORCID">
					<EmailLink />
					<GithubLink />
					<HuggingFaceLink />
					<OrcidLink className="profile-orcid" />
				</div>
			</div>
		</div> : <>{meta}{biography}</>}
		<section class="research-focus" aria-labelledby="research-focus-title" data-yo-say="Here’s what Qing likes working on. Hover one and I'll tell you a little more.">
			<h3 id="research-focus-title">Research interests</h3>
			<div class="interests">{profile.interests.map(interest => <span class="chip" key={interest} data-yo-say={interestHints[interest]}>{welcome && <img class="research-interest-art" src={interestArtwork[interest]} alt="" width="128" height="128" loading="lazy" decoding="async" />}<span class="research-interest-label">{interest}</span><span class="research-interest-compact" aria-hidden="true">{(compactInterestLabels[interest] || [interest]).map(line => <span key={line}>{line}</span>)}</span></span>)}</div>
		</section>
	</>;
}

export function NewsCard() {
	const [all, setAll] = useState(false);
	const timelineId = useId();
	const items = (all ? profile.news : profile.news.slice(0, 4)).map(item => {
		const award = item.awardId ? profile.awards.find(entry => entry.id === item.awardId) : null;
		return { ...item, id: item.awardId, award, yoHint: item.yoHint || award?.yoHint };
	});
	return <>
		<Timeline id={timelineId} items={items} renderItem={item => item.award
			? <p>Received a <span class="accent">{item.award.title}</span> in <AwardCompetition item={item.award} />, as {item.award.role.toLowerCase()} and {item.award.contribution.toLowerCase()}. <a href="#awards" data-yo-say="Want to see what the team built? Take a look at the award details.">View award details</a>.</p>
			: <p dangerouslySetInnerHTML={rich(item.html)} />} />
		{profile.news.length > 4 && <button class="news-toggle" type="button" aria-expanded={all} aria-controls={timelineId} data-yo-say={all ? 'You can tuck the older updates away here.' : 'There’s more! Open this to see the earlier updates.'} onClick={() => setAll(!all)}>
			{all ? 'Show less' : 'View all news'} <Icon id={all ? 'arrow-up' : 'arrow-down'} />
		</button>}
	</>;
}

function AwardCompetition({ item }) {
	return <><span class="tip tip-wide" tabIndex={0} data-tip={item.competitionChinese}>{item.competition}</span>{item.category && <> ({item.category})</>}</>;
}

function positionAwardTip(event) {
	if (event.pointerType === 'touch') return;
	const tip = event.target.closest?.('.tip[data-tip]');
	if (!tip) return;
	const paragraph = event.currentTarget;
	const bounds = paragraph.getBoundingClientRect();
	const bubble = getComputedStyle(tip, '::after');
	const halfWidth = (parseFloat(bubble.width) || bounds.width) / 2;
	const height = parseFloat(bubble.height) || 40;
	const x = Math.max(halfWidth, Math.min(event.clientX - bounds.left, bounds.width - halfWidth));
	const y = Math.max(event.clientY, height + 22) - bounds.top;
	paragraph.style.setProperty('--award-tip-x', `${x}px`);
	paragraph.style.setProperty('--award-tip-y', `${y}px`);
}

function resetAwardTip(event) {
	event.currentTarget.style.removeProperty('--award-tip-x');
	event.currentTarget.style.removeProperty('--award-tip-y');
}

function AwardOliveBranch({ mirrored = false }) {
	return <svg class={'award-olive' + (mirrored ? ' award-olive--right' : '')} viewBox="0 0 24 40" aria-hidden="true" focusable="false">
		<path d="M21 37C7 30 5 16 13 4" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
		<g fill="currentColor">
			<path d="M12 7C9 4 11 1 15 0C16 4 15 6 12 7Z" />
			<path d="M9 13C4 12 3 8 4 5C8 7 10 10 9 13Z" />
			<path d="M9 16C9 11 13 8 17 8C16 13 13 16 9 16Z" />
			<path d="M8 22C3 20 1 16 2 12C7 15 9 18 8 22Z" />
			<path d="M10 25C9 20 12 17 16 16C16 21 14 24 10 25Z" />
			<path d="M13 30C7 30 3 27 2 23C8 23 12 26 13 30Z" />
			<path d="M16 33C13 29 14 25 18 22C20 27 19 31 16 33Z" />
			<path d="M21 37C15 39 10 37 8 33C14 32 18 34 21 37Z" />
		</g>
	</svg>;
}

function AwardTitleArtwork({ title, honored, glint = false }) {
	return <span class={'award-title-artwork' + (glint ? ' award-title-glint' : '')} aria-hidden={glint ? 'true' : undefined}>
		{honored && <AwardOliveBranch />}
		<span>{title}</span>
		{honored && <AwardOliveBranch mirrored />}
	</span>;
}

function Award({ item }) {
	const nationalFirstPrize = item.title === 'National First Prize';
	return <li data-yo-say={item.yoHint}>
		<span class="date">{item.date}</span>
		<div class="award-heading">
			<h3 class={'award-title' + (nationalFirstPrize ? ' award-title--honored' : '')}>
				<AwardTitleArtwork title={item.title} honored={nationalFirstPrize} />
				{nationalFirstPrize && <AwardTitleArtwork title={item.title} honored glint />}
			</h3>
			<span class="award-role">{item.role}</span>
		</div>
		<p class="award-event" onPointerOver={positionAwardTip} onPointerMove={positionAwardTip}
			onPointerLeave={resetAwardTip} onFocusCapture={resetAwardTip}><AwardCompetition item={item} /></p>
		<div class="award-tags"><span class="award-topic"><span class="award-topic-label">Topic</span>{item.topic}</span></div>
	</li>;
}

export function AwardsCard() {
	return <ul class="news awards">{profile.awards.map((item, i) => <Award key={item.date + i} item={item} />)}</ul>;
}

function PublicationAbstract({ paper }) {
	const [expanded, setExpanded] = useState(false);
	const abstractId = useId();
	const collapsedToggle = useRef(null);
	const expandedToggle = useRef(null);
	const toggle = next => {
		setExpanded(next);
		// The clicked control unmounts with the layout flip; carry focus over.
		requestAnimationFrame(() => (next ? expandedToggle : collapsedToggle).current?.focus());
	};
	return <>
		<p class="pub-tldr" data-yo-say="Here is the quick takeaway before the full abstract.">
			<span class="pub-inline-tag">TLDR</span>{paper.tldr}
			{!expanded && <button type="button" ref={collapsedToggle} class="pub-abstract-toggle" aria-expanded={false}
				aria-controls={abstractId} aria-label={'Expand abstract for ' + paper.slug}
				data-yo-say="Open this to read the complete abstract."
				onClick={() => toggle(true)}>Expand</button>}
		</p>
		<div class="pub-abstract" id={abstractId} hidden={!expanded}>
			<p class="pub-summary" data-yo-say={paperHints[paper.slug]}><span class="pub-inline-tag">Abstract</span>{paper.abstract}</p>
			{expanded && <button type="button" ref={expandedToggle} class="pub-abstract-toggle" aria-expanded={true}
				aria-controls={abstractId} aria-label={'Collapse abstract for ' + paper.slug}
				data-yo-say="You can tuck the abstract away again."
				onClick={() => toggle(false)}>Collapse</button>}
		</div>
	</>;
}

export function PapersCard() {
	const [citation, setCitation] = useState(null);
	return <>
		{publications.map((paper) => <article class="pub" key={paper.slug} data-yo-say={'Let\'s explore ' + paper.slug + '. Hover a resource to see where it goes.'}>
			<div class="pub-meta"><span class="pub-year" data-yo-say={'Here’s Qing’s ' + paper.year + ' paper, ' + paper.slug + '.'}>{paper.year}</span><span class="publication-tag" data-yo-say={paper.paper ? 'You can read the published article through the IEEE link below.' : 'This one is available as a preprint on arXiv.'}>{paper.badge}</span></div>
			<h3 class="pub-title" data-yo-say={'This is ' + paper.slug + '. Select the title to read the paper.'}><a href={paper.paper ?? paper.arxiv} target="_blank" rel="noopener">{paper.title}</a></h3>
			<p class="pub-authors">
				{paper.authors.map((author, i) => <span key={author.name} data-yo-say={author.name + ' helped write this paper.'}>
					{author.highlight ? <b>{author.name}</b> : author.name}{i < paper.authors.length - 1 ? ', ' : ''}
				</span>)}
			</p>
			<p class="venue" data-yo-say={paper.paper ? 'Here’s where the paper was published. The IEEE link below takes you to the article.' : 'You’ll find this preprint on arXiv. The link is right below.'}>{paper.venueFull}</p>
			<PublicationAbstract paper={paper} />
			<div class="pub-links">
				<DemoLink paper={paper} />
				{paper.paper && <a class="link-pill" href={paper.paper} target="_blank" rel="noopener" data-yo-say="Open the published paper on IEEE Xplore."><Icon id="ieee" />IEEE</a>}
				<a class="link-pill compact-ghost" aria-label="arXiv preprint" title="arXiv preprint" href={paper.arxiv} target="_blank" rel="noopener" data-yo-say={'Read the ' + paper.slug + ' preprint on arXiv.'}><Icon id="arxiv-logo" /><span class="compact-action-label">arXiv</span></a>
				<a class="link-pill compact-ghost" aria-label="Source code on GitHub" title="Source code on GitHub" href={paper.code} target="_blank" rel="noopener" data-yo-say={'Take a peek at the open-source ' + paper.slug + ' implementation on GitHub!'}><Icon id="github" /><span class="compact-action-label">GitHub</span></a>
				{paper.huggingface && <a class="link-pill compact-ghost" aria-label="Models on Hugging Face" title="Models on Hugging Face" href={paper.huggingface} target="_blank" rel="noopener" data-yo-say={'Browse the ' + paper.slug + ' models on Hugging Face.'}><Icon id="huggingface" /><span class="compact-action-label">Hugging Face</span></a>}
				{paper.modelscope && <a class="link-pill compact-ghost" aria-label="Models on ModelScope" title="Models on ModelScope" href={paper.modelscope} target="_blank" rel="noopener" data-yo-say={'The ' + paper.slug + ' models are also on ModelScope.'}><Icon id="modelscope" /><span class="compact-action-label">ModelScope</span></a>}
				<button type="button" class="link-pill link-pill-copy compact-ghost" title="Citations" aria-haspopup="dialog"
					aria-label={'Citations for ' + paper.title} data-yo-say="Choose a BibTeX citation or another format, then copy it for your bibliography."
					onClick={event => setCitation({ paper, trigger: event.currentTarget })}>
					<Icon id="quotes" /><span class="compact-action-label">Citations</span>
				</button>
			</div>
		</article>)}
		{citation && <CitationDialog {...citation} onClose={() => setCitation(null)} />}
	</>;
}

export function ContactCard() {
	return <div class="card-contact">
		<div class="contact-primary">
			<a class="contact-address" href={'mailto:' + profile.contact.email} data-yo-say="Qing's email address — tap it to open your mail app."><Icon id="mail" /><span class="contact-email">{profile.contact.email.split('@')[0]}@<wbr />{profile.contact.email.split('@')[1]}</span></a>
			<p class="contact-location" data-yo-say={'Qing is based in ' + profile.location + '.'}><Icon id="pin" /><span>{profile.location}</span></p>
		</div>
		<section class="contact-social" aria-labelledby="contact-profiles-title">
			<h3 id="contact-profiles-title">Research profiles</h3>
			<div class="contact-profile-list">
				<a class="contact-profile" href={profile.contact.github} target="_blank" rel="noopener" data-yo-say="Explore Qing's projects and open-source work on GitHub."><Icon id="github" /><span class="contact-profile-copy"><strong>GitHub</strong></span><Icon id="arrow-right" /></a>
				<a class="contact-profile" href={profile.contact.huggingFace} target="_blank" rel="noopener" data-yo-say="Visit Qing's Hugging Face profile for models and research resources."><Icon id="huggingface" /><span class="contact-profile-copy"><strong>Hugging Face</strong></span><Icon id="arrow-right" /></a>
				<a class="contact-profile" href={'https://orcid.org/' + profile.contact.orcid} target="_blank" rel="noopener" data-yo-say="You can find Qing's research record through his ORCID."><Icon id="orcid" /><span class="contact-profile-copy"><strong>ORCID</strong><span>{profile.contact.orcid}</span></span><Icon id="arrow-right" /></a>
			</div>
		</section>
	</div>;
}
