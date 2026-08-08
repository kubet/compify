import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta = { title: "Example/Button", component: Button } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { label: "Review me" } };
export const Disabled: Story = { args: { label: "Unavailable", disabled: true } };
