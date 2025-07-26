<template>
  <div class="w-full min-h-60px bg-transparent">
    <div class="flex justify-center py-10px">
      <div class="relative inline-flex items-center bg-white rounded-30px shadow-md h-60px px-20px">
        <div
          class="absolute h-44px bg-blue-500 rounded-22px top-8px transition-all-300 ease-custom z-1"
          :style="sliderStyle"
        />
        
        <router-link
          v-for="tab in tabs"
          :key="tab.url"
          class="relative w-120px h-60px flex items-center justify-center no-underline cursor-pointer z-2 transition-colors-300 ease"
          :to="tab.url"
          ref="tabItems"
        >
          <span class="text-14px transition-all-300 ease" :class="{
            'text-white font-bold': $route.path === tab.url,
            'text-gray-500 hover:text-gray-700': $route.path !== tab.url
          }">
            {{ tab.label }}
          </span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

// Props
const props = defineProps({
  tabs: {
    type: Array,
    required: true,
    default: () => []
  }
})

// Composables
const route = useRoute()

// Refs
const tabItems = ref([])
const sliderPosition = ref(0)
const sliderWidth = ref(0)

// Computed
const sliderStyle = computed(() => ({
  left: `${sliderPosition.value}px`,
  width: `${sliderWidth.value}px`
}))

// Methods
const updateSlider = async () => {
  await nextTick()
  const activeIndex = props.tabs.findIndex(tab => route.path === tab.url)
  
  if (activeIndex !== -1 && tabItems.value[activeIndex]) {
    const activeItem = tabItems.value[activeIndex].$el || tabItems.value[activeIndex]
    sliderPosition.value = activeItem.offsetLeft
    sliderWidth.value = activeItem.offsetWidth
  } else {
    sliderPosition.value = 0
    sliderWidth.value = 0
  }
}

// Lifecycle
onMounted(() => {
  updateSlider()
})

// Watchers
watch(() => route.path, () => {
  updateSlider()
})

watch(() => props.tabs, () => {
  updateSlider()
})
</script>

<style scoped>
.ease-custom {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>