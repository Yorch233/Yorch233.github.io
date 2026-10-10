import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
	{ ignores: ['dist/**', 'node_modules/**', '.astro/**', 'public/**', 'test-results/**', 'playwright-report/**', 'gui-test-screenshots/**'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	...astro.configs.recommended,
	{
		languageOptions: {
			parserOptions: { ecmaFeatures: { jsx: true } }
		}
	},
	{
		files: ['src/**'],
		languageOptions: { globals: { ...globals.browser } }
	},
	{
		files: ['src/components/preact/**/*.jsx'],
		plugins: { 'react-hooks': reactHooks },
		rules: {
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn'
		}
	},
	{
		files: ['scripts/**', '*.config.*', 'tests/**'],
		languageOptions: { globals: { ...globals.node } }
	},
	{
		// Inline first-paint scripts in .astro files keep a deliberate ES5 style.
		// These two relaxations are global because the astro plugin reports them
		// from extracted script content that ignores files-scoped overrides.
		rules: {
			'no-var': 'off',
			'no-empty': ['error', { allowEmptyCatch: true }]
		}
	},
	{
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
		}
	}
);
