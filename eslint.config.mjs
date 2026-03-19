import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";

const tsWorkspaceFiles = ["apps/**/*.{ts,tsx,mts,cts}", "packages/**/*.{ts,tsx,mts,cts}", "workers/**/*.{ts,tsx,mts,cts}"];
const testFiles = [
  "apps/**/*.test.{ts,tsx,mts,cts}",
  "apps/**/*.spec.{ts,tsx,mts,cts}",
  "packages/**/*.test.{ts,tsx,mts,cts}",
  "packages/**/*.spec.{ts,tsx,mts,cts}",
  "workers/**/*.test.{ts,tsx,mts,cts}",
  "workers/**/*.spec.{ts,tsx,mts,cts}",
  "apps/**/{__tests__,tests}/**/*.{ts,tsx,mts,cts}",
  "packages/**/{__tests__,tests}/**/*.{ts,tsx,mts,cts}",
  "workers/**/{__tests__,tests}/**/*.{ts,tsx,mts,cts}"
];
const uiComponentFiles = [
  "packages/nextclaw-ui/src/components/**/*.tsx",
  "packages/nextclaw-ui/src/App.tsx",
  "packages/nextclaw-agent-chat-ui/src/components/**/*.tsx"
];
const orchestratorComplexityFiles = [
  "packages/nextclaw/**/*.{ts,mts,cts}",
  "packages/nextclaw-core/**/*.{ts,mts,cts}",
  "packages/nextclaw-server/**/*.{ts,mts,cts}",
  "packages/nextclaw-openclaw-compat/**/*.{ts,mts,cts}",
  "workers/**/*.{ts,mts,cts}",
  "packages/extensions/nextclaw-channel-runtime/**/*.{ts,mts,cts}"
];

const tsEslintRecommendedOverrideRules = tsEslintPlugin.configs["eslint-recommended"].overrides?.[0]?.rules ?? {};

const baseRules = {
  ...js.configs.recommended.rules,
  ...tsEslintRecommendedOverrideRules,
  ...tsEslintPlugin.configs.recommended.rules,
  ...prettier.rules,
  "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  "@typescript-eslint/consistent-type-imports": "error",
  "max-lines": ["warn", { max: 800, skipBlankLines: true, skipComments: true }],
  "max-lines-per-function": [
    "warn",
    { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true }
  ],
  "max-statements": ["warn", 30],
  "max-depth": ["warn", 4],
  "no-param-reassign": ["warn", { props: false }]
};

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "dist/**",
      "**/*.d.ts",
      "**/.wrangler/**",
      "apps/desktop/release/**",
      "packages/nextclaw/ui-dist/**"
    ]
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
  {
    files: tsWorkspaceFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin
    },
    rules: baseRules
  },
  {
    files: testFiles,
    rules: {
      "max-lines-per-function": [
        "warn",
        { max: 220, skipBlankLines: true, skipComments: true, IIFEs: true }
      ],
      "max-statements": ["warn", 45]
    }
  },
  {
    files: [
      "packages/nextclaw-openclaw-compat/**/*.{ts,tsx,mts,cts}",
      "packages/extensions/nextclaw-engine-plugin-codex-sdk/**/*.{ts,tsx,mts,cts}",
      "packages/extensions/nextclaw-engine-plugin-claude-agent-sdk/**/*.{ts,tsx,mts,cts}"
    ],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    files: ["apps/platform-console/**/*.{ts,tsx,mts,cts}", "apps/platform-admin/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off"
    }
  },
  {
    files: ["workers/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  {
    files: ["packages/nextclaw-ui/**/*.{ts,tsx,mts,cts}", "packages/nextclaw-agent-chat-ui/**/*.{ts,tsx,mts,cts}"],
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "off",
      "prefer-destructuring": [
        "warn",
        {
          VariableDeclarator: {
            array: false,
            object: true
          },
          AssignmentExpression: {
            array: false,
            object: false
          }
        }
      ]
    }
  },
  {
    files: uiComponentFiles,
    rules: {
      "max-lines-per-function": [
        "warn",
        { max: 300, skipBlankLines: true, skipComments: true, IIFEs: true }
      ],
      "max-statements": ["warn", 60]
    }
  },
  {
    files: orchestratorComplexityFiles,
    plugins: {
      sonarjs
    },
    rules: {
      "sonarjs/cognitive-complexity": ["warn", 18]
    }
  }
];
