<template>
	<div class="chat-container">
		<template v-for="(msg, index) in messages">
			<div v-if="msg.date" class="date-label" :style="{ animationDelay: `${index * 0.5}s` }">
				{{ msg.date }}
			</div>
			<div class="message-box" :class="{ sent: msg.sent }" :style="{ animationDelay: `${index * 0.5}s` }">
				<div class="message-content">
					<span v-html="msg.content"></span>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup>
const messages = [
	{ content: 'Hello, can you briefly introduce yourself?', sent: true },
	{
		content: 'My name is <strong>Qing Yao</strong>, a P.h.D student from Jiangsu University. My current research interests are in diffusion-based generative modeling.',
		sent: false
	},
	{ content: 'Very nice to meet you!', sent: false },
	{ content: 'Long time no seen! How are you?', sent: false, date: '2024-07-20' }
];
</script>

<style scoped>
.chat-container {
	display: flex;
	flex-direction: column;
	gap: 14px;
	position: relative;
	background: transparent;
	border: none;
	box-shadow: none;
	backdrop-filter: none;
}

.chat-container::before {
	content: '';
	position: absolute;
	inset: 0;
	background: none;
	opacity: 0;
	pointer-events: none;
}

.date-label {
	text-align: center;
	width: 100%;
	font-size: 12px;
	color: rgba(15, 23, 42, 0.55);
	margin: 6px 0 2px;
	opacity: 0;
	animation: fadeIn 0.5s forwards;
}

.message-box {
	display: flex;
	align-items: flex-end;
	max-width: 70%;
	opacity: 0;
	animation: fadeIn 0.5s forwards;
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

@keyframes fadeIn {
	to {
		opacity: 1;
	}
}

.sent {
	align-self: flex-end;
}

.message-content {
	background: rgba(255, 255, 255, 0.75);
	color: #0f172a;
	padding: 14px 16px;
	border-radius: 18px;
	overflow: hidden;
	white-space: normal;
	line-height: 24px;
	font-size: 16px;
	box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
	backdrop-filter: blur(12px);
}

.sent .message-content {
	background: linear-gradient(135deg, #0a84ff, #5ac8fa);
	color: #ffffff;
	border-color: rgba(10, 132, 255, 0.4);
}
</style>
