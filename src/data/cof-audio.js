// Audio samples for the CoF Demo, switchable between the 1 and 4 NFE
// sampling budgets. Sample names embed the mixture tag (snr=/t60=) following
// the RSB convention; both budgets share the same ten samples.
export const denoiseSamples = [
	'422c020d_c1_2103_snr=-1.7.wav',
	'423c020p_c1_2356_snr=-1.5.wav',
	'052c010k_c1_663_snr=3.7.wav',
	'052o020x_c2_598_snr=-1.9.wav',
	'421o0306_c1_1895_snr=6.5.wav'
];

export const dereverbSamples = [
	'052o020d_c1_698_t60=0.71.wav',
	'053c010h_c1_900_t60=1.73.wav',
	'423o0306_c1_2379_t60=1.25.wav',
	'22go0105_c1_1170_t60=0.89.wav',
	'423c020s_c1_2359_t60=0.91.wav'
];

export const methodOptions = [
	{
		key: 'Measurement',
		label: 'Unprocessed',
		color: '#64748b',
		description: 'Unprocessed is the degraded speech — noisy in WSJ0+WHAM, reverberant in WSJ0+REVERB.'
	},
	{
		key: 'SB-VE_pretrain',
		label: 'SB-VE',
		color: '#238bfa',
		description: 'SB-VE is the pretrained diffusion formulation without post-training.'
	},
	{
		key: 'SB-VE_cof',
		label: 'CoF (SB-VE)',
		color: '#f97316',
		family: 'cof',
		description: 'CoF (SB-VE) is the SB-VE model after Corrective Forcing post-training.'
	},
	{
		key: 'OT-CFM_pretrain',
		label: 'OT-CFM',
		color: '#8b5cf6',
		description: 'OT-CFM is the pretrained flow-matching formulation without post-training.'
	},
	{
		key: 'OT-CFM_cof',
		label: 'CoF (OT-CFM)',
		color: '#f97316',
		family: 'cof',
		description: 'CoF (OT-CFM) is the OT-CFM model after Corrective Forcing post-training.'
	},
	{
		key: 'Ground_Truth',
		label: 'Clean reference',
		color: '#3a3a3c',
		description: 'Clean reference is the original clean speech.'
	}
];

export const budgetOptions = [
	{ key: 'nfe4', label: '4 NFE', basePath: '/audio/CoF/nfe4', default: true },
	{ key: 'nfe1', label: '1 NFE', basePath: '/audio/CoF/nfe1' }
];

export const audioGroups = [
	{
		id: 'cof-wsj0-wham',
		index: '01',
		name: 'WSJ0+WHAM',
		task: 'Denoising',
		description: 'Speech enhancement under additive environmental noise.',
		tone: 'denoise',
		samples: denoiseSamples
	},
	{
		id: 'cof-wsj0-reverb',
		index: '02',
		name: 'WSJ0+REVERB',
		task: 'Dereverberation',
		description: 'Speech enhancement under simulated room reverberation.',
		tone: 'dereverb',
		samples: dereverbSamples
	}
];
