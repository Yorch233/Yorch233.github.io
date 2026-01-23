<template>
	<div class="flex flex-col gap-10px chat-container m-x-auto m-y-0 max-w-screen-lg">
		<template v-for="(msg, index) in messages">
			<div v-if="msg.date" class="date-label" :style="{ animationDelay: `${index * 0.5}s` }">
				{{ msg.date }}
			</div>
			<div class="message-box font-sans" :class="{ sent: msg.sent }" :style="{ animationDelay: `${index * 0.5}s` }">
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
.date-label {
	text-align: center;
	width: 100%;
	font-size: 12px;
	color: #888;
	margin-bottom: 5px;
	opacity: 0;
	animation: fadeIn 0.5s forwards;
}

.message-box {
	display: flex;
	align-items: flex-end;
	max-width: 60%;
	opacity: 0;
	animation: fadeIn 0.5s forwards;
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
	background-color: white;
	color: #222;
	padding: 15px;
	border-radius: 10px;
	overflow: hidden;
	white-space: normal;
	line-height: 24px;
	font-size: 18px;
	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	border: 1px solid rgba(240, 240, 240, 0.5);
}

.sent .message-content {
	background-color: #0084ff;
	color: white;
}
</style>
