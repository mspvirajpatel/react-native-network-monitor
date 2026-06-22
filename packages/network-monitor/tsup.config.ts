import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['cjs', 'esm'],
    dts: false,
    sourcemap: true,
    clean: true,
    external: [
      'react',
      'react-native',
      'react-native-safe-area-context',
      'expo-file-system',
      'expo-sharing',
      'react-native-fs',
    ],
    banner: {
      js: '"use strict";',
    },
  },
]);
