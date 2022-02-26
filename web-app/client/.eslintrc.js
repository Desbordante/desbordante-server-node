module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    "airbnb-base",
    "airbnb-typescript",
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "prettier",
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    NodeJS: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "react-hooks"],
  rules: {
    "no-console": "warn",
    "linebreak-style": "off",
    curly: ["error", "all"],
    "implicit-arrow-linebreak": "off",
    "comma-dangle": "off",
    "brace-style": "off",
    "react/jsx-one-expression-per-line": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/interactive-supports-focus": "off",
    "operator-linebreak": "off",
    "function-paren-newline": "off",
    indent: "off",
    "react/jsx-wrap-multilines": "off",
    "@typescript-eslint/brace-style": ["error", "1tbs"],
    "react/function-component-definition": "off",
    camelcase: "off",
    "react/no-array-index-key": "off",
    "react/jsx-no-constructed-context-values": "off",
    "no-shadow": "warn",
    "@typescript-eslint/no-shadow": "warn",
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "react/prop-types": "off",
    quotes: ["error", "double"],
    "jsx-quotes": ["error", "prefer-double"],
    "jsx-a11y/click-events-have-key-events": "off",
    "import/no-unresolved": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-filename-extension": [
      1,
      { extensions: [".js", ".jsx", ".tsx"] },
    ],
    "react/button-has-type": "off",
    "react/require-default-props": "warn",
    "react/no-unused-prop-types": "warn",
    "object-curly-newline": "off",
    "no-use-before-define": ["off", "error", { variables: false }],
    "import/prefer-default-export": "off",
    "import/extensions": [
      "error",
      "ignorePackages",
      {
        js: "never",
        mjs: "never",
        jsx: "never",
        ts: "never",
        tsx: "never",
        vue: "never",
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".json", ".vue"],
        moduleDirectory: ["node_modules", "src/"],
      },
    },
  },
};
