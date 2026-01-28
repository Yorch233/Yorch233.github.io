<script setup>
import Tabs from '../../components/Tabs.vue';
import profileData from '../../data/profile.json';
import ProfileSidebar from '../../components/ProfileSidebar.vue';

const tabList = [
	{ label: 'Home', url: '/' },
	{ label: 'Publications', url: '/publications' }
];

const articles = [
	{
		title: 'Regularized Schrödinger Bridge for High-Fidelity Speech Enhancement',
		venue: 'In Submission',
		year: '2025',
		tags: ['Diffusion Models', 'Speech Enhancement', 'Bridge'],
		summary: 'Introduces RSB to address fidelity-realism tradeoff and exposure bias in diffusion-based SE.'
	},
	{
		title: 'Distortion-Perception Perturbation for Robust Enhancement',
		venue: 'Workshop Draft',
		year: '2024',
		tags: ['Perception', 'Robustness'],
		summary: 'Builds time-varying targets to improve stability and realism during sampling.'
	},
	{
		title: 'Multi-step Sampling Stabilization in Generative Audio',
		venue: 'Tech Report',
		year: '2024',
		tags: ['Sampling', 'Audio'],
		summary: 'Analyzes error accumulation and proposes mitigation strategies for multi-step trajectories.'
	}
];
</script>

<template>
	<div class="app-shell">
		<div class="app-stack">
			<section class="app-window">
				<header class="app-header">
					<div>
						<p class="app-eyebrow">Library</p>
						<h1 class="app-title">Publications</h1>
					</div>
					<div class="app-header-badge">Article List</div>
				</header>
				<div class="app-content">
					<aside class="app-sidebar">
						<ProfileSidebar :profile-data="profileData" />
					</aside>
					<main class="app-main">
						<div class="article-list">
							<article v-for="article in articles" :key="article.title" class="article-card">
								<div class="article-meta">
									<span class="article-year">{{ article.year }}</span>
									<span class="article-venue">{{ article.venue }}</span>
								</div>
								<h2 class="article-title">{{ article.title }}</h2>
								<p class="article-summary">{{ article.summary }}</p>
								<div class="article-tags">
									<span v-for="tag in article.tags" :key="tag" class="article-tag">{{ tag }}</span>
								</div>
							</article>
						</div>
					</main>
				</div>
			</section>
			<div class="app-tabs-dock">
				<Tabs :tabs="tabList" />
			</div>
		</div>
	</div>
</template>

<style scoped>
.app-shell {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px 20px 56px;
	background: #edf1f6;
}

.app-stack {
	width: min(1150px, 100%);
	display: flex;
	flex-direction: column;
	align-items: stretch;
}

.app-window {
	position: relative;
	overflow: hidden;
	width: 100%;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow:
		0 30px 70px rgba(15, 23, 42, 0.12),
		0 0 0 1px rgba(255, 255, 255, 0.6) inset;
	border-radius: 28px;
	padding: 24px 24px 18px;
	display: grid;
	gap: 16px;
}

.app-window::before {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(120deg, rgba(255, 255, 255, 0.9), transparent 45%);
	opacity: 0.4;
	pointer-events: none;
}

.app-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
}

.app-eyebrow {
	margin: 0 0 6px;
	font-size: 0.75rem;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: rgba(15, 23, 42, 0.55);
	font-weight: 700;
}

.app-title {
	margin: 0;
	font-size: 2rem;
	color: #0f172a;
	font-weight: 700;
}

.app-header-badge {
	padding: 6px 14px;
	border-radius: 999px;
	background: rgba(0, 113, 227, 0.12);
	color: #0071e3;
	font-weight: 600;
	font-size: 0.85rem;
}

.app-content {
	display: grid;
	grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
	gap: 20px;
	align-items: stretch;
	min-height: 520px;
}

.app-sidebar,
.app-main {
	position: relative;
	z-index: 1;
}

.app-sidebar {
	display: flex;
}

.article-list {
	display: grid;
	gap: 16px;
}

.article-card {
	padding: 18px 20px;
	border-radius: 20px;
	background: #f7f9fc;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.article-meta {
	display: flex;
	gap: 12px;
	font-size: 0.8rem;
	color: rgba(15, 23, 42, 0.6);
	font-weight: 600;
}

.article-title {
	margin: 10px 0 6px;
	font-size: 1.15rem;
	color: #0f172a;
}

.article-summary {
	margin: 0 0 10px;
	color: rgba(15, 23, 42, 0.75);
	line-height: 1.6;
}

.article-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.article-tag {
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(0, 113, 227, 0.12);
	color: #0071e3;
	font-size: 0.75rem;
	font-weight: 600;
}

.app-tabs-dock {
	display: flex;
	justify-content: center;
	margin-top: -6px;
}

@media (max-width: 980px) {
	.app-content {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 520px) {
	.app-shell {
		padding: 32px 16px 48px;
	}

	.app-window {
		border-radius: 20px;
		padding: 22px 18px 16px;
	}
}
</style>
