<!-- src/components/ProfileSidebar.vue -->
<template>
	<div class="profile-shell">
		<div class="profile-card">
			<div class="profile-header">
				<div class="profile-avatar">
					<img class="profile-avatar-img" :src="profileData.avatar" alt="Profile" />
				</div>
				<div class="profile-name">{{ profileData.name }}</div>
				<!-- <div class="profile-subtitle">Jiangsu University</div> -->
			</div>
			<div class="profile-content">
				<!-- 快捷链接区域 -->
				<div class="profile-links">
					<el-tooltip v-for="link in profileData.links" :key="link.url" effect="customized" :content="link.tooltip" placement="top">
						<Tag :type="link.type" @click="open(link.url)">
							<div class="profile-link-item">
								<img v-if="link.icon.startsWith('http')" class="profile-link-icon" :src="link.icon.trim()" :width="link.iconSize?.width || 12" :height="link.iconSize?.height || 12" />
								<img v-else class="profile-link-icon" :src="link.icon" :width="link.iconSize?.width || 12" :height="link.iconSize?.height || 12" />
								<span class="profile-link-text">{{ link.label }}</span>
							</div>
						</Tag>
					</el-tooltip>
				</div>

				<div class="profile-divider"></div>

				<!-- 联系信息 -->
				<div class="profile-contact">
					<div class="profile-contact-item">
						<img :src="getLocalIconPath('/logo/school.svg')" width="20" height="20" />
						<span>{{ profileData.contact.institution }}</span>
					</div>
					<div class="profile-contact-item">
						<img :src="getLocalIconPath('/logo/mail.svg')" width="20" height="20" />
						<a class="profile-email" :href="`mailto:${profileData.contact.email}`">{{ profileData.contact.email }}</a>
					</div>
				</div>

				<div class="profile-divider"></div>

				<!-- 研究画像 -->
				<div class="profile-section">
					<div class="profile-section-title">{{ profileData.research.title }}</div>
					<div class="profile-focus">
						<div v-for="focus in focusData" :key="focus.label" class="profile-focus-row">
							<div class="profile-focus-header">
								<span class="profile-focus-label">{{ focus.label }}</span>
								<span class="profile-focus-value">{{ focus.value }}%</span>
							</div>
							<div class="profile-focus-bar">
								<span class="profile-focus-fill" :style="{ width: `${focus.value}%` }"></span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import messageBox from '../plugins/messageBox';

import Tag from './Tag.vue';

// Props
const props = defineProps({
	profileData: {
		type: Object,
		required: true
	}
});

const focusData = computed(() => props.profileData.research?.focus ?? []);

// 获取public目录下图标路径（直接返回路径即可）
const getLocalIconPath = (iconPath) => {
	// public目录下的资源直接使用相对路径
	return iconPath;
};

// 打开链接
const open = (url) => {
	messageBox
		.confirm({
			title: 'Info',
			message: 'You are going to visit ' + url
		})
		.then(() => {
			window.open(url.trim(), '_blank');
		})
		.catch(() => {
			// 用户取消操作
		});
};
</script>

<style scoped>
.profile-shell {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	background: transparent;
}

.profile-card {
	position: relative;
	overflow: hidden;
	width: 100%;
	height: 100%;
	max-width: 100%;
	box-sizing: border-box;
	padding: 20px;
	background: linear-gradient(140deg, rgba(255, 255, 255, 0.45), rgba(240, 246, 255, 0.22));
	border: 1px solid rgba(148, 163, 184, 0.22);
	border-radius: 20px;
	box-shadow:
		0 18px 40px rgba(15, 23, 42, 0.12),
		0 0 0 1px rgba(255, 255, 255, 0.3) inset;
	backdrop-filter: blur(28px) saturate(160%);
}

.profile-card::before {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(120deg, rgba(255, 255, 255, 0.65), transparent 45%);
	opacity: 0.55;
	pointer-events: none;
}

.profile-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 8px 4px 6px;
}

.profile-avatar {
	width: 112px;
	height: 112px;
	border-radius: 28px;
	padding: 6px;
	background: linear-gradient(135deg, rgba(226, 238, 255, 0.8), rgba(255, 255, 255, 0.7));
	box-shadow:
		0 12px 24px rgba(15, 23, 42, 0.12),
		0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

.profile-avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 22px;
	object-fit: cover;
}

.profile-name {
	font-size: 1.3rem;
	font-weight: 700;
	color: #1f3a8a;
}

.profile-subtitle {
	font-size: 0.9rem;
	color: #64748b;
}

.profile-content {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 12px 4px 4px;
}

.profile-links {
	width: 100%;
	display: flex;
	justify-content: center;
	gap: 8px;
	flex-wrap: wrap;
}

.profile-link-item {
	display: flex;
	align-items: center;
	width: 100%;
}

.profile-link-icon {
	margin-right: 8px;
	flex-shrink: 0;
}

.profile-link-text {
	flex: 1;
	text-align: center;
}

.profile-contact {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 6px 4px;
	color: #475569;
	font-size: 0.95rem;
}

.profile-contact-item {
	display: flex;
	align-items: center;
	gap: 10px;
}

.profile-email {
	color: #2f6bff;
	text-decoration: none;
}

.profile-email:hover {
	text-decoration: underline;
}

.profile-divider {
	width: 100%;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(47, 107, 255, 0.18), transparent);
}

.profile-section {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 6px 4px;
}

.profile-section-title {
	color: #1f3a8a;
	font-weight: 600;
	font-size: 0.92rem;
	letter-spacing: 0.02em;
}

.profile-chips {
	display: grid;
	gap: 8px;
}

.profile-chip {
	padding: 8px 12px;
	border-radius: 10px;
	font-size: 0.82rem;
	color: #334155;
	background: rgba(47, 107, 255, 0.08);
	border: 1px solid rgba(47, 107, 255, 0.18);
}

.profile-focus {
	display: grid;
	gap: 8px;
}

.profile-focus-row {
	display: grid;
	gap: 6px;
	font-size: 0.8rem;
	color: #64748b;
}

.profile-focus-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.profile-focus-label {
	white-space: nowrap;
}

.profile-focus-bar {
	height: 6px;
	border-radius: 999px;
	background: rgba(148, 163, 184, 0.22);
	overflow: hidden;
}

.profile-focus-fill {
	display: block;
	height: 100%;
	background: linear-gradient(90deg, #2f6bff 0%, #6aa7ff 100%);
	border-radius: 999px;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

.profile-focus-value {
	text-align: right;
	color: #1e4dff;
	font-weight: 600;
}
</style>
