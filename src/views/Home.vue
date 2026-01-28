<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Tabs from '../components/Tabs.vue';
import profileData from '../data/profile.json';
import ProfileSidebar from '../components/ProfileSidebar.vue';

const tabList = [
	{ label: 'Home', url: '/' },
	{ label: 'Publications', url: '/publications' }
];

const route = useRoute();

const headerContent = computed(() => {
	if (route.name === 'HomePublications') {
		return { eyebrow: 'Library', title: 'Publications' };
	}
	return { eyebrow: 'Messages', title: 'Dialog' };
});

const mainBodyRef = ref(null);
const isScrolling = ref(false);
let scrollTimer;

const handleScroll = () => {
	isScrolling.value = true;
	if (scrollTimer) {
		clearTimeout(scrollTimer);
	}
	scrollTimer = setTimeout(() => {
		isScrolling.value = false;
	}, 900);
};

onMounted(() => {
	if (mainBodyRef.value) {
		mainBodyRef.value.addEventListener('scroll', handleScroll, { passive: true });
	}
});

onBeforeUnmount(() => {
	if (mainBodyRef.value) {
		mainBodyRef.value.removeEventListener('scroll', handleScroll);
	}
	if (scrollTimer) {
		clearTimeout(scrollTimer);
	}
});
</script>

<template>
	<div class="app-shell">
		<div class="app-stack">
			<section class="app-window">
				<div class="app-content">
					<aside class="app-sidebar">
						<ProfileSidebar :profile-data="profileData" />
					</aside>
					<div class="app-main">
						<header class="app-header">
							<div>
								<p class="app-eyebrow">{{ headerContent.eyebrow }}</p>
								<h1 class="app-title">{{ headerContent.title }}</h1>
							</div>
						</header>
						<main ref="mainBodyRef" class="app-main-body" :class="{ 'is-scrolling': isScrolling }">
							<router-view />
						</main>
					</div>
				</div>
			</section>
			<div class="app-tabs-dock">
				<Tabs :tabs="tabList" />
			</div>
		</div>
	</div>
</template>

<style scoped>
.app-shell {
	min-height: 100vh;
	width: 100%;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px 20px 56px;
	background:
		radial-gradient(circle at 12% 18%, rgba(90, 197, 250, 0.35), transparent 40%), radial-gradient(circle at 88% 18%, rgba(42, 132, 255, 0.22), transparent 45%),
		radial-gradient(circle at 50% 85%, rgba(90, 197, 250, 0.16), transparent 55%), #edf1f6;
	overflow: hidden;
}

:global(html),
:global(body),
:global(#app) {
	height: 100%;
	width: 100%;
	overflow: hidden;
}

.app-stack {
	width: min(92vw, 1200px);
	min-width: 800px;
	max-width: 100%;
	height: min(86vh, 900px);
	min-height: 600px;
	max-height: 100%;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 10px;
	animation: appFadeIn 0.6s ease both;
}

.app-window {
	position: relative;
	overflow: hidden;
	width: 100%;
	flex: 1 1 auto;
	min-height: 0;
	max-height: 100%;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.35));
	border: 1px solid rgba(255, 255, 255, 0.45);
	box-shadow:
		0 30px 70px rgba(15, 23, 42, 0.12),
		0 0 0 1px rgba(255, 255, 255, 0.6) inset,
		0 18px 40px rgba(90, 197, 250, 0.18);
	backdrop-filter: blur(22px) saturate(160%);
	border-radius: 28px;
	padding: 24px;
	display: grid;
	gap: 16px;
	animation: appFadeInUp 0.7s ease both;
}

.app-window::before {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(120deg, rgba(255, 255, 255, 0.7), transparent 45%), radial-gradient(circle at 18% 12%, rgba(90, 197, 250, 0.18), transparent 40%);
	opacity: 0.6;
	pointer-events: none;
}

.app-header {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 15px;
	background: transparent;
	z-index: 2;
	animation: appFadeIn 0.8s ease both;
}

.app-eyebrow {
	margin: 0 0 6px;
	font-size: 0.75rem;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: rgba(15, 23, 42, 0.55);
	font-weight: 700;
}

.app-title {
	margin: 0;
	font-size: 2rem;
	color: #0f172a;
	font-weight: 700;
}

.app-header-badge {
	padding: 6px 14px;
	border-radius: 999px;
	background: rgba(0, 113, 227, 0.12);
	color: #0071e3;
	font-weight: 600;
	font-size: 0.85rem;
}

.app-content {
	display: grid;
	grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
	gap: 20px;
	align-items: stretch;
	min-height: 0;
	flex: 1 1 auto;
}

.app-sidebar,
.app-main {
	position: relative;
	z-index: 1;
	animation: appFadeInUp 0.8s ease both;
}

.app-sidebar {
	animation-delay: 0.08s;
}

.app-main {
	animation-delay: 0.12s;
}

.app-main {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 0 0 10px;
	min-height: 0;
	position: relative;
	--app-header-offset: 100px;
}

.app-main-body {
	flex: 1;
	padding: calc(25px + var(--app-header-offset)) 25px 25px;
	min-height: 0;
	overflow-y: auto;
	overflow-x: hidden;
	scrollbar-width: thin;
	scrollbar-color: transparent transparent;
	mask-image: linear-gradient(transparent, #000 110px, #000 100%);
	-webkit-mask-image: linear-gradient(transparent, #000 110px, #000 100%);
	padding-right: calc(25px + 10px);
	margin-right: -10px;
}

.app-main-body::-webkit-scrollbar {
	width: 10px;
}

.app-main-body::-webkit-scrollbar-track {
	background: transparent;
}

.app-main-body::-webkit-scrollbar-thumb {
	background: transparent;
	border-radius: 999px;
	border: 2px solid transparent;
	background-clip: padding-box;
}

.app-main-body.is-scrolling {
	scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
}

.app-main-body.is-scrolling::-webkit-scrollbar {
	width: 10px;
}

.app-main-body.is-scrolling::-webkit-scrollbar-thumb {
	background: rgba(148, 163, 184, 0.45);
}

.app-sidebar {
	display: flex;
	height: 100%;
}

.app-tabs-dock {
	display: flex;
	justify-content: center;
	margin-top: 0;
	flex-shrink: 0;
	animation: appFadeInUp 0.9s ease both;
	animation-delay: 0.16s;
}

@keyframes appFadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes appFadeInUp {
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
	.app-stack,
	.app-window,
	.app-header,
	.app-sidebar,
	.app-main,
	.app-tabs-dock {
		animation: none !important;
	}
}

@media (max-width: 980px) {
	.app-content {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 520px) {
	.app-shell {
		padding: 32px 16px 48px;
	}

	.app-window {
		border-radius: 20px;
		padding: 22px 18px 16px;
	}
}
</style>
