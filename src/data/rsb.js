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
	{ key: 'Measurement', label: 'Measurement', description: 'The noisy or reverberant observation.' },
	{ key: 'NCSN++M', label: 'NCSN++M', description: 'Predictive diffusion backbone trained toward clean speech.' },
	{ key: 'StoRM', label: 'StoRM', description: 'Predictive estimate refined by a diffusion model.' },
	{ key: 'SB', label: 'SB', description: 'Schrödinger Bridge speech-enhancement baseline.' },
	{ key: 'RSB', label: 'RSB (Ours)', description: 'Regularized Schrödinger Bridge with distortion-perception perturbation.' },
	{ key: 'Ground_Truth', label: 'Ground Truth', description: 'Original clean reference speech.' }
];

export const audioBasePath = '/audio/RSB';
