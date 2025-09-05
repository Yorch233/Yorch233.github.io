<!-- src/components/Tag.vue -->
<template>
	<div class="tag" :class="tagClass" @click="handleClick">
		<slot />
	</div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
	type: {
		type: String,
		default: 'default'
	}
});

// Emits
const emit = defineEmits(['click']);

const tagClass = computed(() => `tag--${props.type || 'default'}`);

// 处理点击事件
const handleClick = (event) => {
	emit('click', event);
};
</script>

<style scoped>
.tag {
	min-width: 120px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 10px;
	padding: 4px 12px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		background 0.2s ease,
		color 0.2s ease;
	border: 1px solid transparent;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
}

.tag--default {
	background: linear-gradient(90deg, rgba(243, 244, 246, 0.7), rgba(255, 255, 255, 0.9));
	color: #374151;
	border-color: rgba(229, 231, 235, 0.6);
}

.tag--default:hover {
	box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
}

.tag--blue {
	background: linear-gradient(90deg, rgba(219, 234, 254, 0.6), rgba(239, 246, 255, 0.8));
	color: #1d4ed8;
	border-color: rgba(191, 219, 254, 0.6);
}

.tag--purple {
	background: linear-gradient(90deg, rgba(237, 233, 254, 0.6), rgba(245, 243, 255, 0.85));
	color: #6d28d9;
	border-color: rgba(221, 214, 254, 0.6);
}

.tag--indigo {
	background: linear-gradient(90deg, rgba(224, 231, 255, 0.6), rgba(238, 242, 255, 0.85));
	color: #4338ca;
	border-color: rgba(199, 210, 254, 0.6);
}

.tag--teal {
	background: linear-gradient(90deg, rgba(204, 251, 241, 0.55), rgba(240, 253, 250, 0.85));
	color: #0f766e;
	border-color: rgba(153, 246, 228, 0.6);
}

.tag--green {
	background: linear-gradient(90deg, rgba(220, 252, 231, 0.55), rgba(240, 253, 244, 0.85));
	color: #15803d;
	border-color: rgba(187, 247, 208, 0.6);
}

.tag--yellow {
	background: linear-gradient(90deg, rgba(254, 249, 195, 0.65), rgba(254, 252, 232, 0.9));
	color: #a16207;
	border-color: rgba(253, 224, 71, 0.35);
}

.tag--orange {
	background: linear-gradient(90deg, rgba(255, 237, 213, 0.65), rgba(255, 247, 237, 0.9));
	color: #c2410c;
	border-color: rgba(254, 215, 170, 0.6);
}

.tag--red {
	background: linear-gradient(90deg, rgba(254, 226, 226, 0.65), rgba(254, 242, 242, 0.9));
	color: #b91c1c;
	border-color: rgba(254, 202, 202, 0.6);
}

.tag:hover {
	transform: translateY(-1px);
}
</style>
