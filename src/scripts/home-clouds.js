// CSS owns the drift; hidden tabs retain their position without running motion.
const syncCloudVisibility = () => {
	document.documentElement.dataset.cloudsPaused = String(document.hidden);
};
syncCloudVisibility();
document.addEventListener('visibilitychange', syncCloudVisibility);
const disposeClouds = () => {
	document.removeEventListener('visibilitychange', syncCloudVisibility);
	delete document.documentElement.dataset.cloudsPaused;
};
document.addEventListener('astro:before-swap', disposeClouds, { once: true });
window.addEventListener('pagehide', (event) => {
	if (!event.persisted) disposeClouds();
}, { once: true });
