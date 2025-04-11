<template>
	<div class="tab-container">
		<el-tabs v-model="activeTab" class="custom-tabs">
			<el-tab-pane v-for="tab in tabs" :key="tab.value" :label="tab.label" :name="tab.value">
				<slot :name="tab.value"></slot>
			</el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup>
import { ref } from 'vue';

const tabs = [
	{ label: '个性推荐', value: 'recommend' },
	{ label: '正在关注', value: 'following' },
	{ label: '订阅剧集', value: 'subscribed' },
	{ label: '热门视频', value: 'popular' },
	{ label: '排行', value: 'ranking' },
	{ label: '直播', value: 'live' }
];
const activeTab = ref('recommend');
</script>

<style scoped>
.tab-container {
	background-color: #f5f5f5;
	border-radius: 10px;
	padding: 10px;
	height: 60px;
	width: 400px;
}

.custom-tabs {
	height: 60px;
}

.custom-tabs :deep(.el-tabs__header) {
	margin: 0;
	border-radius: 10px;
	overflow: hidden;
}

.custom-tabs :deep(.el-tabs__nav) {
	background-color: #fff;
	border-radius: 10px;
	display: flex;
	justify-content: flex-start;
}

.custom-tabs :deep(.el-tabs__item) {
	color: #606266;
	font-size: 14px;
	padding: 0 20px;
	height: 40px;
	line-height: 40px;
	border-radius: 20px;
}

.custom-tabs :deep(.el-tabs__nav .el-tabs__item.is-active) {
	color: #fff;
	background-color: #000;
}
</style>
