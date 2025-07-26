<!-- src/components/MessageBox.vue -->
<template>
  <div 
    v-if="visible" 
    class="fixed inset-0 z-1000 flex items-center justify-center"
    @click="handleOverlayClick"
  >
    <!-- 遮罩层 -->
    <div 
      class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
      :class="overlayVisible ? 'opacity-100' : 'opacity-0'"
    />
    
    <!-- 模态框 -->
    <div 
      ref="modalRef"
      class="relative w-90vw max-w-600px bg-white rd-20px shadow-xl transition-transform duration-300 ease-out"
      :class="modalVisible ? 'translate-y-0' : 'translate-y-100vh'"
      @click.stop
    >
      <!-- 顶部按钮区域 -->
      <div class="absolute top-15px left-15px z-10">
        <button
          class="w-36px h-36px rd-1/2 bg-white shadow-lg flex items-center justify-center transition-all-300 hover:scale-110 active:scale-95 border-none cursor-pointer"
          @click="handleCancel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M6 18L18 6M6 6L18 18" 
              stroke="#666" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      
      <div class="absolute top-15px right-15px z-10">
        <button
          class="w-36px h-36px rd-1/2 bg-blue-500 shadow-lg flex items-center justify-center transition-all-300 hover:scale-110 active:scale-95 border-none cursor-pointer"
          @click="handleConfirm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M5 12L10 17L20 7" 
              stroke="white" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      
      <!-- 内容区域 -->
      <div class="pt-60px pb-30px px-25px">
        <div v-if="title" class="text-20px font-bold text-center text-gray-800 mb-15px">
          {{ title }}
        </div>
        <div 
          v-if="message" 
          class="text-16px text-gray-600 text-center leading-6"
          v-html="message"
        />
        <div 
          v-else 
          class="text-16px text-gray-600 text-center leading-6"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

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
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// Refs
const visible = ref(false)
const overlayVisible = ref(false)
const modalVisible = ref(false)
const modalRef = ref(null)

// Watch modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    show()
  } else {
    hide()
  }
})

// 显示模态框
const show = async () => {
  visible.value = true
  await nextTick()
  // 触发过渡动画
  setTimeout(() => {
    overlayVisible.value = true
    modalVisible.value = true
  }, 10)
}

// 隐藏模态框
const hide = () => {
  overlayVisible.value = false
  modalVisible.value = false
  setTimeout(() => {
    visible.value = false
    emit('update:modelValue', false)
  }, 300)
}

// 处理确认
const handleConfirm = () => {
  emit('confirm')
  hide()
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
  hide()
}

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    handleCancel()
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    handleCancel()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

// 清理事件监听
defineExpose({
  show,
  hide
})
</script>

<style scoped>
/* 确保模态框层级最高 */
.fixed {
  z-index: 9999;
}
</style>