<!-- src/components/Tag.vue -->
<template>
  <div 
    class="min-w-120px inline-flex items-center justify-center rd-10px px-3 py-1 text-14px cursor-pointer transition-all-300 ease font-medium border-0 shadow-sm"
    :class="tagClasses"
    @click="handleClick"
  >
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  type: {
    type: String,
    default: 'default'
  }
})

// Emits
const emit = defineEmits(['click'])

// 高透明度现代渐变配色方案
const typeStyles = {
  default: {
    base: 'bg-gradient-to-r from-gray-100/60 to-white/80 text-gray-700 border border-gray-200/50',
    hover: 'hover:from-gray-100/70 hover:to-white/90 hover:shadow-md'
  },
  blue: {
    base: 'bg-gradient-to-r from-blue-50/40 to-blue-100/30 text-blue-700 border border-blue-200/40',
    hover: 'hover:from-blue-100/50 hover:to-blue-50/60 hover:shadow-md hover:shadow-blue-100/30'
  },
  purple: {
    base: 'bg-gradient-to-r from-purple-50/40 to-purple-100/30 text-purple-700 border border-purple-200/40',
    hover: 'hover:from-purple-100/50 hover:to-purple-50/60 hover:shadow-md hover:shadow-purple-100/30'
  },
  indigo: {
    base: 'bg-gradient-to-r from-indigo-50/40 to-indigo-100/30 text-indigo-700 border border-indigo-200/40',
    hover: 'hover:from-indigo-100/50 hover:to-indigo-50/60 hover:shadow-md hover:shadow-indigo-100/30'
  },
  teal: {
    base: 'bg-gradient-to-r from-teal-50/40 to-teal-100/30 text-teal-700 border border-teal-200/40',
    hover: 'hover:from-teal-100/50 hover:to-teal-50/60 hover:shadow-md hover:shadow-teal-100/30'
  },
  green: {
    base: 'bg-gradient-to-r from-green-50/40 to-green-100/30 text-green-700 border border-green-200/40',
    hover: 'hover:from-green-100/50 hover:to-green-50/60 hover:shadow-md hover:shadow-green-100/30'
  },
  yellow: {
    base: 'bg-gradient-to-r from-yellow-50/40 to-yellow-100/30 text-yellow-700 border border-yellow-200/40',
    hover: 'hover:from-yellow-100/50 hover:to-yellow-50/60 hover:shadow-md hover:shadow-yellow-100/30'
  },
  orange: {
    base: 'bg-gradient-to-r from-orange-50/40 to-orange-100/30 text-orange-700 border border-orange-200/40',
    hover: 'hover:from-orange-100/50 hover:to-orange-50/60 hover:shadow-md hover:shadow-orange-100/30'
  },
  red: {
    base: 'bg-gradient-to-r from-red-50/40 to-red-100/30 text-red-700 border border-red-200/40',
    hover: 'hover:from-red-100/50 hover:to-red-50/60 hover:shadow-md hover:shadow-red-100/30'
  }
}

// 计算标签类
const tagClasses = computed(() => {
  const style = typeStyles[props.type] || typeStyles.default
  return [style.base, style.hover]
})

// 处理点击事件
const handleClick = (event) => {
  emit('click', event)
}
</script>