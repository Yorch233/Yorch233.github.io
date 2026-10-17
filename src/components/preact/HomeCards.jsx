import { useId, useState } from 'preact/hooks';
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
				<div class="profile-identifiers" aria-label="Email and ORCID">
					<EmailLink />
					<OrcidLink className="profile-orcid" />
				</div>
			</div>
		</div> : <>{meta}{biography}</>}
		<section class="research-focus" aria-labelledby="research-focus-title" data-yo-say="Here’s what Qing likes working on. Hover one and I'll tell you a little more.">
			<h3 id="research-focus-title">Research interests</h3>
			<div class="interests">{profile.interests.map(interest => <span class="chip" key={interest} data-yo-say={interestHints[interest]}>{welcome && <img class="research-interest-art" src={interestArtwork[interest]} alt="" width="128" height="128" decoding="async" />}<span class="research-interest-label">{interest}</span><span class="research-interest-compact" aria-hidden="true">{(compactInterestLabels[interest] || [interest]).map(line => <span key={line}>{line}</span>)}</span></span>)}</div>
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
			? <p>Received a <span dangerouslySetInnerHTML={rich(item.award.html.split('<span class="news-sub">')[0].replace('</span>, ', '</span> in '))} /> <a href="#awards" data-yo-say="Want to see what the team built? Take a look at the award details.">View award details</a>.</p>
			: <p dangerouslySetInnerHTML={rich(item.html)} />} />
		{profile.news.length > 4 && <button class="news-toggle" type="button" aria-expanded={all} aria-controls={timelineId} data-yo-say={all ? 'You can tuck the older updates away here.' : 'There’s more! Open this to see the earlier updates.'} onClick={() => setAll(!all)}>
			{all ? 'Show less' : 'View all news'} <Icon id={all ? 'arrow-up' : 'arrow-down'} />
		</button>}
	</>;
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

function Award({ item }) {
	const [open, setOpen] = useState(false);
	const detailsId = useId();
	const [main, ...details] = item.html.split('<span class="news-sub">');
	const lead = main.match(/^<span class="accent">(.*?)<\/span>,\s*(.*)$/);
	return <li data-yo-say={item.yoHint}>
		<span class="date">{item.date}</span>
		{lead && <h3 class="award-title">{lead[1]}</h3>}
		<p class="award-event" onPointerOver={positionAwardTip} onPointerMove={positionAwardTip}
			onPointerLeave={resetAwardTip} onFocusCapture={resetAwardTip}
			dangerouslySetInnerHTML={rich(lead ? lead[2] : main)} />
		{details.length > 0 && <>
			<div id={detailsId} class={'award-content' + (open ? ' is-open' : '')} hidden={!open} data-yo-say="Here’s what the project was about and what the team worked with.">
				{details.map((text, i) => <span class="news-sub" key={i} dangerouslySetInnerHTML={rich(text.replace(/<\/span>\s*$/, ''))} />)}
			</div>
			<button type="button" class="award-more" aria-expanded={open} aria-controls={detailsId} data-yo-say={open ? 'All done? You can tuck the details away here.' : 'Want to know what the team worked on? Have a peek.'} onClick={() => setOpen(!open)}>
				{open ? 'Less detail' : 'More detail'} <Icon id={open ? 'minus' : 'plus'} />
			</button>
		</>}
	</li>;
}

export function AwardsCard() {
	return <ul class="news awards">{profile.awards.map((item, i) => <Award key={item.date + i} item={item} />)}</ul>;
}

function PublicationAbstract({ paper }) {
	const [expanded, setExpanded] = useState(false);
	const abstractId = useId();
	return <div class="pub-abstract" data-expanded={expanded}>
		<p id={abstractId} class="pub-summary" data-yo-say={paperHints[paper.slug]}>{paper.abstract}</p>
		<button type="button" class="pub-abstract-toggle" aria-expanded={expanded} aria-controls={abstractId}
			aria-label={(expanded ? 'Collapse abstract for ' : 'Show full abstract for ') + paper.slug}
			data-yo-say={expanded ? 'You can tuck the abstract back into three lines.' : 'Open this to read the complete abstract.'}
			onClick={() => setExpanded(!expanded)}>
			{expanded ? 'Hide' : 'Show'}
		</button>
	</div>;
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
				{paper.paper && <a class="link-pill" href={paper.paper} target="_blank" rel="noopener" data-yo-say="Open the published paper on IEEE Xplore."><Icon id="file" />IEEE</a>}
				<a class={"link-pill" + (paper.paper ? " compact-ghost" : "")} aria-label="arXiv preprint" title="arXiv preprint" href={paper.arxiv} target="_blank" rel="noopener" data-yo-say={'Read the ' + paper.slug + ' preprint on arXiv.'}><Icon id="external" /><span class="compact-action-label">arXiv</span></a>
				<a class="link-pill compact-ghost" aria-label="Source code on GitHub" title="Source code on GitHub" href={paper.code} target="_blank" rel="noopener" data-yo-say={'Take a peek at the open-source ' + paper.slug + ' implementation on GitHub!'}><Icon id="terminal" /><span class="compact-action-label">Code</span></a>
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
