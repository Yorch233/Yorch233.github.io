export const publications = [
	{
		slug: 'CoF',
		titleSentence: 'Corrective forcing: Unified post-training for diffusions and flows in generative speech enhancement',
		arxivId: '2609.24651',
		title: 'Corrective Forcing: Unified Post-Training for Diffusions and Flows in Generative Speech Enhancement',
		venue: 'arXiv preprint',
		venueFull: 'arXiv preprint arXiv:2609.24651, September 2026',
		year: '2026',
		badge: 'Preprint',
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
		summary:
			'Corrective Forcing is a unified post-training framework that adapts diffusion and flow speech-enhancement models to their self-generated rollout states, correcting predictions and regularizing local transitions to close the training–inference gap.'
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
		summary:
			'Regularized Schrödinger Bridge improves high-fidelity speech enhancement by balancing reconstruction fidelity and perceptual realism while reducing exposure bias in multi-step diffusion sampling.'
	}
];
