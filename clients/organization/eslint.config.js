import rootConfig from '../../eslint.config.js'
import react from 'eslint-plugin-react'
import tseslint from '@typescript-eslint/eslint-plugin'

export default [
  ...rootConfig,
  {
    plugins: {
      react,
      '@typescript-eslint': tseslint
    },
    rules: {
      'react/function-component-definition': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/prefer-default-export': 'off',
      'react/require-default-props': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'import/no-extraneous-dependencies': 'off'
    }
  },
  {
    ignores: [
      'dist',
      '.eslintrc.cjs',
      'vite.config.ts',
      'node_modules',
      'tailwind.config.js',
      'vite-env.d.ts',
      'postcss.config.js'
    ]
  }
]
