import { defineConfig, type Options } from 'tsdown';
// import { codecovRollupPlugin } from '@codecov/rollup-plugin';

export default (pkgName: string): Options =>
	defineConfig({
		fixedExtension: false,
		target: 'node20.19', // Minimum Node version supported by Storybook 10
		loader: {
			'.md': 'text',
			'.html': 'text',
		},
		plugins: [
			// TODO: Re-enable codecov plugin once rolldown fixes the __dirname shim bug.
			// The @codecov/rollup-plugin depends on unplugin, which has its own __dirname shim.
			// When rolldown processes the config file, it injects another __dirname declaration,
			// causing "Identifier `__dirname` has already been declared" parse errors.
			// Tracking: https://github.com/rolldown/rolldown/issues/3447
			//
			// codecovRollupPlugin({
			// 	enableBundleAnalysis: true,
			// 	bundleName: pkgName,
			// 	oidc: {
			// 		useGitHubOIDC: true,
			// 	},
			// 	dryRun: process.env.CI !== 'true',
			// 	debug: true,
			// }),
		],
	}) as Options;
