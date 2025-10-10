import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@typescript-eslint': tseslint
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        alert: 'readonly',
        fetch: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLDivElement: 'readonly',
        Event: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        // React Native globals
        ErrorUtils: 'readonly',
        // TypeScript globals
        JSX: 'readonly',
        NodeJS: 'readonly'
      }
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      'no-console': 'warn',
      'max-len': [
        'warn',
        {
          code: 150
        }
      ],
      'arrow-parens': ['error', 'always'],
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-spacing': [
        'error',
        {
          before: true,
          after: true
        }
      ],
      'no-return-await': 'error',
      'no-useless-return': 'error',
      curly: ['error', 'multi-line', 'consistent'],
      'no-extra-semi': 'error',
      'space-before-blocks': ['error', 'always'],
      'space-infix-ops': 'error',
      'space-in-parens': ['error', 'never'],
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'comma-spacing': [
        'error',
        {
          before: false,
          after: true
        }
      ],
      'key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true
        }
      ],
      'block-spacing': ['error', 'always'],
      'template-curly-spacing': ['error', 'never'],
      'keyword-spacing': [
        'error',
        {
          before: true,
          after: true
        }
      ],
      'no-multi-spaces': 'error',
      'no-trailing-spaces': 'error',
      indent: [
        'error',
        2,
        {
          SwitchCase: 1
        }
      ],
      quotes: [
        'error',
        'single',
        {
          avoidEscape: true
        }
      ],
      semi: ['error', 'never'],
      'object-property-newline': [
        'error',
        {
          allowAllPropertiesOnSameLine: true
        }
      ],
      'operator-linebreak': ['error', 'before'],
      'padding-line-between-statements': [
        'error',
        {
          blankLine: 'always',
          prev: '*',
          next: 'return'
        }
      ],
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'spaced-comment': [
        'error',
        'always',
        {
          markers: ['/']
        }
      ]
    }
  },
  {
    files: ['**/__tests__/**', '**/tests/**', '**/setupTests.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    }
  },
  {
    ignores: [
      'node_modules/',
      'coverage/',
      'dist/',
      'docs/',
      'clients/website/',
      'iac/',
      '.build/',
      '.idea/',
      '.vscode/',
      'clients/organization/',
      '.github/'
    ]
  }
]
