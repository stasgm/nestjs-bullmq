const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');
const sonarjs = require('eslint-plugin-sonarjs');

module.exports = [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        node: true,
        jest: true,
        es2022: true,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
      sonarjs,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...prettierConfig.rules,
      ...sonarjs.configs.recommended.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/no-explicit-any': 'off',
      'max-len': [
        'error',
        {
          code: 120,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreStrings: true,
          ignoreUrls: true,
        },
      ],
      'no-console': ['error'],
      complexity: ['error', 7],
      'spaced-comment': [2, 'always'],
      'sonarjs/todo-tag': 'off',
      'sonarjs/no-commented-code': 'warn',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'src/generated/**/*',
    ],
  },
];
