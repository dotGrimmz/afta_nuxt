import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  framework: { name: "@storybook/vue3-vite", options: {} },

  // 👇 Add your globs here (relative to .storybook/)
  stories: [
    "../components/**/*.stories.@(js|ts)",
    "../components/**/*.mdx",
    // optional extra folders:
    "../layouts/**/*.stories.@(js|ts)",
    "../pages/**/*.stories.@(js|ts)",
    "../stories/**/*.stories.@(js|ts|mdx)",
  ],

  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
};
export default config;
