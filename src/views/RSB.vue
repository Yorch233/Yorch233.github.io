<script setup>
import { computed, ref } from 'vue';
import AudioWaveCompare from '../components/AudioWaveCompare.vue';

const denoiseSamples = ['051o020a_c1_454_snr=5.2.wav', '051o020t_c1_473_snr=8.3.wav', '053c010d_c1_896_snr=1.1.wav', '053c010k_c1_903_snr=-5.0.wav', '421o0307_c1_1896_snr=8.7.wav'];

const dereverbSamples = ['050a050v_c1_152_t60=1.57.wav', '22gc0110_c1_1161_t60=1.72.wav', '420c020o_c1_1633_t60=1.19.wav', '421c0214_c2_1769_t60=1.86.wav', '422c020d_c2_1982_t60=1.68.wav'];

const showDenoiseAll = ref(false);
const showDereverbAll = ref(false);
const denoiseIndex = ref(0);
const dereverbIndex = ref(0);

const visibleDenoiseSamples = computed(() => (showDenoiseAll.value ? denoiseSamples : [denoiseSamples[denoiseIndex.value] ?? denoiseSamples[0]].filter(Boolean)));
const visibleDereverbSamples = computed(() => (showDereverbAll.value ? dereverbSamples : [dereverbSamples[dereverbIndex.value] ?? dereverbSamples[0]].filter(Boolean)));

const goPrevDenoise = () => {
	if (!denoiseSamples.length) {
		return;
	}
	denoiseIndex.value = (denoiseIndex.value - 1 + denoiseSamples.length) % denoiseSamples.length;
};

const goNextDenoise = () => {
	if (!denoiseSamples.length) {
		return;
	}
	denoiseIndex.value = (denoiseIndex.value + 1) % denoiseSamples.length;
};

const goPrevDereverb = () => {
	if (!dereverbSamples.length) {
		return;
	}
	dereverbIndex.value = (dereverbIndex.value - 1 + dereverbSamples.length) % dereverbSamples.length;
};

const goNextDereverb = () => {
	if (!dereverbSamples.length) {
		return;
	}
	dereverbIndex.value = (dereverbIndex.value + 1) % dereverbSamples.length;
};

const methodOptions = [
	{ key: 'Ground_Truth', label: 'Ground Truth' },
	{ key: 'Measurement', label: 'Measurement' },
	{ key: 'NCSN++M', label: 'NCSN++M' },
	{ key: 'StoRM', label: 'StoRM' },
	{ key: 'SB', label: 'SB' },
	{ key: 'RSB', label: 'RSB (Ours)' }
];
</script>

<template>
	<section class="rsb-page">
		<article class="rsb-article">
			<img class="rsb-watermark" src="/logo/icon.png" alt="" aria-hidden="true" />
			<header class="rsb-hero">
				<p class="rsb-kicker">Paper demo</p>
				<h1 class="rsb-title">Regularized Schrödinger Bridge via Distortion-Perception Perturbation for High-Fidelity Speech Enhancement</h1>
				<p class="rsb-authors">
					<span class="rsb-author">
						<span class="rsb-author-name">
							Qing Yao
							<sup>1</sup>
						</span>
						<span class="rsb-email">qyao@stmail.ujs.edu.cn</span>
					</span>
					<span class="rsb-author">
						<span class="rsb-author-name">
							Lijian Gao
							<sup>1</sup>
						</span>
						<span class="rsb-email">ljgao@ujs.edu.cn</span>
					</span>
					<span class="rsb-author">
						<span class="rsb-author-name">
							Qirong Mao
							<sup>1</sup>
							<sup class="rsb-tag">†</sup>
						</span>
						<span class="rsb-email">mao_qr@ujs.edu.cn</span>
					</span>
					<span class="rsb-author">
						<span class="rsb-author-name">
							Ming Dong
							<sup>2</sup>
							<sup class="rsb-tag">†</sup>
						</span>
						<span class="rsb-email">mdong@wayne.edu</span>
					</span>
				</p>
				<ol class="rsb-affiliations">
					<li>
						<sup>1</sup>
						Jiangsu University
					</li>
					<li>
						<sup>2</sup>
						Wayne State University
					</li>
				</ol>
				<p class="rsb-affiliation-note">
					<sup class="rsb-tag">†</sup>
					Corresponding Author
				</p>
			</header>

			<nav class="rsb-nav">
				<span class="rsb-nav-title">Quick Access</span>
				<a class="rsb-nav-link rsb-nav-disabled" href="" aria-label="Paper link" aria-disabled="true" tabindex="-1">
					<span class="rsb-nav-icon rsb-nav-icon-demo" aria-hidden="true"></span>
					Paper
				</a>
				<a class="rsb-nav-link" href="https://github.com/Yorch233/RSB/" aria-label="Github repository link" aria-disabled="true" tabindex="-1">
					<img class="rsb-nav-icon" src="https://github.githubassets.com/favicons/favicon.svg" alt="" />
					Github
				</a>
				<a class="rsb-nav-link" href="https://huggingface.co/Yorch233/RSB/" aria-label="Hugging Face repository link" aria-disabled="true" tabindex="-1">
					<img class="rsb-nav-icon" src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="" />
					Hugging Face
				</a>
				<a class="rsb-nav-link rsb-nav-disabled" href="https://huggingface.co/spaces/Yorch233/RSB/" aria-label="Online demo link" aria-disabled="true" tabindex="-1">
					<img class="rsb-nav-icon" src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="" />
					Online Demo
				</a>
			</nav>

			<section class="rsb-section">
				<h2>
					<span class="rsb-wave" aria-hidden="true"><span></span></span>
					Abstract
				</h2>
				<p class="rsb-abstract">
					Speech enhancement (SE) requires high-fidelity reconstruction of clean speech that preserves linguistic and paralinguistic cues while maintaining high perceptual quality. Recently,
					Schrödinger Bridge (SB), a family of diffusion-based generative models, has advanced SE by bridging degraded and clean speech distributions in a principled formulation, enabling
					higher-quality reconstructions with fewer sampling steps. However, diffusion-based SE methods still face two challenges: (1) the fidelity-realism tradeoff, where they often
					prioritize perceptual realism encouraged by the learned speech prior, at the expense of fidelity; and (2) the exposure bias issue, where iterative multi-step sampling causes
					early-step prediction errors to accumulate along the sampling trajectory and degrade enhanced speech quality. In this paper, we analyze standard SB training and show that it
					induces a systematic prediction drift, which biases the multi-step trajectory and amplifies error accumulation. To address this, we propose Regularized Schrödinger Bridge (RSB) for
					high-fidelity SE, a generative approach that reconciles fidelity and realism while mitigating exposure bias. RSB regularizes training with a Distortion-Perception Perturbation that
					constructs time-varying targets by interpolating between clean speech and posterior-mean estimates, and trains the network on perturbed intermediate states to correct toward the
					ground truth progressively. Consequently, such perturbation simulates inference-time prediction errors, mitigating the training–inference mismatch and thereby reducing exposure
					bias. Furthermore, it also injects posterior-mean estimates as fidelity-preserving guidance, facilitating reconstruction fidelity. Experiments on the WSJ0 corpus and
					VoiceBank+DEMAND dataset demonstrate that RSB improves reconstruction fidelity over the advanced SE baselines, yielding a favorable fidelity-realism tradeoff and reducing exposure
					bias.
				</p>
			</section>

			<section class="rsb-section">
				<h2>
					<span class="rsb-wave" aria-hidden="true"><span></span></span>
					Keywords
				</h2>
				<div class="rsb-meta">
					<span class="rsb-chip">Speech enhancement</span>
					<span class="rsb-chip">Schrödinger bridge</span>
					<span class="rsb-chip">Diffusion models</span>
					<span class="rsb-chip">Distortion-perception tradeoff</span>
					<span class="rsb-chip">Exposure bias</span>
				</div>
			</section>

			<section class="rsb-section">
				<h2>
					<span class="rsb-wave" aria-hidden="true"><span></span></span>
					Audio Samples
				</h2>
				<p class="rsb-muted">We publicly release 10 samples in total, drawn from two synthetic datasets: WSJ0+WHAM is the denoising dataset and WSJ0+REVERB is the dereverberation dataset.</p>
				<div class="rsb-audio-group">
					<h3 class="rsb-subtitle">WSJ0+WHAM (Denoising)</h3>
					<div class="rsb-audio-list">
						<AudioWaveCompare
							v-for="(sample, idx) in visibleDenoiseSamples"
							:key="sample"
							:sample-name="sample"
							:sample-index="showDenoiseAll ? idx + 1 : denoiseIndex + 1"
							:methods="methodOptions"
							default-method="Measurement"
						/>
					</div>
					<div class="rsb-audio-actions">
						<button class="rsb-nav-btn" type="button" :disabled="showDenoiseAll" @click="goPrevDenoise">Previous</button>
						<button class="rsb-show-more" type="button" @click="showDenoiseAll = !showDenoiseAll">
							{{ showDenoiseAll ? 'Hiden' : 'Show More' }}
						</button>
						<button class="rsb-nav-btn" type="button" :disabled="showDenoiseAll" @click="goNextDenoise">Next</button>
					</div>
				</div>
				<div class="rsb-audio-group">
					<h3 class="rsb-subtitle">WSJ0+REVERB (Dereverberation)</h3>
					<div class="rsb-audio-list">
						<AudioWaveCompare
							v-for="(sample, idx) in visibleDereverbSamples"
							:key="sample"
							:sample-name="sample"
							:sample-index="showDereverbAll ? idx + 1 : dereverbIndex + 1"
							:methods="methodOptions"
							default-method="Measurement"
						/>
					</div>
					<div class="rsb-audio-actions">
						<button class="rsb-nav-btn" type="button" :disabled="showDereverbAll" @click="goPrevDereverb">Previous</button>
						<button class="rsb-show-more" type="button" @click="showDereverbAll = !showDereverbAll">
							{{ showDereverbAll ? 'Hiden' : 'Show More' }}
						</button>
						<button class="rsb-nav-btn" type="button" :disabled="showDereverbAll" @click="goNextDereverb">Next</button>
					</div>
				</div>
			</section>
		</article>
	</section>
</template>

<style scoped>
.rsb-page {
	background: #f5f5f7;
	padding: 64px 20px 96px;
	color: #1d1d1f;
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
	user-select: none;
}

.rsb-article {
	max-width: 960px;
	margin: 0 auto;
	background: rgba(255, 255, 255, 0.92);
	border: 1px solid rgba(0, 0, 0, 0.04);
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
	border-radius: 24px;
	padding: 48px 56px 56px;
	backdrop-filter: blur(18px);
	position: relative;
	overflow: hidden;
}

.rsb-watermark {
	position: absolute;
	top: 90px;
	right: -80px;
	width: 260px;
	height: 260px;
	opacity: 0.035;
	filter: blur(0.5px);
	filter: grayscale(100%);
	pointer-events: none;
	user-select: none;
	z-index: 0;
}

.rsb-hero {
	position: relative;
	z-index: 1;
	padding-bottom: 24px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.rsb-kicker {
	margin: 0 0 10px;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	font-size: 0.72rem;
	font-weight: 700;
	color: #0071e3;
}

.rsb-title {
	font-size: 2.6rem;
	line-height: 1.2;
	margin: 0 0 20px;
	font-weight: 700;
}

.rsb-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 20px;
}

.rsb-chip {
	border-radius: 999px;
	background: rgba(0, 113, 227, 0.12);
	color: #0071e3;
	font-size: 0.85rem;
	padding: 6px 14px;
	font-weight: 600;
	transition:
		transform 0.2s ease,
		background 0.2s ease,
		color 0.2s ease,
		box-shadow 0.2s ease;
}

.rsb-chip:hover {
	background: #0071e3;
	color: #fff;
	transform: translateY(-2px);
	box-shadow: 0 8px 16px rgba(0, 113, 227, 0.25);
}

.rsb-authors {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;
	margin: 0 0 18px;
}

.rsb-author {
	display: flex;
	flex-direction: column;
	gap: 6px;
	font-weight: 600;
	background: #ffffff;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 16px;
	padding: 14px 16px;
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		border-color 0.2s ease;
}

.rsb-author:hover {
	transform: translateY(-4px);
	border-color: rgba(0, 113, 227, 0.4);
	box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
}

.rsb-author-name {
	display: inline-flex;
	align-items: flex-start;
	gap: 4px;
}

.rsb-email,
.rsb-role {
	font-weight: 500;
	color: #6e6e73;
	font-size: 0.95rem;
}

.rsb-email {
	color: #0071e3;
	font-weight: 600;
	user-select: text;
}

.rsb-tag {
	color: #0071e3;
	font-weight: 700;
	font-size: 0.75rem;
}

.rsb-affiliations {
	margin: 0;
	padding-left: 0;
	list-style: none;
	color: #6e6e73;
	line-height: 1.7;
	font-size: 0.98rem;
	display: grid;
	gap: 6px;
}

.rsb-affiliation-note {
	margin: 8px 0 0;
	color: #6e6e73;
	font-size: 0.9rem;
}

.rsb-affiliations sup {
	margin-right: 6px;
	color: #0071e3;
	font-weight: 700;
}

.rsb-nav {
	display: flex;
	flex-wrap: wrap;
	gap: 12px 16px;
	margin-top: 24px;
	padding: 14px 18px;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 16px;
	background: #ffffff;
}

.rsb-nav-title {
	font-size: 0.9rem;
	font-weight: 600;
	color: #6e6e73;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	margin-right: 4px;
	align-self: center;
}

.rsb-nav-link {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	text-decoration: none;
	color: #1d1d1f;
	font-weight: 600;
	font-size: 0.95rem;
	padding: 8px 12px;
	border-radius: 999px;
	background: #f5f5f7;
	border: 1px solid rgba(0, 0, 0, 0.08);
	transition: all 0.2s ease;
}

.rsb-nav-disabled {
	opacity: 0.5;
	cursor: not-allowed;
	pointer-events: none;
}

.rsb-nav-link:hover {
	background: #0071e3;
	color: #fff;
	border-color: #0071e3;
}

.rsb-nav-link:hover .rsb-nav-icon-demo {
	background: #fff;
}

.rsb-nav-icon {
	width: 16px;
	height: 16px;
	border-radius: 0;
	background: transparent;
	display: inline-block;
	object-fit: contain;
}

.rsb-nav-icon-demo {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #0071e3;
}

.rsb-section {
	margin-top: 30px;
	font-size: 1.05rem;
	line-height: 1.8;
	color: #1d1d1f;
}

.rsb-abstract {
	margin: 0;
	padding: 16px 18px;
	border-radius: 16px;
	background: #f5f5f7;
	text-align: justify;
	text-justify: inter-word;
	transition:
		transform 0.25s ease,
		box-shadow 0.25s ease,
		background 0.25s ease;
}

.rsb-abstract:hover {
	background: #ffffff;
	box-shadow: 0 14px 28px rgba(0, 0, 0, 0.1);
}

.rsb-section h2 {
	font-size: 1.35rem;
	margin-bottom: 12px;
	color: #1d1d1f;
	position: relative;
	padding-left: 0;
	display: flex;
	align-items: center;
	gap: 12px;
}

.rsb-wave {
	display: inline-grid;
	grid-auto-flow: column;
	align-items: center;
	gap: 4px;
	width: 26px;
	height: 18px;
}

.rsb-wave::before,
.rsb-wave::after,
.rsb-wave span {
	content: '';
	display: block;
	width: 6px;
	border-radius: 4px;
	background: #0071e3;
}

.rsb-wave::before {
	height: 12px;
}

.rsb-wave span {
	height: 20px;
}

.rsb-wave::after {
	height: 12px;
}

.rsb-muted {
	color: #6e6e73;
}

.rsb-audio-group {
	margin-top: 20px;
}

.rsb-audio-actions {
	display: grid;
	grid-template-columns: 1fr 2fr 1fr;
	gap: 12px;
	align-items: center;
	margin-top: 14px;
}

.rsb-nav-btn {
	width: 100%;
	padding: 12px 18px;
	border-radius: 999px;
	border: 1px solid rgba(15, 23, 42, 0.15);
	background: #ffffff;
	color: #0f172a;
	font-size: 0.9rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	cursor: pointer;
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		opacity 0.2s ease,
		border-color 0.2s ease;
}

.rsb-nav-btn:hover {
	border-color: rgba(15, 23, 42, 0.35);
	box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
	transform: translateY(-1px);
}

.rsb-nav-btn:disabled {
	opacity: 0.45;
	cursor: not-allowed;
	box-shadow: none;
	transform: none;
}

.rsb-show-more {
	width: 100%;
	padding: 12px 18px;
	border-radius: 999px;
	border: none;
	background: #0f172a;
	color: #ffffff;
	font-size: 0.9rem;
	font-weight: 700;
	letter-spacing: 0.04em;
	cursor: pointer;
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		opacity 0.2s ease;
}

.rsb-show-more:hover {
	opacity: 0.9;
	box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18);
	transform: translateY(-1px);
}

.rsb-subtitle {
	font-size: 1.15rem;
	margin: 18px 0 10px;
	color: #1d1d1f;
}

.rsb-audio-list {
	display: grid;
	grid-template-columns: 1fr;
	gap: 24px;
	margin-top: 18px;
}

:global(.rsb-dark) .rsb-page {
	background: #0f1115;
	color: #f5f5f7;
}

:global(.rsb-dark) .rsb-article {
	background: rgba(22, 24, 29, 0.9);
	border-color: rgba(255, 255, 255, 0.08);
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

:global(.rsb-dark) .rsb-hero {
	border-bottom-color: rgba(255, 255, 255, 0.12);
}

:global(.rsb-dark) .rsb-title,
:global(.rsb-dark) .rsb-section,
:global(.rsb-dark) .rsb-section h2 {
	color: #f5f5f7;
}

:global(.rsb-dark) .rsb-kicker,
:global(.rsb-dark) .rsb-email,
:global(.rsb-dark) .rsb-chip {
	color: #8dc1ff;
}

:global(.rsb-dark) .rsb-chip {
	background: rgba(141, 193, 255, 0.16);
}

:global(.rsb-dark) .rsb-author {
	background: #1b1d23;
	border-color: rgba(255, 255, 255, 0.08);
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

:global(.rsb-dark) .rsb-nav {
	background: #1b1d23;
	border-color: rgba(255, 255, 255, 0.08);
}

:global(.rsb-dark) .rsb-nav-link {
	background: #111318;
	border-color: rgba(255, 255, 255, 0.08);
	color: #f5f5f7;
}

:global(.rsb-dark) .rsb-nav-link:hover {
	background: #2997ff;
	border-color: #2997ff;
	color: #0b0b0d;
}

:global(.rsb-dark) .rsb-abstract {
	background: #1b1d23;
}

:global(.rsb-dark) .rsb-muted,
:global(.rsb-dark) .rsb-nav-title,
:global(.rsb-dark) .rsb-affiliations,
:global(.rsb-dark) .rsb-affiliation-note {
	color: rgba(245, 245, 247, 0.7);
}

@media (max-width: 720px) {
	.rsb-article {
		padding: 32px 24px 40px;
	}

	.rsb-title {
		font-size: 2rem;
	}

	.rsb-authors {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.rsb-nav {
		flex-direction: column;
		align-items: flex-start;
	}
}

@media (max-width: 520px) {
	.rsb-authors {
		grid-template-columns: 1fr;
	}

	.rsb-article {
		border-radius: 18px;
	}
}
</style>
