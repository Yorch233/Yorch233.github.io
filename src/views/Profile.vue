<script setup>
import profile from "../assets/profile/profile.jpeg";
import ChatBox from "../components/ChatBox.vue";

function scrollToId(id) {
  const element = document.querySelector(id);
  const headerHeight = document.querySelector('.header').offsetHeight;

  if (element) {
    const offsetPosition = element.offsetTop - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

</script>

<template>
  <!-- <nav class="header">
    <ul>
      <li><a @click="scrollToId('#about-me')">About Me</a></li>
      <li><a @click="scrollToId('#publications')">Publications</a></li>
    </ul>
  </nav> -->
  <div class="content-wrapper">
    <aside class="sidebar">
      <div class="profile">
        <img :src="profile" alt="Profile" style="font-"/>
        <h2>Qing Yao 姚庆</h2>
        <p>Jiangsu University</p>
        <p>Speech Enhancement, Diffusion Models</p>
        <p><a href="mailto:qyao@stmail.ujs.edu.cn"> qyao@stmail.ujs.edu.cn</a></p>
      </div>
      <ul class="links">
        <!-- <li><i class="icon">🔍</i> Google Scholar</li> -->
        <!-- <li><i class="icon">🆔</i> ORCID</li> --> 
        <li><image src="https://github.githubassets.com/favicons/favicon.svg" width="24" height="24" style="margin-right:5px;"/> <a href="https://github.com/Yorch233/"> Github</a></li>
        <li><image src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" width="24" height="24" style="margin-right:5px;"/> <a href="https://huggingface.co/Yorch233/"> Hugging Face</a></li>

      </ul>
    </aside>
    <div class="content-container">
      <ChatBox />
    </div>
  </div>
</template>

<style scoped>
.header {
  background-color: #fff;
  position: sticky;
  height: 48px;
  width: 100%;
  z-index: 20;
  top:0;
  border-bottom: 1px solid #e7e7e7;
}

.header ul {
  list-style: none;
  display: flex;
  justify-content: center;
  line-height: 48px;
  margin: 0;
  padding: 0;
}

.header ul li {
  margin: 0 15px;
}

.header ul li a {
  text-decoration: none;
  color: #333;
}

.sidebar {
  width: 300px;
  background-color: var(--background-color);
  color: var(--text-color);
  min-height: 600px;
  padding: 20px;
}

.profile {
  text-align: center;
  margin-bottom: 20px;
}

.profile img {
  border-radius: 50%;
  width: 120px;
  height: 120px;
  object-fit: cover;
  object-position: center center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.links {
  list-style: none;
  padding: 0;
}

.links li {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.links li .icon {
  margin-right: 10px;
}


.content-wrapper {
  display: flex;
  color: var(--text-color);
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Helvetica, Arial, sans-serif;
  max-width: 1440px;
  margin: 0 auto;
}

.content-container {
  min-height: 600px;
}

.content h1.title {
  font-size: 2em;
  border-bottom: 1px solid var(--text-color);
}

.content p, .content ul {
  color: var(--text-color);
}

.content ul {
  list-style-type: none;
  padding: 0;
}

.content ul li {
  margin-bottom: 1em;
}

.content strong {
  color: var(--text-color);
}

.content {
  margin-bottom: 2em;
}

a {
  color: var(--primary-color);
  text-decoration: none;
}
</style>