const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const prettierPlugin = require('eslint-plugin-prettier');

// CommonJS flat config so ESLint v9 can load without package "type": "module".
module.exports = [
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      'out',
      'coverage',
      '.next',
      '.eslintrc.js',
      '*.log',
      '.env',
      '.env.local',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./backend/tsconfig.json', './backend/test/tsconfig.json', './web/tsconfig.json', './shared/tsconfig.json'],
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // TypeScript provides better undefined-variable detection, and Node globals
      // (process, Buffer, __dirname) are valid in backend code.
      'no-undef': 'off',
      'prettier/prettier': 'error',
    },
  },
];