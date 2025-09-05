<!-- src/components/MessageBox.vue -->
<template>
	<div v-if="visible" class="message-overlay" @click="handleOverlayClick">
		<div class="message-backdrop" :class="{ 'is-visible': overlayVisible }" />
		<div ref="modalRef" class="message-modal" :class="{ 'is-visible': modalVisible }" @click.stop>
			<div class="message-actions">
				<button class="message-button message-button--cancel" @click="handleCancel">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path d="M6 18L18 6M6 6L18 18" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
				<button class="message-button message-button--confirm" @click="handleConfirm">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
						<path d="M5 12L10 17L20 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>
			<div class="message-content">
				<div v-if="title" class="message-title">{{ title }}</div>
				<div v-if="message" class="message-text" v-html="message" />
				<div v-else class="message-text">
					<slot />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';

// Props
const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false
	},
	title: {
		type: String,
		default: ''
	},
	message: {
		type: String,
		default: ''
	},
	closeOnClickOverlay: {
		type: Boolean,
		default: false
	}
});

// Emits
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

// Refs
const visible = ref(false);
const overlayVisible = ref(false);
const modalVisible = ref(false);
const modalRef = ref(null);

// Watch modelValue
watch(
	() => props.modelValue,
	(newVal) => {
		if (newVal) {
			show();
		} else {
			hide();
		}
	}
);

// 显示模态框
const show = async () => {
	visible.value = true;
	await nextTick();
	// 触发过渡动画
	setTimeout(() => {
		overlayVisible.value = true;
		modalVisible.value = true;
	}, 10);
};

// 隐藏模态框
const hide = () => {
	overlayVisible.value = false;
	modalVisible.value = false;
	setTimeout(() => {
		visible.value = false;
		emit('update:modelValue', false);
	}, 300);
};

// 处理确认
const handleConfirm = () => {
	emit('confirm');
	hide();
};

// 处理取消
const handleCancel = () => {
	emit('cancel');
	hide();
};

// 处理遮罩层点击
const handleOverlayClick = () => {
	if (props.closeOnClickOverlay) {
		handleCancel();
	}
};

// 键盘事件处理
const handleKeydown = (event) => {
	if (event.key === 'Escape') {
		handleCancel();
	}
};

// 生命周期
onMounted(() => {
	document.addEventListener('keydown', handleKeydown);
});

// 清理事件监听
defineExpose({
	show,
	hide
});
</script>

<style scoped>
.message-overlay {
	position: fixed;
	inset: 0;
	z-index: 9999;
	display: flex;
	align-items: center;
	justify-content: center;
}

.message-backdrop {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(6px);
	opacity: 0;
	transition: opacity 0.3s ease;
}

.message-backdrop.is-visible {
	opacity: 1;
}

.message-modal {
	position: relative;
	width: 90vw;
	max-width: 600px;
	background: #ffffff;
	border-radius: 20px;
	box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
	transform: translateY(100vh);
	transition: transform 0.3s ease;
}

.message-modal.is-visible {
	transform: translateY(0);
}

.message-actions {
	position: absolute;
	top: 15px;
	left: 15px;
	right: 15px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	pointer-events: none;
}

.message-button {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: none;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8px 18px rgba(15, 23, 42, 0.15);
	transition: transform 0.2s ease;
	pointer-events: auto;
}

.message-button--cancel {
	background: #ffffff;
}

.message-button--confirm {
	background: #0a84ff;
}

.message-button:hover {
	transform: scale(1.08);
}

.message-content {
	padding: 60px 25px 30px;
}

.message-title {
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	text-align: center;
	margin-bottom: 15px;
}

.message-text {
	font-size: 16px;
	color: #4b5563;
	text-align: center;
	line-height: 1.6;
}
</style>
