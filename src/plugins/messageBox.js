// src/utils/messageBox.js
import { createApp } from 'vue';
import MessageBoxManager from '../components/MessageBoxManager.vue';

let messageBoxInstance = null;

export const getMessageBoxInstance = () => {
	if (!messageBoxInstance) {
		// Create a container element
		const container = document.createElement('div');
		document.body.appendChild(container);

		// Create the app instance
		const app = createApp(MessageBoxManager);

		// Mount the component
		const instance = app.mount(container);
		messageBoxInstance = instance;
	}
	return messageBoxInstance;
};

export const showMessageBox = (options) => {
	const instance = getMessageBoxInstance();
	return instance.show(options);
};

export const confirmMessageBox = (options) => {
	const instance = getMessageBoxInstance();
	return instance.confirm(options);
};

// Export default object
export default {
	show: showMessageBox,
	confirm: confirmMessageBox
};
