<script setup>
import Tabs from '../components/Tabs.vue';
import profileData from '../data/profile.json';
import ProfileSidebar from '../components/ProfileSidebar.vue';
import Intro from './Intro.vue';

const tabList = [
	{ label: 'Home', url: '/' },
	{ label: 'Publications', url: '/publications' }
];
</script>

<template>
	<div class="w-full h-full">
		<el-container class="m-auto max-w-screen-2xl">
			<el-header>
				<Tabs :tabs="tabList" />
			</el-header>
			<el-container>
				<el-aside class="w-1/4">
					<ProfileSidebar :profile-data="profileData" />
				</el-aside>
				<el-main>
					<Intro class="font-mono" />
				</el-main>
			</el-container>
		</el-container>
	</div>
</template>
