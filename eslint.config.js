import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      semi: ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    ignores: ['node_modules/']
  }
];
