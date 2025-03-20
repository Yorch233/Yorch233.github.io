<template>
  <div class="chat-container">
    <template v-for="(msg, index) in messages" >
      <div v-if="msg.date" class="date-label"
        :style="{ animationDelay: `${index * 0.5}s` }"
      >
          {{ msg.date }}
        </div>
      <div class="chat-message"
        :class="{'sent': msg.sent}"
        :style="{ animationDelay: `${index * 0.5}s` }"
      >
        <div class="message-content">
          <span v-html="msg.content"></span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
// defineProps({
//   messages: {
//     type: Array,
//     required: true,
//     default: () => []
//   }
// });
const messages = [
  { content: 'Hello, can you briefly introduce yourself?', sent: true },
  { content: 'My name is <u>Qing Yao</u>, a P.h.D student from Jiangsu University. My research focuses on developing deep learning methods to understand multimdedia data. My current interests are in generative modeling, diffusion models and speech enhancmenet.', sent: false },
  { content: 'Very nice to meet you!', sent: false},
  { content: 'Long time no seen! How are you?', sent: false, date:'2024-07-20'},
  { content: 'I have released something interesting about my new work, namely "<u>Generative Speech Enhancement using Mean-Inverting Schrödinger Bridge</u>". Click <a href="/MISB"><u>here</u></a> to learn more about it.',
    sent: false}
];
</script>

<style scoped>

.chat-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 100px;
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.date-label {
  text-align: center;
  width: 100%;
  font-size: 12px;
  color: #888;
  margin-bottom: 5px;
  opacity: 0;
  animation: fadeIn 0.5s forwards;
}

.chat-message {
  display: flex;
  align-items: flex-end;
  max-width: 60%;
  opacity: 0;
  animation: fadeIn 0.5s forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.sent {
  align-self: flex-end;
}

.message-content {
  background-color: white;
  color: #222;
  padding: 10px;
  border-radius: 10px;
  overflow: hidden;
  white-space: normal;
  text-align: justify;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(240, 240, 240, 0.5);
}

.sent .message-content {
  background-color: #0084ff;
  color: white;
}

.message-content ::v-deep u {
  font-weight: bold;
  color: #0084ff;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-left: 10px;
}
</style>