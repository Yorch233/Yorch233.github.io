<!-- src/components/MessageBoxManager.vue -->
<template>
  <MessageBox
    v-model="isVisible"
    :title="currentOptions.title"
    :message="currentOptions.message"
    :close-on-click-overlay="currentOptions.closeOnClickOverlay"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <div v-if="currentOptions.content" v-html="currentOptions.content" />
  </MessageBox>
</template>

<script setup>
import { ref } from 'vue'
import MessageBox from './MessageBox.vue'

// 状态管理
const isVisible = ref(false)
const currentOptions = ref({
  title: '',
  message: '',
  content: '',
  closeOnClickOverlay: false
})

// Promise 控制
let resolvePromise = null
let rejectPromise = null

// 显示消息框
const show = (options = {}) => {
  // 默认配置
  const defaultOptions = {
    title: '',
    message: '',
    content: '',
    closeOnClickOverlay: false
  }
  
  currentOptions.value = { ...defaultOptions, ...options }
  isVisible.value = true
  
  // 返回 Promise
  return new Promise((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
}

// 处理确认
const handleConfirm = () => {
  if (resolvePromise) {
    resolvePromise(true)
  }
}

// 处理取消
const handleCancel = () => {
  if (rejectPromise) {
    rejectPromise(false)
  }
}

// 确认方法
const confirm = (options) => {
  return show(options)
}

// 暴露方法给外部调用
defineExpose({
  show,
  confirm
})
</script>