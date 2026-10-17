export const publications = [
	{
		slug: 'CoF',
		titleSentence: 'Corrective forcing: Unified post-training for diffusions and flows in generative speech enhancement',
		arxivId: '2609.24651',
		title: 'Corrective Forcing: Unified Post-Training for Diffusions and Flows in Generative Speech Enhancement',
		venue: 'arXiv preprint',
		venueFull: 'arXiv preprint arXiv:2609.24651, September 2026',
		year: '2026',
    badge: 'arXiv',
		authors: [
			{ name: 'Qing Yao', highlight: true },
			{ name: 'Lijian Gao' },
			{ name: 'Qirong Mao' }
		],
		arxiv: 'https://arxiv.org/abs/2609.24651',
		code: 'https://github.com/Yorch233/CoF/',
		demo: '/CoF/',
		demoLabel: 'Demo',
		demoIcon: 'sparkle',
		bibtex: String.raw`@article{yao2026cof,
  author  = {Yao, Qing and Gao, Lijian and Mao, Qirong},
  title   = {Corrective Forcing: Unified Post-Training for Diffusions and Flows in Generative Speech Enhancement},
  journal = {arXiv preprint arXiv:2609.24651},
  year    = {2026}
}`,
		tags: ['Speech enhancement', 'Diffusion and flow models', 'Post-training', 'Training–inference mismatch', 'Exposure bias'],
		abstract:
			"Diffusion and flow models, as promising generative paradigms for speech enhancement, face a training–inference mismatch: training uses analytical path states, whereas inference recursively evaluates models on self-generated rollout states along discretized sampling trajectories. This mismatch causes prediction and discretization errors to accumulate. To address it, we introduce Corrective Forcing (CoF), a post-training paradigm that forces diffusion and flow models to learn from self-generated rollouts and correct their predictions. CoF corrects clean-speech predictions on rollout states toward the ground truth under dynamic sampling schedules, exposing the model to varying inference conditions. It further regularizes local evolution using locally corrected counterfactual transitions as references for factual transitions. By expressing model outputs through a shared clean-speech prediction parameterization, CoF applies the same post-training objective across diffusion and flow formulations. Experiments with SB-VE and OT-CFM demonstrate improvements in perceptual quality and reconstruction fidelity, together with robust performance across different numbers of sampling steps."
	},
	{
		slug: 'RSB',
		titleSentence: 'Regularized Schrödinger bridge via distortion-perception perturbation for high-fidelity speech enhancement',
		journal: 'IEEE Transactions on Audio, Speech and Language Processing',
		volume: '34',
		pages: '3886–3900',
		doi: '10.1109/TASLPRO.2026.3717234',
		title: 'Regularized Schrödinger Bridge via Distortion-Perception Perturbation for High-Fidelity Speech Enhancement',
		venue: 'IEEE TASLP',
		venueFull: 'IEEE Transactions on Audio, Speech and Language Processing (TASLP), vol. 34, pp. 3886–3900, 2026',
		year: '2026',
		badge: 'TASLP',
		authors: [
			{ name: 'Qing Yao', highlight: true },
			{ name: 'Lijian Gao' },
			{ name: 'Qirong Mao' },
			{ name: 'Ming Dong' }
		],
		paper: 'https://ieeexplore.ieee.org/document/11623672',
		arxiv: 'https://arxiv.org/abs/2511.11686',
		code: 'https://github.com/Yorch233/RSB/',
		demo: '/RSB/',
		demoLabel: 'Demo',
		demoIcon: 'sparkle',
		bibtex: String.raw`@article{yao2026rsb,
  author  = {Yao, Qing and Gao, Lijian and Mao, Qirong and Dong, Ming},
  title   = {Regularized Schr{"o}dinger Bridge via Distortion-Perception Perturbation for High-Fidelity Speech Enhancement},
  journal = {IEEE Transactions on Audio, Speech and Language Processing},
  year    = {2026},
  volume  = {34},
  pages   = {3886-3900},
  doi     = {10.1109/TASLPRO.2026.3717234}
}`,
		tags: ['Speech enhancement', 'Schrödinger bridge', 'Diffusion models', 'Distortion-perception tradeoff', 'Exposure bias'],
		abstract:
			"Speech enhancement (SE) requires high-fidelity reconstruction of clean speech that preserves linguistic and paralinguistic cues while maintaining high perceptual quality. Recently, Schrödinger Bridge (SB), a family of diffusion-based generative models, has advanced SE by bridging degraded and clean speech distributions in a principled formulation, enabling higher-quality reconstructions with fewer sampling steps. However, diffusion-based SE methods still face two challenges: (1) the fidelity-realism tradeoff, where they often prioritize perceptual realism encouraged by the learned speech prior, at the expense of fidelity; (2) the exposure bias issue, where iterative multi-step sampling causes early-step prediction errors to accumulate along the sampling trajectory and degrade enhanced speech quality. In this paper, we analyze standard SB training and show that it induces a systematic prediction drift, which biases the multi-step trajectory and amplifies error accumulation. To address this, we propose Regularized Schrödinger Bridge (RSB) for high-fidelity SE, a generative approach that reconciles fidelity and realism while mitigating exposure bias. RSB regularizes training with a Distortion-Perception Perturbation that constructs time-varying targets by interpolating between clean speech and posterior-mean estimates, and trains the network on perturbed intermediate states to correct toward the ground truth progressively. By simulating inference-time prediction errors, this perturbation mitigates the training-inference mismatch and thereby alleviates exposure bias. It also injects posterior-mean estimates as fidelity-preserving guidance, thereby improving reconstruction fidelity. Experiments on the WSJ0 corpus and the VoiceBank+DEMAND dataset demonstrate that RSB improves reconstruction fidelity over strong diffusion-based generative methods, yielding a favorable fidelity-realism tradeoff and reducing exposure bias."
	}
];
