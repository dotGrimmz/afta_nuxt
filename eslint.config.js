import nuxt from "@nuxt/eslint-config";
import prettier from "eslint-config-prettier";

const nuxtConfigs = await nuxt();

export default [
  ...nuxtConfigs,
  prettier,
  {
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
