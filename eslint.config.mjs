// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.angular/**'],
  },

  // --- TypeScript : backend, workers, bibliothèques partagées ---
  {
    files: ['{shared,backend,ocr-worker,classifier-worker}/**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, prettier],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      // Une variable préfixée d'un « _ » signale un rejet volontaire (déstructuration qui écarte
      // un champ) : c'est une intention, pas un oubli.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // --- TypeScript : composants Angular ---
  {
    files: ['frontend/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      prettier,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      // Préfixe et casse des sélecteurs : « app-xxx » pour un composant, « appXxx » pour une directive.
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
    },
  },

  // --- Gabarits Angular : accessibilité et correction du HTML ---
  // Ces règles n'étaient **pas applicables** tant que les gabarits vivaient dans des littéraux de
  // gabarit : c'est l'externalisation qui les rend possibles.
  {
    files: ['frontend/**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Un `(click)` sur un élément non interactif est inatteignable au clavier : soit un `<button>`,
      // soit un gestionnaire clavier équivalent.
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      // Un contrôle de formulaire sans étiquette associée n'est pas annoncé par un lecteur d'écran.
      '@angular-eslint/template/label-has-associated-control': 'error',
    },
  },
);
