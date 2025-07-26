<script setup>
import Tabs from './components/Tabs.vue';
import profileData from './data/profile.json'
import ProfileSidebar from './components/ProfileSidebar.vue'


const tabList = [
	{ label: 'Home', url: '/' },
	{ label: 'Publications', url: '/publications' },
];
</script>

<template>
	<div class="w-full h-full">
		<el-container class="m-auto max-w-screen-2xl">
			<el-header>
				<Tabs :tabs="tabList"/>
			</el-header>
			<el-container>
				<el-aside class="w-1/4">
					<ProfileSidebar :profile-data="profileData" />
				</el-aside>
				<el-main>
					<router-view class="font-mono" />
				</el-main>
			</el-container>
		</el-container>
	</div>
</template>

<style>
:root {
	--background-color: #fff;
	--primary-color: #007aff;
	--secondary-color: #2f88ff;
	--text-color: #333;
	--secondary-text-color: #666;
	--border-color: #ddd;
}

strong {
	color: var(--primary-color);
	font-weight: bold;
}

a {
	color: var(--primary-color);
	font-weight: bold;
	text-decoration: underline;
}

.el-popper.is-customized {
	padding: 6px 12px;
	background: white;
	box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.1), 0 16px 32px 0 rgba(0, 0, 0, 0.01);
	border-radius: 10px;
}

.el-popper.is-customized .el-popper__arrow::before {
	background: white;
	right: 0;
	box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.1), 0 16px 32px 0 rgba(0, 0, 0, 0.01);
}
</style>
