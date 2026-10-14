export const denoiseSamples = [
	'051o020a_c1_454_snr=5.2.wav',
	'051o020t_c1_473_snr=8.3.wav',
	'053c010d_c1_896_snr=1.1.wav',
	'053c010k_c1_903_snr=-5.0.wav',
	'421o0307_c1_1896_snr=8.7.wav'
];

export const dereverbSamples = [
	'050a050v_c1_152_t60=1.57.wav',
	'22gc0110_c1_1161_t60=1.72.wav',
	'420c020o_c1_1633_t60=1.19.wav',
	'421c0214_c2_1769_t60=1.86.wav',
	'422c020d_c2_1982_t60=1.68.wav'
];

export const methodOptions = [
	{
		key: 'Measurement',
		label: 'Unprocessed',
		color: '#64748b',
		description: 'Unprocessed is the degraded speech corrupted by noise and reverberation.'
	},
	{
		key: 'NCSN++M',
		label: 'NCSN++M',
		color: '#22c55e',
		description: 'NCSN++M is a common backbone of diffusion models used here as a purely predictive method, trained with an MSE loss to predict clean speech.'
	},
	{
		key: 'StoRM',
		label: 'StoRM',
		color: '#14b8a6',
		description: 'StoRM is a hybrid method that cascades a predictive model with a diffusion model. The diffusion model refines details from the initial predictive estimate.'
	},
	{
		key: 'SB',
		label: 'SB',
		color: '#a855f7',
		description: 'SB models the transport between noisy and clean speech directly via Schrödinger Bridge. It is our baseline method.'
	},
	{
		key: 'RSB',
		label: 'RSB (Ours)',
		color: '#f97316',
		description: 'RSB is the proposed method in this paper.'
	},
	{
		key: 'Ground_Truth',
		label: 'Clean reference',
		color: '#3a3a3c',
		description: 'Clean reference is the original clean speech.'
	}
];

export const audioGroups = [
	{
		id: 'wsj0-wham',
		index: '01',
		name: 'WSJ0+WHAM',
		task: 'Denoising',
		description: 'Speech enhancement under additive environmental noise.',
		tone: 'denoise',
		samples: denoiseSamples
	},
	{
		id: 'wsj0-reverb',
		index: '02',
		name: 'WSJ0+REVERB',
		task: 'Dereverberation',
		description: 'Speech enhancement under simulated room reverberation.',
		tone: 'dereverb',
		samples: dereverbSamples
	}
];

export const audioBasePath = '/audio/RSB';
