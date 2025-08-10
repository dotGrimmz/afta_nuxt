import SectionCard from "./SectionCard.vue";
import type { Meta, StoryObj } from "@storybook/vue3";

const meta: Meta<typeof SectionCard> = {
  title: "Components/Button",
  component: SectionCard,
};
export default meta;

type Story = StoryObj<typeof SectionCard>;

export const Primary: Story = {
  args: {},
};
