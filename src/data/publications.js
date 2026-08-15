export const publications = [
	{
		slug: 'RSB',
		title: 'Regularized Schrödinger Bridge via Distortion-Perception Perturbation for High-Fidelity Speech Enhancement',
		venue: 'IEEE/ACM TASLP',
		venueFull: 'IEEE/ACM Transactions on Audio, Speech and Language Processing (TASLP), vol. 34, pp. 3886–3900, 2026',
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
		bibtex: `@article{yao2026rsb,
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
