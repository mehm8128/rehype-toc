import { defineConfig } from 'tsdown'

export default defineConfig([
	{
		entry: ['./src/index.ts'],
		target: 'esnext',
		format: ['esm'],
		clean: true,
		dts: true
	}
])
