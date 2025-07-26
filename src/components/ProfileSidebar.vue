<!-- src/components/ProfileSidebar.vue -->
<template>
  <div class="flex flex-col items-center justify-center bg-transparent">
    <div class="w-full max-w-320px bg-white rd-20px shadow-lg m-20px p-20px">
      <div class="flex justify-center">
        <img class="w-120px h-120px rd-1/2 shadow-md" :src="profileData.avatar" alt="Profile" />
      </div>
      <div class="flex flex-col items-center justify-center m-auto max-w-screen-sm p-10px gap-15px">
        <div class="font-size-24px font-bold">{{ profileData.name }}</div>
        
        <!-- 快捷链接区域 -->
        <div class="w-full flex justify-center gap-5px">
          <el-tooltip 
            v-for="link in profileData.links" 
            :key="link.url"
            effect="customized" 
            :content="link.tooltip" 
            placement="top"
          >
            <Tag 
              :type="link.type"
              @click="open(link.url)"
            >
              <div class="flex items-center w-full">
                <img 
                  v-if="link.icon.startsWith('http')" 
                  class="mr-2 flex-shrink-0" 
                  :src="link.icon.trim()" 
                  :width="link.iconSize?.width || 12" 
                  :height="link.iconSize?.height || 12" 
                />
                <img 
                  v-else 
                  class="mr-2 flex-shrink-0" 
                  :src="link.icon" 
                  :width="link.iconSize?.width || 12" 
                  :height="link.iconSize?.height || 12" 
                />
                <span class="flex-grow text-center">{{ link.label }}</span>
              </div>
            </Tag>
          </el-tooltip>
        </div>
        
        <!-- 联系信息 -->
        <div class="w-10/12 flex flex-col gap-10px p-y-20px p-x-15px">
          <div class="flex gap-10px">
            <img :src="getLocalIconPath('/logo/academic.svg')" width="20" height="20" />
            {{ profileData.contact.institution }}
          </div>
          <div class="flex gap-10px">
            <img :src="getLocalIconPath('/logo/email.svg')" width="20" height="20" />
            <a class="decoration-underline" :href="`mailto:${profileData.contact.email}`">{{ profileData.contact.email }}</a>
          </div>
        </div>
        
        <!-- 研究方向 -->
        <div class="text-#222 font-1000">{{ profileData.research.title }}</div>
        <div class="grid grid-cols-2 justify-center gap-5px">
          <Tag 
            v-for="research in profileData.research.items"
            :key="research.label"
            :type="research.type"
            @click="research.url ? open(research.url) : null"
          >
            <div class="flex items-center w-full h-36px">
              <img 
                v-if="research.icon.startsWith('http')" 
                class="w-18px h-18px mr-2 flex-shrink-0" 
                :src="research.icon.trim()" 
              />
              <img 
                v-else 
                class="w-18px h-18px mr-2 flex-shrink-0" 
                :src="research.icon" 
              />
              <span class="flex-grow text-center">{{ research.label }}</span>
            </div>
          </Tag>
        </div>
      </div>  
      
    </div>
  </div>
</template>

<script setup>
import messageBox from '../plugins/messageBox'


import Tag from './Tag.vue'

// Props
const props = defineProps({
  profileData: {
    type: Object,
    required: true
  }
})

// 获取public目录下图标路径（直接返回路径即可）
const getLocalIconPath = (iconPath) => {
  // public目录下的资源直接使用相对路径
  return iconPath;
}

// 打开链接
const open = (url) => {
  messageBox.confirm({
    title: 'Info',
    message: 'You are going to visit ' + url
  }).then(() => {
    window.open(url.trim(), '_blank');
  }).catch(() => {
    // 用户取消操作
  });
}

</script>