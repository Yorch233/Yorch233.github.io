// src/utils/messageBox.js
import { createApp } from 'vue'
import MessageBoxManager from '../components/MessageBoxManager.vue'

let messageBoxInstance = null

export const getMessageBoxInstance = () => {
  if (!messageBoxInstance) {
    // 创建一个容器元素
    const container = document.createElement('div')
    document.body.appendChild(container)
    
    // 创建应用实例
    const app = createApp(MessageBoxManager)
    
    // 挂载组件
    const instance = app.mount(container)
    messageBoxInstance = instance
  }
  return messageBoxInstance
}

export const showMessageBox = (options) => {
  const instance = getMessageBoxInstance()
  return instance.show(options)
}

export const confirmMessageBox = (options) => {
  const instance = getMessageBoxInstance()
  return instance.confirm(options)
}

// 导出默认对象
export default {
  show: showMessageBox,
  confirm: confirmMessageBox
}