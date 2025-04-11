<style scoped></style>

<script setup>
import { ElMessageBox } from 'element-plus';
import Academic from '../assets/logo/academic.svg';
import Email from '../assets/logo/email.svg';
import Speech from '../assets/logo/speech.svg';
import Profile from '../assets/profile/profile.png';
import ChatBox from '../components/ChatBox.vue';
const open = (url) => {
	ElMessageBox.confirm('You are going to visit ' + url + ' ', 'Info', {
		confirmButtonText: 'Continue',
		cancelButtonText: 'Cancel',
		draggable: true
	}).then(() => {
		window.open(url);
	});
};
</script>

<template>
	<div class="w-full h-full p-t-50px">
		<el-container>
			<!-- <el-header>Head</el-header> -->
			<el-container class="m-auto max-w-screen-2xl">
				<el-aside class="w-1/4">
					<div class="flex flex-col items-center justify-center">
						<img class="w-120px h-120px rd-1/2 shadow-xl" :src="Profile" alt="Profile" />
						<div class="flex flex-col items-center justify-center m-auto max-w-screen-sm p-10px gap-15px">
							<div class="font-size-24px font-bold">Qing Yao</div>
							<div class="font-size-18px text-#444">
								<el-tooltip class="" effect="customized" placement="top">
									<template #content>
										<div class="w-400px text-#444 text-align-justify">
											<strong>Yao (Chinese: 姚; pinyin: Yáo)</strong>
											, also romanized as Yiu in Cantonese, is one of the most ancient Chinese surnames, the "Eight Great Xings of High Antiquity". It is also unique that, along
											with Jiang 姜 it is still in common use in the modern day. It is listed 101st in the Hundred Family Surnames, and as the 51st most common surname in
											Mainland China.
										</div>
									</template>
									<span class="m-r-10px hover:decoration-underline cursor-pointer">姚</span>
								</el-tooltip>
								<span>庆</span>
							</div>
							<div class="w-full flex justify-center gap-5px">
								<el-tooltip effect="customized" content="@Yorch233" placement="top">
									<el-check-tag effect="plain" class="rd-10px font-200" @click="open('https://github.com/Yorch233/')">
										<img m-r-1px src="https://github.githubassets.com/favicons/favicon.svg" width="12" height="12" />
										Github
									</el-check-tag>
								</el-tooltip>
								<el-tooltip class="" effect="customized" content="@Yorch233" placement="top">
									<el-check-tag effect="plain" class="rd-10px font-200 bg-#FCF4CA text-amber hover:bg-amber-200" @click="open('https://huggingface.co/Yorch233/')">
										<img class="m-r-1px" src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" width="12" height="12" />
										Hugging Face
									</el-check-tag>
								</el-tooltip>
							</div>
							<div class="w-10/12 flex flex-col gap-10px p-y-20px p-x-15px">
								<div class="flex gap-10px">
									<img :src="Academic" width="20" height="20" />
									Jiangsu University
								</div>
								<div class="flex gap-10px">
									<img :src="Email" width="20" height="20" />
									<a class="decoration-underline" href="mailto:qyao@stmail.ujs.edu.cn">qyao@stmail.ujs.edu.cn</a>
								</div>
							</div>
							<div class="text-#222 font-1000">Interests</div>
							<div class="grid cols-2 justify-center gap-5px">
								<el-check-tag effect="plain" class="cols-1 rd-10px bg-[#007aff]/15 text-#555 hover:bg-[#007aff]/25 h-36px">
									<div class="h-36px flex justify-center gap-5px">
										<img class="w-18px h-18px m-auto" :src="Speech" />
										<span class="m-auto text-center">Speech Enhancement</span>
									</div>
								</el-check-tag>
								<el-check-tag effect="plain" class="cols-1 rd-10px bg-[#222]/5 text-#555 hover:bg-[#222]/10 h-36px">
									<div class="h-36px flex justify-center gap-5px">
										<img class="w-18px h-18px m-auto" :src="Speech" />
										<span class="m-auto text-center">Schrödinger Bridge</span>
									</div>
								</el-check-tag>
							</div>
						</div>
					</div>
				</el-aside>
				<el-main class="w-3/4">
					<ChatBox />
				</el-main>
			</el-container>
		</el-container>
	</div>
</template>
