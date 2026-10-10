/* Saturated cartoon blue, with broad toy-like shading and soft rounded edges.
   The live cloud and static branding use the same material. */
export function blueMaterialDefs(id) {
	return `<filter id="${id}-goo" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
		<feGaussianBlur in="SourceGraphic" stdDeviation="4" result="joined" />
		<feColorMatrix in="joined" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="cloud" />
		<feGaussianBlur in="cloud" stdDeviation="7" result="height" />
		<feDiffuseLighting in="height" surfaceScale="4" diffuseConstant="1" lighting-color="#e8f3ff" result="light">
			<feDistantLight azimuth="225" elevation="48" />
		</feDiffuseLighting>
		<feComposite in="cloud" in2="light" operator="arithmetic" k1=".28" k2=".80" k3="0" k4="0" result="lit" />
		<feComposite in="lit" in2="cloud" operator="in" />
	</filter>
	<radialGradient id="${id}-body" cx="34%" cy="24%" r="78%">
		<stop offset="0" stop-color="#98d8ff" />
		<stop offset=".30" stop-color="#69bcff" />
		<stop offset=".62" stop-color="#4197f1" />
		<stop offset=".84" stop-color="#337bdc" />
		<stop offset="1" stop-color="#3062bc" />
	</radialGradient>
	<radialGradient id="${id}-dome" cx="32%" cy="22%" r="82%">
		<stop offset="0" stop-color="#a1ddff" />
		<stop offset=".34" stop-color="#73c4ff" />
		<stop offset=".68" stop-color="#489ef5" />
		<stop offset="1" stop-color="#357bd5" />
	</radialGradient>`;
}
