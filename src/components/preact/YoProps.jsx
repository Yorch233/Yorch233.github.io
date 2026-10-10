// Small props share the cloud's lighting and stay within its original art box.
// Groups persist during 300ms handoffs so outgoing props can retract smoothly.
export default function YoProps({ id, paint, register }) {
	const hand = (cx,cy) => <ellipse cx={cx} cy={cy} rx="7" ry="5.5" fill={paint('fluff')} stroke="#dbe5f5" stroke-width=".5" />;
	return <g class="yo-props" stroke-linejoin="round" stroke-linecap="round">
		<g data-yo-prop="studying" opacity="0" ref={element => register('studying', element)}>
			<path d="M62 156 Q79 151 100 159 Q121 151 138 156 L137 179 Q118 175 100 181 Q80 175 63 179 Z" fill="#6f9bd9" />
			<path d="M65 153 Q82 149 99 157 L99 177 Q83 171 66 175 Z M101 157 Q119 149 135 153 L134 175 Q118 171 101 177 Z" fill="#f5f9ff" stroke="#c8d8ee" stroke-width=".8" />
			<path d="M72 158 L91 162 M72 163 L91 167 M109 162 L128 158 M109 167 L128 163" fill="none" stroke="#9bb6d9" stroke-width="1" />
			<path data-yo-page="true" d="M100 157 Q109 149 125 150 L125 170 Q108 171 100 177 Z" fill="#eaf3ff" stroke="#c8d8ee" stroke-width=".6" />
			{hand(63,167)}{hand(137,167)}
		</g>
		<g data-yo-prop="eat-burger" opacity="0" ref={element => register('eat-burger', element)}>
			<defs><mask id={id + '-burger-bite'} maskUnits="userSpaceOnUse" x="75" y="145" width="55" height="40">
				<rect x="75" y="145" width="55" height="40" fill="white" />
				<path data-yo-bite="true" d="M120 154 Q115 154 116 159 Q111 159 114 164 L125 164 L125 151 Z" fill="black" opacity="0" />
			</mask></defs>
			<g data-yo-burger="true" mask={paint('burger-bite')}>
				<path d="M79 162 Q80 149 100 149 Q120 149 121 162 Z" fill="#e3b674" stroke="#c89556" stroke-width=".7" />
				<path d="M85 157 l2 -1 M95 154 l2 1 M106 155 l2 -1 M114 158 l2 0" stroke="#fff0ce" stroke-width="1.4" />
				<path d="M79 164 Q84 161 88 164 Q93 168 99 163 Q105 161 111 165 Q116 162 121 164" fill="none" stroke="#81ad74" stroke-width="3" />
				<rect x="79" y="167" width="42" height="4" rx="2" fill="#966b4e" />
				<path d="M81 171 L119 171 L117 177 Q100 181 83 177 Z" fill="#dca769" />
			</g>{hand(77,170)}{hand(123,170)}
		</g>
		<g data-yo-prop="drink-coffee" opacity="0" ref={element => register('drink-coffee', element)}>
			<path d="M121 158 Q137 155 134 168 Q132 174 123 170" fill="none" stroke="#74a5df" stroke-width="4" />
			<path d="M95 156 L124 156 L122 176 Q109 182 98 175 Z" fill={paint('prop-blue')} stroke="#6c9acf" stroke-width=".6" />
			<ellipse cx="109.5" cy="156" rx="14.5" ry="3" fill="#f4f8ff" /><ellipse cx="109.5" cy="156" rx="11" ry="1.8" fill="#99745e" />
			<path data-yo-steam="true" d="M109 148 Q104 143 109 138" fill="none" stroke="#acc5e5" stroke-width="1.5" />
			{hand(125,172)}
		</g>
		<g data-yo-prop="writing-paper" opacity="0" ref={element => register('writing-paper', element)}>
			<path d="M61 170 L126 170 L138 186 L69 186 Z" fill="#88ace1" />
			<path d="M67 166 L120 166 L131 181 L75 181 Z" fill="#fff" stroke="#d7e3f2" stroke-width=".7" />
			<path d="M77 170 H114 M79 173 H117 M82 177 H120" stroke="#a8c0df" stroke-width="1" />
			<g data-yo-pen="true"><path d="M92 177 L102 157" stroke="#397aca" stroke-width="3" /><path d="M92 177 L91 180" stroke="#233955" stroke-width="1.3" />{hand(99,166)}</g>
			{hand(68,175)}
		</g>
		<g data-yo-prop="coding" opacity="0" ref={element => register('coding', element)}>
			<path d="M66 157 L134 157 L130 178 L70 178 Z" fill={paint('prop-silver')} stroke="#b5c9e2" stroke-width=".8" />
			<path d="M70 177 L130 177 L140 184 L60 184 Z" fill="#c7d8ec" /><path d="M65 184 H135" stroke="#a7bdd9" stroke-width="1" />
			<path d="M92 165 l-4 4 4 4 M108 165 l4 4 -4 4 M103 164 l-6 11" fill="none" stroke="#779ac8" stroke-width="1.4" />
			<g data-yo-key-left="true">{hand(74,181)}</g><g data-yo-key-right="true">{hand(126,181)}</g>
		</g>
		<g data-yo-prop="teaching" opacity="0" ref={element => register('teaching', element)}>
			<path d="M140 172 L135 186 M157 172 L162 186" stroke="#9fb9da" stroke-width="2" />
			<rect x="117" y="128" width="57" height="45" rx="5" fill="#eff6ff" stroke="#b5cce9" stroke-width="1.2" />
			<path d="M129 151 H162" stroke="#99b8e2" stroke-width="1.2" />
			{[129,145,162].map(x => <circle key={x} cx={x} cy="151" r="3.7" fill="#548ddb" />)}
			<g data-yo-pointer="true"><path d="M108 163 L129 151" stroke="#4280d0" stroke-width="2" />{hand(110,163)}</g>
		</g>
	</g>;
}
