import { nodeResolve } from '@rollup/plugin-node-resolve';
//import serve from 'rollup-plugin-serve'
//import livereload from 'rollup-plugin-livereload'
//import { terser } from "rollup-plugin-terser";

export default {
	input: 'main.js',
	output: [
		{
			format: 'umd',
			name: 'BootlegSnek',
			file: 'bundle.js'
		}
	],
	plugins: [ nodeResolve() ]

};
