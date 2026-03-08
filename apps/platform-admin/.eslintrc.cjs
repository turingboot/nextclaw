module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    browser: true,
    es2022: true
  },
  rules: {
    'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true }]
  },
  ignorePatterns: ['dist']
};
