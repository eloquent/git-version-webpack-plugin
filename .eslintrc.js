module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:n/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:promise/recommended",
    "prettier",
  ],
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    es2022: true,
    node: true,
  },
  rules: {
    "no-unused-vars": [
      "error",
      {
        // allow unused args if they start with _
        argsIgnorePattern: "^_",
      },
    ],
    // handled by import/no-unresolved
    "n/no-missing-import": "off",
    // don't check for unsupported features - too much config to make this work
    "n/no-unsupported-features/es-builtins": "off",
    "n/no-unsupported-features/es-syntax": "off",
    "n/no-unsupported-features/node-builtins": "off",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      parserOptions: {
        project: "./tsconfig.json",
      },
      settings: {
        "import/resolver": "typescript",
      },
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            // allow unused args if they start with _
            argsIgnorePattern: "^_",
          },
        ],
      },
    },
    {
      files: [
        "*.spec.js",
        "*.spec.jsx",
        "*.spec.ts",
        "*.spec.tsx",
        "*.test.js",
        "*.test.jsx",
        "*.test.ts",
        "*.test.tsx",
      ],
      extends: ["plugin:jest/recommended"],
      plugins: ["jest"],
      env: {
        jest: true,
      },
      rules: {
        // focused tests that make it to CI will cause a build failure
        "jest/no-focused-tests": "warn",
      },
    },
  ],
};
