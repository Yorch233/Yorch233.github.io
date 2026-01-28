<script setup>
import { ref } from 'vue';

const article = {
	title: 'Regularized Schrödinger Bridge via Distortion-Perception Perturbation for High-Fidelity Speech Enhancement',
	venue: 'In Submission',
	year: '2025',
	tags: ['Speech enhancement', 'Schrödinger bridge', 'Diffusion models', 'Distortion-perception tradeoff', 'Exposure bias'],
	summary:
		'Speech enhancement (SE) requires high-fidelity reconstruction of clean speech that preserves linguistic and paralinguistic cues while maintaining high perceptual quality. Recently, Schrödinger Bridge (SB), a family of diffusion-based generative models, has advanced SE by bridging degraded and clean speech distributions in a principled formulation, enabling higher-quality reconstructions with fewer sampling steps. However, diffusion-based SE methods still face two challenges:  (1) the fidelity-realism tradeoff, where they often prioritize perceptual realism encouraged by the learned speech prior, at the expense of fidelity; (2) the exposure bias issue, where iterative multi-step sampling causes early-step prediction errors to accumulate along the sampling trajectory and degrade enhanced speech quality. In this paper, we analyze standard SB training and show that it induces a systematic prediction drift, which biases the multi-step trajectory and amplifies error accumulation. To address this, we propose Regularized Schrödinger Bridge (RSB) for high-fidelity SE, a generative approach that reconciles fidelity and realism while mitigating exposure bias. RSB regularizes training with a Distortion-Perception Perturbation that constructs time-varying targets by interpolating between clean speech and posterior-mean estimates, and trains the network on perturbed intermediate states to correct toward the ground truth progressively. Consequently, such perturbation simulates inference-time prediction errors, mitigating the training–inference mismatch and thereby reducing exposure bias. Furthermore, it also injects posterior-mean estimates as fidelity-preserving guidance, facilitating reconstruction fidelity. Experiments on the WSJ0 corpus and VoiceBank+DEMAND dataset demonstrate that RSB improves reconstruction fidelity over the advanced SE baselines, yielding a favorable fidelity-realism tradeoff and reducing exposure bias.'
};

const isExpanded = ref(false);
</script>

<template>
	<div class="home-publications fade-in">
		<article class="pub-card">
			<div class="pub-meta">
				<span class="pub-year">{{ article.year }}</span>
				<span class="pub-venue">{{ article.venue }}</span>
			</div>
			<h2 class="pub-title">
				<router-link class="pub-link" to="/RSB">{{ article.title }}</router-link>
			</h2>
			<p class="pub-summary" :class="{ 'is-collapsed': !isExpanded }">
				<span class="pub-summary-label">Abstract</span>
				<span class="pub-summary-text">{{ article.summary }}</span>
			</p>
			<button class="pub-expand" type="button" @click="isExpanded = !isExpanded">
				{{ isExpanded ? 'Collapse' : 'Expand' }}
			</button>
			<div class="pub-tags">
				<span v-for="tag in article.tags" :key="tag" class="pub-tag">{{ tag }}</span>
			</div>
		</article>
	</div>
</template>

<style scoped>
.home-publications {
	display: grid;
	gap: 16px;
}

.fade-in {
	animation: fadeInUp 0.8s ease both;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.fade-in {
		animation: none !important;
	}
}

.pub-card {
	padding: 18px 20px;
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid rgba(255, 255, 255, 0.5);
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
	backdrop-filter: blur(18px) saturate(150%);
}

.pub-meta {
	display: flex;
	gap: 12px;
	font-size: 0.8rem;
	color: rgba(15, 23, 42, 0.6);
	font-weight: 600;
}

.pub-title {
	margin: 10px 0 6px;
	font-size: 1.15rem;
	color: #0f172a;
}

.pub-link {
	color: inherit;
	text-decoration: none;
}

.pub-link:hover {
	text-decoration: underline;
}

.pub-summary {
	margin: 0 0 10px;
	color: rgba(15, 23, 42, 0.75);
	line-height: 1.6;
}

.pub-summary-label {
	font-weight: 700;
	color: #0f172a;
	margin-right: 8px;
}

.pub-summary-text {
	display: inline;
	margin-right: 0;
}

.pub-summary.is-collapsed {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.pub-expand {
	border: none;
	background: transparent;
	color: #0071e3;
	font-weight: 600;
	padding: 0;
	cursor: pointer;
	margin-bottom: 10px;
}

.pub-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.pub-tag {
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(0, 113, 227, 0.12);
	color: #0071e3;
	font-size: 0.75rem;
	font-weight: 600;
}
</style>
