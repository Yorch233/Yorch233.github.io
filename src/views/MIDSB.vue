<script setup>
defineProps({
  title: {
    type: String,
    default: "Generative Speech Enhancement <br> using Mean-Inverting Diffusion Schrödinger Bridge"
  },
  authors: {
    type: String,
    default: "Qing Yao, Lijian Gao, Qirong Mao and Ming Dong"
  },
  contact: {
    type: Object,
    default:  () => ([
        "qirong_mao@ujs.edu.cn"
    ])
  },
  abstract: {
    type: String,
    default: "Diffusion models have demonstrated exceptional potential in monaural speech enhancement by learning the underlying distribution. Current hybrid methods further promote the performance upper bound via integrating discriminator but at the cost of inherited poor generalization. Meanwhile, the iterative reverse process imposes a great computational burden and discrete errors accumulated on the trajectory. This letter aims to explore the potential of diffusion schrödinger bridge in speech enhancement tasks and proposes the Mean-Inverting Diffusion Schrödinger Bridge (MIDSB) framework. This method introduces the posterior mean information, proposing an approximate yet efficient re-parameterization method for generating high-quality clean speech in few steps. Furthermore, by utilizing proposed high-order hybrid sampler, MIDSB achieves significant improvements in perceptual speech quality over existing state-of-the-art generative methods across various benchmarks. Comprehensive evaluations, including ablation studies on integration strategies and sampling efficiency, clearly  demonstrate the promising advancement of our method. "
  },
  reference: {
    type: Object,
    default: () => ([
            "C Veaux, J Yamagishi, and S King. \"The voice bank corpus: Design, collection and data analysis of a large regional accent speech database.\" 2013 international conference oriental COCOSDA held jointly with 2013 conference on Asian spoken language research and evaluation (O-COCOSDA/CASLRE), 2013. " +
            "[<a href='https://datashare.ed.ac.uk/handle/10283/3443'>Data</a>]",
            "SW Fu, C Yu, TA Hsieh, et al. \"MetricGAN+: An Improved Version of MetricGAN for Speech Enhancement. arXiv 2021.\" arXiv preprint arXiv:2104.03538, 2021." +
            "[<a href='https://arxiv.org/abs/2104.03538'>Paper</a>][<a href='https://github.com/speechbrain/speechbrain/tree/develop/recipes/Voicebank/enhance/MetricGAN'>Code</a>]",
            "YX Lu, Y Ai, ZH Ling. \"MP-SENet: A speech enhancement model with parallel denoising of magnitude and phase spectra.\" arXiv preprint arXiv:2305.13686, 2023.",
            "YJ Lu, ZQ Wang, S Watanabe, et al. \"Conditional diffusion probabilistic model for speech enhancement.\" 2022 IEEE International Conference on Acoustics, Speech and Signal Processing (ICASSP 2022), 2022.",
            "J Richter, S Welker, JM Lemercier, et al. \"Speech enhancement and dereverberation with diffusion-based generative models.\" IEEE/ACM Transactions on Audio, Speech, and Language Processing, 2023.",
            "JM Lemercier, J Richter, S Welker, et al. \"StoRM: A diffusion-based stochastic regeneration model for speech enhancement and dereverberation\" IEEE/ACM Transactions on Audio, Speech, and Language Processing, 2023.",

    ])
  },
  citation: {
    type: String,
    default: "Doe, J., Smith, J., & Johnson, A. (2023). Speech Enhancement Techniques Using Deep Learning. Journal of Speech Processing, 45(3), 123-145."
  },
  audioSamples: {
    type: Object,
    default: () => ({
      voicebank: [
        "p232_043.wav",
        "p232_088.wav",
        "p232_231.wav",
        "p232_254.wav",
        "p232_255.wav",
        "p257_057.wav",
        "p257_082.wav",
        "p257_212.wav",
        "p257_375.wav",
        "p257_397.wav",
      ]
    })
  },
  links: {
    type: Object,
    default: () => ({
      paper: "https://www.example.com/paper",
      code: "https://github.com/qyao1999/MIDSB",
      checkpoint: "https://www.example.com/checkpoint"
    })
  }
})

import bridge from "../assets/MIDSB/images/bridge.png"
import {Mail} from '@icon-park/vue-next'

 function getSampleSrc(folder, sample) {
      return new URL(`../assets/MIDSB/audio/samples/${folder}/${sample}`, import.meta.url).href;
 }
</script>

<template>
  <div class="paper-container">
    <h1 v-html="title"></h1>
    <p class="authors">Authors: {{ authors }}</p>
    <p class="contact">Contact: <a v-for="(mail, index) in contact"  :href="'mailto:' + mail"><mail theme="outline" size="16" fill="#2F88FF"/> {{ mail }}</a></p>
    <p class="links">
      <span style="cursor: not-allowed;">[Paper]</span> |
      <a :href="links.code" target="_blank">[Code]</a> |
      <span style="cursor: not-allowed;">[Checkpoint]</span>
    </p>
    <section class="abstract">
      <h2>Abstract</h2>
      <p>{{ abstract }}</p>
    </section>

    <section class="content">
      <div class="content-part">
        <img :src="bridge" width="1000px"/>
      </div>

      <div class="content-part">
        <h2>Audio Samples</h2>
        <div>
          <h3>Voicebank+DEMAND<a href="#ref-0">[1]</a></h3>
          <div class="audio-table">
            <div class="audio-header">
              <div>Sample Name </div>
              <div>Noisy</div>
              <div>Metric-GAN++<a href="#ref-1">[2]</a></div>
              <div>MP_SENet<a href="#ref-2">[3]</a></div>
              <div>CDiffuSE<a href="#ref-3">[4]</a></div>
              <div>SGMSE+<a href="#ref-4">[5]</a></div>
              <div>StoRM<a href="#ref-5">[6]</a></div>
              <div>MIDSB (ours)</div>
              <div>Clean</div>
            </div>
            <div v-for="(sample, index) in audioSamples.voicebank" :key="index" class="audio-row">
              <div style="text-align: center;line-height: 54px;align-items: center;">{{ sample }}</div>
              <audio :src="getSampleSrc('noisy', sample)" controls></audio>
              <audio :src="getSampleSrc('metric-gan', sample)" controls></audio>
              <audio :src="getSampleSrc('mp_senet', sample)" controls></audio>
              <audio :src="getSampleSrc('cdiffuse', sample)" controls></audio>
              <audio :src="getSampleSrc('sgmse+', sample)" controls></audio>
              <audio :src="getSampleSrc('storm', sample)" controls></audio>
              <audio :src="getSampleSrc('midsb', sample)" controls></audio>
              <audio :src="getSampleSrc('clean', sample)" controls></audio>
            </div>
          </div>
        </div>

      </div>
      <div class="content-part">
        <h2>References</h2>
        <div class="reference">
          <p v-for="(ref, index) in reference" :key="index" :id="'ref-'+ index">[{{index+1}}] <span v-html="ref"></span></p>
        </div>
      </div>

<!--      <div class="content-part">-->
<!--        <h2>Citation</h2>-->
<!--        <p>{{ citation }}</p>-->
<!--      </div>-->
    </section>
  </div>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

.paper-container {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Helvetica, Arial, sans-serif;
  padding: 20px;
  max-width: 1600px;
  min-width: 1200px;
  margin: 2em auto;
  color: #333;
}

h1 {
  font-size: 2.5em;
  margin-bottom: 0.5em;
  color: #333;
  text-align: center;
}

.authors, .contact, .links {
  margin-bottom: 1em;
  color: #666;
  text-align: center;
}

a {
  color: #007bff;
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}

.abstract {
  text-align: center;
  margin-bottom: 2.5em;
}

.abstract p {
  text-indent: 2em;
  font-size: 1em;
  line-height: 1.7;
  color: #666;
  text-align: justify;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2em;
}

.content-part {
  text-align: center;
  margin-bottom: 2.5em;
  padding: 0 1em;
}

h2 {
  font-size: 1.75em;
  margin-bottom: 0.5em;
  color: #333;
  border-bottom: 2px solid #ddd;
  padding-bottom: 0.3em;
  position: relative;
}

h2::after {
  content: '';
  width: 50px;
  height: 3px;
  background: #007bff;
  position: absolute;
  bottom: -3px;
  left: 0;
}

.audio-table {
  display: grid;
  gap: 10px;
}

.audio-header, .audio-row {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 10px;
}

.audio-header div {
  font-weight: bold;
  text-align: center;
}

audio {
  width: 100%;
  outline: none;
}

.reference{
  text-align: justify;
  line-height: 22px;
  text-indent: -2em;
  padding-left: 2em;
}
.references p {
  font-size: 0.9em;
  line-height: 1.6;
  color: #666;
}
</style>