<template>
	<nav class="app-tabs">
		<div class="app-tabs-track">
			<div class="app-tabs-slider" :style="sliderStyle" />
			<router-link v-for="tab in tabs" :key="tab.url" class="app-tab" :class="{ 'is-active': $route.path === tab.url }" :to="tab.url" ref="tabItems">
				<span>{{ tab.label }}</span>
			</router-link>
		</div>
	</nav>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

// Props
const props = defineProps({
	tabs: {
		type: Array,
		required: true,
		default: () => []
	}
});

// Composables
const route = useRoute();

// Refs
const tabItems = ref([]);
const sliderPosition = ref(0);
const sliderWidth = ref(0);

// Computed
const sliderStyle = computed(() => ({
	left: `${sliderPosition.value}px`,
	width: `${sliderWidth.value}px`
}));

// Methods
const updateSlider = async () => {
	await nextTick();
	const activeIndex = props.tabs.findIndex((tab) => route.path === tab.url);

	if (activeIndex !== -1 && tabItems.value[activeIndex]) {
		const activeItem = tabItems.value[activeIndex].$el || tabItems.value[activeIndex];
		sliderPosition.value = activeItem.offsetLeft;
		sliderWidth.value = activeItem.offsetWidth;
	} else {
		sliderPosition.value = 0;
		sliderWidth.value = 0;
	}
};

// Lifecycle
onMounted(() => {
	updateSlider();
});

// Watchers
watch(
	() => route.path,
	() => {
		updateSlider();
	}
);

watch(
	() => props.tabs,
	() => {
		updateSlider();
	}
);
</script>

<style scoped>
.app-tabs {
	display: flex;
	justify-content: center;
}

.app-tabs-track {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px;
	border-radius: 999px;
	background: linear-gradient(140deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.2));
	border: 1px solid rgba(255, 255, 255, 0.35);
	box-shadow:
		0 12px 30px rgba(15, 23, 42, 0.15),
		0 0 0 1px rgba(255, 255, 255, 0.25) inset;
	backdrop-filter: blur(22px) saturate(160%);
}

.app-tabs-track::before {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: 999px;
	background: linear-gradient(120deg, rgba(255, 255, 255, 0.45), transparent 45%);
	opacity: 0.65;
	pointer-events: none;
}

.app-tabs-slider {
	position: absolute;
	top: 6px;
	left: 0;
	height: calc(100% - 12px);
	background: linear-gradient(135deg, #0a84ff, #5ac8fa);
	border-radius: 999px;
	transition: all 0.3s ease;
	box-shadow: 0 10px 24px rgba(10, 132, 255, 0.35);
}

.app-tab {
	position: relative;
	padding: 10px 22px;
	font-size: 0.95rem;
	font-weight: 600;
	color: rgba(15, 23, 42, 0.6);
	text-decoration: none;
	border-radius: 999px;
	transition: color 0.2s ease;
	z-index: 1;
}

.app-tab:hover {
	color: rgba(15, 23, 42, 0.85);
}

.app-tab.is-active {
	color: #ffffff;
}
</style>
