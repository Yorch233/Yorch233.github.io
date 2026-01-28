<script setup>
import Intro from './Intro.vue';
</script>

<template>
	<div class="home-chat">
		<Intro />
	</div>
</template>

<style scoped>
.home-chat {
	animation: fadeInUp 0.8s ease both;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.home-chat {
		animation: none !important;
	}
}
</style>
